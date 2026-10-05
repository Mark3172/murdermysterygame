import Phaser from 'phaser';
import { EventBus } from '../engine/EventBus';
import { gameState } from '../logic/GameState';
import { storyManager } from '../logic/StoryPhaseManager';
import { SaveManager } from '../engine/SaveManager';
import { AudioManager } from '../engine/AudioManager';
import { PixelRenderer } from '../rendering/PixelRenderer';
import { rooms, RoomData } from '../data/rooms';
import { suspects } from '../data/suspects';
import { evidence as evidenceData } from '../data/evidence';
import { dialogue } from '../data/dialogue';

const TILE = 16;
const SPEED = 80;

export class ExplorationScene extends Phaser.Scene {
  private roomId = 'main_hall';
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerTag!: Phaser.GameObjects.Text;
  private playerFacing: 'down' | 'up' | 'left' | 'right' = 'down';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private inDialogue = false;
  private activeGadget: string | null = null;
  private gadgetOverlay: Phaser.GameObjects.Rectangle | null = null;
  private interactableObjects: Array<{zone: Phaser.GameObjects.Zone; data: any; marker: any; label: Phaser.GameObjects.Text; propSprite?: Phaser.GameObjects.Image}> = [];
  private npcObjects: Array<{sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle; data: any; label: Phaser.GameObjects.Text}> = [];
  private touchDir = {x:0, y:0};
  private touchAction = false;
  private nextFootstepTime = 0;
  private lightningTimer?: Phaser.Time.TimerEvent;
  private interactionPrompt!: Phaser.GameObjects.Text;
  private doorCooldown = true;
  private obstacleColliders!: Phaser.Physics.Arcade.StaticGroup;
  private focusHighlights: Phaser.GameObjects.GameObject[] = [];
  private currentRoomZoom = 1;

  constructor() { super('ExplorationScene'); }

  init(data: any) {
    this.roomId = data?.roomId || gameState.getCurrentRoom() || 'main_hall';
    this.inDialogue = false;
    this.activeGadget = null;
    this.doorCooldown = true;
    this.focusHighlights = [];
    this.currentRoomZoom = 1;
  }

  create() {
    const room = rooms[this.roomId];
    if (!room) { this.scene.start('TitleScene'); return; }
    gameState.setCurrentRoom(this.roomId);
    EventBus.emit('room-changed', this.roomId);

    // Ensure all 5 detective gadgets are unlocked so the player can immediately investigate
    const detectiveGadgets = ['tranquility_focus', 'echo_lens', 'trace_light', 'micro_rover', 'voice_prism'];
    detectiveGadgets.forEach(g => gameState.unlockGadget(g));
    EventBus.emit('gadget-unlocked', null);

    // Ensure phase is at least investigation_1 so clues and objectives match
    const curP = gameState.getPhase();
    if (!curP || ['cold_open', 'opening_title', 'arrival', 'announcement', 'blackout', 'discovery'].includes(curP)) {
      gameState.setPhase('investigation_1');
    }

    const rw = (room.width || 40) * TILE;
    const rh = (room.height || 22) * TILE;

    // Ensure all architectural tiles, props and character sprites are generated
    PixelRenderer.generateTileTextures(this);
    PixelRenderer.generateAllProps(this);
    PixelRenderer.generateCharacterSprite(this, 'ren');

    // 1. Draw Architectural Room Architecture (Walls, Floors, Carpets)
    this.renderRoomArchitecture(room, rw, rh);

    // 2. Room features (props, machinery, windows)
    this.drawFeatures(room, rw, rh);

    // 3. Player with authentic 16-bit RPG animated detective pixel art sprite
    const wallH = TILE * 3;
    let rawSx = this.registry.get('spawnX') as number || (room.spawnPoint?.x || rw/2/TILE) * TILE;
    let rawSy = this.registry.get('spawnY') as number || (room.spawnPoint?.y || rh/2/TILE) * TILE;
    this.registry.remove('spawnX'); this.registry.remove('spawnY');

    // Safety clamp to ensure Ren is in the open floor area and never trapped inside walls
    const sx = Phaser.Math.Clamp(rawSx, 32, rw - 32);
    const sy = Phaser.Math.Clamp(rawSy, wallH + 20, rh - 32);

    // Shadow
    this.playerShadow = this.add.ellipse(sx, sy + 15, 18, 7, 0x000000, 0.45).setDepth(sy - 1);

    // Player sprite
    this.player = this.physics.add.sprite(sx, sy, 'char_ren', 'down_0').setDepth(sy);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(14, 12).setOffset(5, 22);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.playerFacing = 'down';

    // Player tag (hidden from view for clean 16-bit immersion)
    this.playerTag = this.add.text(sx, sy - 24, 'Ren', {
      fontSize: '8px', color: '#7ab4f8', fontFamily: 'Courier New', backgroundColor: '#060a16d0', padding: { x: 4, y: 1 }
    }).setOrigin(0.5).setDepth(300).setVisible(false);

    const hud = document.getElementById('hud-bar');
    if (hud) hud.style.display = 'flex';

    this.physics.world.setBounds(0, 0, rw, rh);

    // Calculate adaptive zoom so the room fills the 640x360 screen without black borders
    const zoomX = 640 / rw;
    const zoomY = 360 / rh;
    this.currentRoomZoom = Math.max(1, Math.max(zoomX, zoomY));
    this.cameras.main.setZoom(this.currentRoomZoom);
    this.cameras.main.setBounds(0, 0, rw, rh);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300);

    // Setup physical obstacle colliders so player doesn't clip through walls or furniture
    this.setupObstacleColliders(room, rw, rh);

    // Guard to prevent accidental immediate bounce loop on room entry
    this.doorCooldown = true;
    this.time.delayedCall(1200, () => {
      this.doorCooldown = false;
    });

    // 4. Grand Ornate Doors & Exits
    if (room.exits) for (const exit of room.exits) {
      if (exit.direction === 'hidden') continue;
      const ex = exit.x * TILE, ey = exit.y * TILE;
      const tgt = rooms[exit.targetRoom];
      const targetName = tgt ? tgt.name.toUpperCase() : exit.targetRoom.toUpperCase();

      // Doorway architecture (authentic Victorian arched double doors)
      if (this.textures.exists('door_victorian_ornate')) {
        this.add.image(ex, ey, 'door_victorian_ornate').setDepth(11);
      } else {
        const doorBg = this.add.rectangle(ex, ey, 28, 28, 0x2a1a10).setDepth(10);
        const doorFrame = this.add.graphics();
        doorFrame.lineStyle(2, 0xd4af37, 0.85);
        doorFrame.strokeRect(ex - 14, ey - 14, 28, 28);
        doorFrame.setDepth(11);
      }

      // Entrance lanterns
      const l1 = this.add.circle(ex - 18, ey, 3, 0xffea70, 0.8).setDepth(12);
      const l2 = this.add.circle(ex + 18, ey, 3, 0xffea70, 0.8).setDepth(12);
      this.tweens.add({ targets: [l1, l2], alpha: 0.5, yoyo: true, repeat: -1, duration: 1200 });

      // High-contrast Door Banner (clickable with mouse)
      const labelY = exit.direction === 'down' ? ey - 18 : ey + 18;
      const doorBadge = this.add.text(ex, labelY, `🚪 TO ${targetName}`, {
        fontSize: '8px', color: '#ffea70', fontFamily: 'Courier New, monospace', fontStyle: 'bold',
        backgroundColor: '#0a0d1aec', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(200).setInteractive({ useHandCursor: true });

      doorBadge.on('pointerdown', () => {
        if (!this.doorCooldown && !this.inDialogue) {
          this.goToRoom(exit.targetRoom, exit.direction);
        }
      });

      // Tightened doorway trigger zone at doorway threshold
      let tzX = ex;
      let tzY = ey;
      let tzW = 32;
      let tzH = 16;

      if (exit.direction === 'up' || ey <= 2 * TILE) {
        tzY = wallH - 8;
        tzH = 16;
        tzW = 32;
      } else if (exit.direction === 'down' || ey >= rh - 3 * TILE) {
        tzY = rh - 8;
        tzH = 16;
        tzW = 32;
      } else if (exit.direction === 'left' || ex <= 2 * TILE) {
        tzX = 8;
        tzW = 16;
        tzH = 32;
      } else if (exit.direction === 'right' || ex >= rw - 3 * TILE) {
        tzX = rw - 8;
        tzW = 16;
        tzH = 32;
      }

      const z = this.add.zone(tzX, tzY, tzW, tzH);
      this.physics.add.existing(z, true);
      this.physics.add.overlap(this.player, z, () => {
        if (!this.doorCooldown && !this.inDialogue) {
          this.goToRoom(exit.targetRoom, exit.direction);
        }
      });
    }

    // 5. Interactables (Dedicated Pixel Art Props & Gleaming Clues)
    this.interactableObjects = [];
    PixelRenderer.generateAllProps(this);

    if (room.interactables) for (const obj of room.interactables) {
      if (obj.evidenceId && gameState.hasEvidence(obj.evidenceId)) continue;
      if (obj.gadgetRequired && obj.gadgetRequired !== 'none' && obj.gadgetRequired !== 'tranquility_focus' && !gameState.hasGadget(obj.gadgetRequired)) continue;
      const ox = obj.x * TILE, oy = obj.y * TILE;
      const ow = (obj.width || 2) * TILE, oh = (obj.height || 1) * TILE;

      const z = this.add.zone(ox, oy, ow + 8, oh + 8);
      this.physics.add.existing(z, true);
      z.setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (!this.inDialogue) this.interact(obj);
      });

      // Shadow under prop
      this.add.ellipse(ox, oy + oh/2 + 2, Math.max(ow * 0.85, 14), 6, 0x000000, 0.45).setDepth(oy - 1);

      // Dedicated Pixel Art Prop Texture (tabletop items layered above furniture base)
      const propKey = PixelRenderer.getPropKey(obj.id, this.roomId);
      const propDepth = ['thermos', 'spilled_ink'].includes(obj.id) ? oy + 2 : oy;
      const propSprite = this.add.image(ox, oy, propKey).setDepth(propDepth);

      // Special animations for interactive props
      if (obj.id === 'main_gear') {
        this.tweens.add({ targets: propSprite, angle: 360, duration: 20000, repeat: -1 });
      } else if (obj.id === 'pendulum') {
        this.tweens.add({ targets: propSprite, angle: -12, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
      }

      // Golden diamond sparkle marker with gleaming pulse
      const mk = this.add.image(ox, oy - oh/2 - 8, 'sparkle_gleam').setDepth(oy + 20);
      this.tweens.add({ targets: mk, y: oy - oh/2 - 12, alpha: 0.5, scale: 0.85, yoyo: true, repeat: -1, duration: 600 });

      // Label
      const lb = this.add.text(ox, oy + oh/2 + 10, `🔍 ${obj.name}`, {
        fontSize: '8px', color: '#ffea70', fontFamily: 'Courier New', backgroundColor: '#090d18ee', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(oy + 30).setVisible(false);

      this.interactableObjects.push({ zone: z, data: obj, marker: mk as any, label: lb, propSprite });
    }

    // 6. NPCs with Real Pixel Art Sprites, Role Badges and Unread Indicators
    this.npcObjects = [];
    if (room.npcs) for (const npc of room.npcs) {
      const sus = npc.suspectId ? suspects[npc.suspectId] : null;
      const charId = npc.suspectId || 'nadia';
      PixelRenderer.generateCharacterSprite(this, charId);

      const nx = npc.x * TILE, ny = npc.y * TILE;

      // Soft Shadow
      this.add.ellipse(nx, ny + 11, 16, 6, 0x000000, 0.45).setDepth(ny - 1);

      // Character pixel art sprite
      const sp = this.add.sprite(nx, ny, `char_${charId}`, 'down_0').setDepth(ny);
      sp.setInteractive({ useHandCursor: true });
      sp.on('pointerdown', () => {
        if (!this.inDialogue) {
          this.inDialogue = true;
          const did = npc.suspectId ? `${npc.suspectId}_interview` : 'intro_arrival';
          this.scene.launch('DialogueScene', { dialogueId: did, suspectId: npc.suspectId });
        }
      });

      // Subtle breathing idle tween
      this.tweens.add({ targets: sp, y: ny - 1, yoyo: true, repeat: -1, duration: 1800 + Math.random() * 600, ease: 'Sine.easeInOut' });

      // Role and title badge
      const roleIcons: Record<string, string> = {
        nadia: '🎵', vale: '🧪', hugo: '👨‍⚕️', petra: '📷', felix: '💎', iris: '⚙️'
      };
      const icon = sus ? roleIcons[sus.id] || '👤' : '👤';
      const roleLabel = sus ? `${sus.name} • ${sus.title}` : npc.id;
      const lb = this.add.text(nx, ny + 18, roleLabel, {
        fontSize: '8px', color: '#ffd700', fontFamily: 'Courier New, monospace', backgroundColor: '#090d1af0', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(ny + 100).setVisible(false);

      // Diamond sparkle marker for un-interviewed suspects
      if (sus && !gameState.isSuspectInterviewed(sus.id)) {
        const exclaim = this.add.image(nx, ny - 24, 'sparkle_gleam').setDepth(ny + 101);
        this.tweens.add({ targets: exclaim, y: ny - 28, alpha: 0.5, yoyo: true, repeat: -1, duration: 600 });
      }

      this.npcObjects.push({ sprite: sp as any, data: npc, label: lb });
    }

    // Dust particles
    for (let i=0; i<10; i++) {
      const d = this.add.circle(Math.random()*640, Math.random()*360, 1, 0xc4a44a, 0.15+Math.random()*0.15).setDepth(250).setScrollFactor(0);
      this.tweens.add({targets:d, x:d.x+(Math.random()-0.5)*100, y:d.y+(Math.random()-0.5)*50, alpha:0, duration:4000+Math.random()*3000, repeat:-1, yoyo:true});
    }

    // Grand Victorian Room Entrance Placard
    this.showRoomPlacard(room);

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = {
        W: this.input.keyboard.addKey('W'), A: this.input.keyboard.addKey('A'),
        S: this.input.keyboard.addKey('S'), D: this.input.keyboard.addKey('D'),
        E: this.input.keyboard.addKey('E'), N: this.input.keyboard.addKey('N'),
      };
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.scene.isActive('CutsceneScene')) return;
        this.scene.launch('SettingsScene');
      });
      this.input.keyboard.on('keydown-M', () => {
        if (this.scene.isActive('NotebookScene')) {
          const nb = this.scene.get('NotebookScene') as any;
          if (nb && nb.switchTab) nb.switchTab('map');
        } else {
          this.scene.launch('NotebookScene', { tab: 'map' });
        }
      });
      this.input.keyboard.on('keydown-ONE', () => this.useGadget('tranquility_focus'));
      this.input.keyboard.on('keydown-TWO', () => this.useGadget('echo_lens'));
      this.input.keyboard.on('keydown-THREE', () => this.useGadget('trace_light'));
      this.input.keyboard.on('keydown-FOUR', () => this.useGadget('micro_rover'));
      this.input.keyboard.on('keydown-FIVE', () => this.useGadget('voice_prism'));
      this.input.keyboard.on('keydown-NUMPAD_ONE', () => this.useGadget('tranquility_focus'));
      this.input.keyboard.on('keydown-NUMPAD_TWO', () => this.useGadget('echo_lens'));
      this.input.keyboard.on('keydown-NUMPAD_THREE', () => this.useGadget('trace_light'));
      this.input.keyboard.on('keydown-NUMPAD_FOUR', () => this.useGadget('micro_rover'));
      this.input.keyboard.on('keydown-NUMPAD_FIVE', () => this.useGadget('voice_prism'));
    }

    // Touch
    const isMobile = 'ontouchstart' in window;
    const tc = document.getElementById('touch-controls');
    const ta = document.getElementById('touch-action');
    if (isMobile && tc && ta) {
      tc.style.display = 'block'; ta.style.display = 'flex';
      tc.querySelectorAll('.touch-btn[data-dir]').forEach(b => {
        const dir = (b as HTMLElement).dataset.dir;
        b.addEventListener('touchstart', e => { e.preventDefault(); if(dir==='up')this.touchDir.y=-1; if(dir==='down')this.touchDir.y=1; if(dir==='left')this.touchDir.x=-1; if(dir==='right')this.touchDir.x=1; });
        b.addEventListener('touchend', e => { e.preventDefault(); if(dir==='up'||dir==='down')this.touchDir.y=0; if(dir==='left'||dir==='right')this.touchDir.x=0; });
      });
      ta.addEventListener('touchstart', e => { e.preventDefault(); this.touchAction = true; });
    }

    // HUD
    this.scene.launch('UIScene');

    // Events
    EventBus.on('dialogue-ended', () => { this.inDialogue = false; this.checkAdvance(); });
    EventBus.on('start-reconstruction', () => this.scene.start('ReconstructionScene'));
    EventBus.on('start-deduction', () => this.scene.start('DeductionScene'));
    EventBus.on('gadget-selected', (gadgetId: string) => {
      this.useGadget(gadgetId);
    });
    EventBus.on('toggle-notebook', (data?: { tab?: string }) => {
      if (this.scene.isActive('NotebookScene')) {
        if (data?.tab) {
          const nb = this.scene.get('NotebookScene') as any;
          if (nb && nb.switchTab) nb.switchTab(data.tab);
        } else {
          this.scene.stop('NotebookScene');
        }
      } else {
        this.scene.launch('NotebookScene', data);
      }
    });

    const onFastTravel = ({ roomId }: { roomId: string }) => {
      if (this.roomId === roomId || this.inDialogue) return;
      this.clearTranquilityFocus();
      AudioManager.getInstance().playSFX('doorOpen');
      const td = rooms[roomId];
      if (!td) return;
      const sx = (td.width || 40) * TILE / 2;
      const sy = (td.height || 22) * TILE / 2;
      this.registry.set('spawnX', sx);
      this.registry.set('spawnY', sy);
      this.cameras.main.fadeOut(200);
      let transitioned = false;
      const doRestart = () => {
        if (transitioned) return;
        transitioned = true;
        this.scene.restart({ roomId });
      };
      this.cameras.main.once('camerafadeoutcomplete', doRestart);
      this.time.delayedCall(250, doRestart);
    };

    EventBus.on('fast-travel', onFastTravel);

    // Cutscene check
    const phase = storyManager.getCurrentPhase();
    if (phase?.cutsceneOnEnter && !gameState.hasCutsceneSeen(phase.cutsceneOnEnter))
      this.scene.start('CutsceneScene', { cutsceneId: phase.cutsceneOnEnter });

    // Audio & Atmosphere
    try {
      AudioManager.getInstance().init();
      const track = storyManager.getMusicTrack() || 'exploration';
      AudioManager.getInstance().startMusic(track);
    } catch(e) {}

    // Storm lightning effect
    this.lightningTimer = this.time.addEvent({
      delay: Phaser.Math.Between(16000, 28000),
      loop: true,
      callback: () => {
        if (!this.cameras?.main) return;
        this.cameras.main.flash(280, 210, 225, 255);
        this.time.delayedCall(400, () => {
          AudioManager.getInstance().playSFX('thunder');
        });
      }
    });

    // Interactive HUD prompt
    this.interactionPrompt = this.add.text(320, 325, '', {
      fontSize: '11px',
      color: '#ffea70',
      backgroundColor: '#0a0e1cf0',
      padding: { x: 12, y: 5 },
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5).setDepth(600).setScrollFactor(0).setVisible(false).setInteractive({ useHandCursor: true });

    this.interactionPrompt.on('pointerdown', () => {
      this.touchAction = true;
    });

    EventBus.on('interaction-prompt-clicked', () => {
      this.touchAction = true;
    });

    this.events.once('shutdown', () => {
      if (this.lightningTimer) this.lightningTimer.destroy();
      EventBus.off('fast-travel', onFastTravel);
      EventBus.emit('update-prompt', { text: '', visible: false });
    });

    this.save();
  }

  update() {
    // Safety: auto-recover if inDialogue was set but DialogueScene or mini-games are no longer active
    const dialogueDomActive = typeof document !== 'undefined' && document.getElementById('dialogue-container')?.style.display === 'flex';
    const isMiniGameActive = this.inDialogue && (this.activeGadget === 'echo_lens' || this.activeGadget === 'micro_rover' || this.activeGadget === 'voice_prism');
    if (this.inDialogue && !dialogueDomActive && !isMiniGameActive) {
      if (this.scene.isActive('DialogueScene')) {
        this.scene.stop('DialogueScene');
      }
      this.inDialogue = false;
    }

    if (this.inDialogue) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);
      this.interactionPrompt.setVisible(false);
      return;
    }

    let dx=0, dy=0;
    if (this.cursors?.left?.isDown || this.keys.A?.isDown) dx -= 1;
    if (this.cursors?.right?.isDown || this.keys.D?.isDown) dx += 1;
    if (this.cursors?.up?.isDown || this.keys.W?.isDown) dy -= 1;
    if (this.cursors?.down?.isDown || this.keys.S?.isDown) dy += 1;
    if (this.touchDir.x||this.touchDir.y) { dx=this.touchDir.x; dy=this.touchDir.y; }

    const len = Math.sqrt(dx*dx+dy*dy);
    if (len > 0) {
      dx=(dx/len)*SPEED; dy=(dy/len)*SPEED;
      if (Math.abs(dy) >= Math.abs(dx)) {
        this.playerFacing = dy > 0 ? 'down' : 'up';
      } else {
        this.playerFacing = dx > 0 ? 'right' : 'left';
      }
      this.player.anims.play(`ren_walk_${this.playerFacing}`, true);

      if (this.time.now > this.nextFootstepTime) {
        AudioManager.getInstance().playSFX('footstep');
        this.nextFootstepTime = this.time.now + 360;
      }
    } else {
      this.player.anims.stop();
      this.player.setFrame(`${this.playerFacing}_0`);
    }
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(dx, dy);

    // Room bounds clamp (leaving doorways accessible)
    const curRoom = rooms[this.roomId];
    if (curRoom) {
      const rw = (curRoom.width || 40) * TILE;
      const rh = (curRoom.height || 22) * TILE;
      this.player.x = Phaser.Math.Clamp(this.player.x, 8, rw - 8);
      this.player.y = Phaser.Math.Clamp(this.player.y, 8, rh - 8);
    }

    this.playerShadow.setPosition(this.player.x, this.player.y + 15);
    this.playerShadow.setDepth(this.player.y - 1);
    if (this.playerTag.visible) this.playerTag.setPosition(this.player.x, this.player.y - 24);
    this.player.setDepth(this.player.y);

    // Proximity
    let nearObj: typeof this.interactableObjects[0]|null = null;
    let nearDist = 45;
    for (const ia of this.interactableObjects) {
      if (ia.data.id === 'desk' && !gameState.hasEvidence('poisoned_tea')) {
        ia.label.setVisible(false);
        continue;
      }
      if (ia.data.id === 'archive_desk' && !gameState.hasEvidence('felix_ink_stain')) {
        ia.label.setVisible(false);
        continue;
      }

      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, ia.zone.x, ia.zone.y);
      ia.label.setVisible(d < 45);
      if (d < nearDist) { nearObj = ia; nearDist = d; }
    }

    let nearNpc: typeof this.npcObjects[0]|null = null;
    for (const n of this.npcObjects) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.sprite.x, n.sprite.y);
      n.label.setVisible(d < 50);
      if (d < 45) nearNpc = n;
    }

    // Update floating interaction prompt (dispatches to high-DPI HTML overlay)
    if (nearNpc) {
      const sus = nearNpc.data.suspectId ? suspects[nearNpc.data.suspectId] : null;
      const promptText = `💬 [E] Talk to ${sus?.name || nearNpc.data.id}`;
      this.interactionPrompt.setText(promptText);
      EventBus.emit('update-prompt', { text: promptText, visible: true });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('update-prompt', { detail: { text: promptText, visible: true } }));
      }
    } else if (nearObj) {
      const promptText = `🔍 [E] Examine ${nearObj.data.name}`;
      this.interactionPrompt.setText(promptText);
      EventBus.emit('update-prompt', { text: promptText, visible: true });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('update-prompt', { detail: { text: promptText, visible: true } }));
      }
    } else {
      EventBus.emit('update-prompt', { text: '', visible: false });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('update-prompt', { detail: { text: '', visible: false } }));
      }
    }

    if (this.keys.E && Phaser.Input.Keyboard.JustDown(this.keys.E) || this.touchAction) {
      this.touchAction = false;
      if (nearNpc) {
        this.inDialogue = true;
        this.interactionPrompt.setVisible(false);
        EventBus.emit('update-prompt', { text: '', visible: false });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('update-prompt', { detail: { text: '', visible: false } }));
        }
        const did = nearNpc.data.suspectId ? `${nearNpc.data.suspectId}_interview` : 'intro_arrival';
        this.scene.launch('DialogueScene', {dialogueId:did, suspectId:nearNpc.data.suspectId});
      } else if (nearObj) {
        try {
          this.interact(nearObj.data);
        } catch (err) {
          console.error('[ExplorationScene] interact error:', err);
        }
      }
    }

    if (this.keys.N && Phaser.Input.Keyboard.JustDown(this.keys.N)) EventBus.emit('toggle-notebook');
  }

  private toggleTranquilityFocus() {
    this.clearTranquilityFocus();
    if (this.activeGadget !== 'tranquility_focus') return;

    AudioManager.getInstance().playSFX('discoveryString');
    this.showMsg('🧠 TRANQUILITY FOCUS • Detective vision active. Points of interest illuminated.');

    // Highlight interactable clues
    for (const obj of this.interactableObjects) {
      if (obj.data.evidenceId && gameState.hasEvidence(obj.data.evidenceId)) continue;
      const ox = obj.zone.x, oy = obj.zone.y;
      const halo = this.add.circle(ox, oy, 22, 0x4ac4e2, 0.28).setDepth(140);
      this.tweens.add({ targets: halo, scale: 1.35, alpha: 0.1, yoyo: true, repeat: -1, duration: 800 });
      const tag = this.add.text(ox, oy - 20, `✦ ${obj.data.name.toUpperCase()}`, {
        fontSize: '8px', color: '#ffd700', fontFamily: 'Courier New', fontStyle: 'bold',
        backgroundColor: '#0a1020f0', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(200);
      this.focusHighlights.push(halo, tag);
    }

    // Highlight suspects
    for (const npc of this.npcObjects) {
      const sx = npc.sprite.x, sy = npc.sprite.y;
      const halo = this.add.circle(sx, sy, 26, 0xffd700, 0.28).setDepth(140);
      this.tweens.add({ targets: halo, scale: 1.3, alpha: 0.1, yoyo: true, repeat: -1, duration: 750 });
      const tag = this.add.text(sx, sy - 28, `★ ${npc.data.suspectId ? npc.data.suspectId.toUpperCase() : 'SUSPECT'}`, {
        fontSize: '8px', color: '#ffea70', fontFamily: 'Courier New', fontStyle: 'bold',
        backgroundColor: '#181206f0', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(200);
      this.focusHighlights.push(halo, tag);
    }
  }

  private clearTranquilityFocus() {
    this.focusHighlights.forEach(h => h.destroy());
    this.focusHighlights = [];
  }

  private interact(obj: any) {
    // Contextual tabletop delegation (examining desk inspects the clue atop it)
    if (obj.id === 'desk' && !gameState.hasEvidence('poisoned_tea')) {
      const room = rooms[this.roomId];
      const thermos = room?.interactables?.find((i: any) => i.id === 'thermos');
      if (thermos) {
        this.interact(thermos);
        return;
      }
    }
    if (obj.id === 'archive_desk' && !gameState.hasEvidence('felix_ink_stain')) {
      const room = rooms[this.roomId];
      const ink = room?.interactables?.find((i: any) => i.id === 'spilled_ink');
      if (ink) {
        this.interact(ink);
        return;
      }
    }

    // Contextual handling for Micro Rover duct deployment
    if (obj.id === 'wall_gap' || obj.gadgetRequired === 'micro_rover') {
      if (gameState.hasEvidence('connecting_door')) {
        this.showMsg('The Micro Rover has already mapped the hidden connecting door through this gap.');
      } else {
        this.microRoverMini();
      }
      return;
    }

    // Contextual handling for Voice Prism audio sources
    if (obj.gadgetRequired === 'voice_prism' || ['pa_speaker', 'dark_corner'].includes(obj.id)) {
      if (obj.evidenceId && gameState.hasEvidence(obj.evidenceId)) {
        this.showMsg('The Voice Prism has already analyzed this audio source.');
      } else {
        this.voicePrismMini();
      }
      return;
    }

    // Contextual handling for Echo Lens acoustic resonance / environmental sensors
    if (obj.gadgetRequired === 'echo_lens' || ['acoustics', 'deck_sensors', 'floor_grates'].includes(obj.id)) {
      if (obj.evidenceId && gameState.hasEvidence(obj.evidenceId)) {
        this.showMsg('The Echo Lens has already recorded the acoustic telemetry for this area.');
      } else {
        this.echoLensMini();
      }
      return;
    }

    // Contextual handling for Trace Light items (auto-activate if unlocked)
    if (obj.gadgetRequired === 'trace_light') {
      if (gameState.hasGadget('trace_light') && this.activeGadget !== 'trace_light') {
        this.useGadget('trace_light');
      }
    }

    if (obj.gadgetRequired && obj.gadgetRequired !== 'none' && this.activeGadget !== obj.gadgetRequired) {
      const gMap: Record<string, string> = {
        tranquility_focus: 'Tranquility Focus [1]',
        echo_lens: 'Echo Lens [2]',
        trace_light: 'Trace Light [3]',
        micro_rover: 'Micro Rover [4]',
        voice_prism: 'Voice Prism [5]'
      };
      this.showMsg(`Requires: ${gMap[obj.gadgetRequired] || obj.gadgetRequired.replace('_', ' ')}`);
      return;
    }

    if (obj.evidenceId && !gameState.hasEvidence(obj.evidenceId)) {
      gameState.collectEvidence(obj.evidenceId);
      const ev = evidenceData[obj.evidenceId];
      // Immediately dispose of clue sparkling markers upon evidence collection
      const itemObj = this.interactableObjects.find(io => io.data.id === obj.id);
      if (itemObj?.marker) {
        itemObj.marker.destroy();
        itemObj.marker = null;
      }
      this.showDiscovery(ev?.name||obj.evidenceId, ev?.shortDesc||obj.description||'Evidence collected.');
      this.save(); return;
    }
    if (obj.dialogueOnInteract) {
      if (dialogue[obj.dialogueOnInteract]) {
        this.inDialogue = true;
        this.scene.launch('DialogueScene', {dialogueId:obj.dialogueOnInteract});
      } else {
        this.showMsg(obj.dialogueOnInteract);
      }
      return;
    }
    this.showMsg(obj.description||'Nothing unusual here.');
  }

  private useGadget(id: string) {
    if (!gameState.hasGadget(id)) { this.showMsg('Gadget not unlocked yet.'); return; }
    if (this.activeGadget === id) {
      this.activeGadget = null;
      this.gadgetOverlay?.destroy();
      this.gadgetOverlay = null;
      this.clearTranquilityFocus();
      for (const io of this.interactableObjects) {
        if (io.marker && typeof (io.marker as any).clearTint === 'function') {
          (io.marker as any).clearTint();
        }
      }
      EventBus.emit('gadget-changed', null);
      return;
    }
    this.clearTranquilityFocus();
    this.activeGadget = id;
    this.gadgetOverlay?.destroy();

    const colors: Record<string, number> = {
      tranquility_focus: 0x1a385a,
      echo_lens: 0x1a483a,
      trace_light: 0x4a1a6a,
      voice_prism: 0x4a3a1a,
      micro_rover: 0x3a3a1a
    };
    this.gadgetOverlay = this.add.rectangle(320, 180, 640, 360, colors[id] || 0x333333, 0.18).setDepth(400).setScrollFactor(0);
    EventBus.emit('gadget-changed', id);

    if (id === 'tranquility_focus') {
      this.toggleTranquilityFocus();
    } else if (id === 'echo_lens') {
      this.echoLensMini();
    } else if (id === 'micro_rover') {
      if (this.roomId === 'clockwork_gallery' || this.roomId === 'exhibition_chamber') {
        this.microRoverMini();
      } else {
        this.showMsg('Micro Rover active. Deploy near wall gaps or ducts in the Clockwork Gallery.');
      }
    } else if (id === 'voice_prism') {
      if (['main_hall', 'exhibition_chamber', 'clockwork_gallery'].includes(this.roomId)) {
        this.voicePrismMini();
      } else {
        this.showMsg('Voice Prism active. Point toward PA speakers or recording spools.');
      }
    } else if (id === 'trace_light') {
      this.revealTraceItems();
    } else {
      this.showMsg(`${id.replace(/_/g, ' ')} active.`);
    }
  }

  private echoLensMini() {
    this.inDialogue = true;
    this.cameras.main.setZoom(1.0);
    const els: Phaser.GameObjects.GameObject[] = [];
    const isObsDeck = this.roomId === 'observation_deck';
    const isPendulum = this.roomId === 'pendulum_room';

    // 1. Steampunk Brass Oscilloscope Housing
    const bkg = this.add.rectangle(320, 180, 520, 270, 0x0a0e1c, 0.98).setDepth(600).setScrollFactor(0);
    const frame = this.add.graphics().setDepth(601).setScrollFactor(0);
    frame.lineStyle(3, 0xd4af37, 1);
    frame.strokeRect(60, 45, 520, 270);
    frame.lineStyle(1, 0x6e5418, 1);
    frame.strokeRect(64, 49, 512, 262);
    // Brass corner studs
    frame.fillStyle(0xffe066, 1);
    frame.fillRect(66, 51, 4, 4); frame.fillRect(570, 51, 4, 4);
    frame.fillRect(66, 305, 4, 4); frame.fillRect(570, 305, 4, 4);
    els.push(bkg, frame);

    // Header placard
    const titleText = isObsDeck
      ? '🎧 ECHO LENS • WEATHER STATION ENVIRONMENTAL ACOUSTIC SCANNER'
      : '🎧 ECHO LENS • ACOUSTIC RESONANCE OSCILLOSCOPE';
    els.push(this.add.text(320, 68, titleText, {
      fontSize: '10px', color: '#ffd700', fontFamily: 'Courier New, monospace', fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0));

    // 2. Phosphor CRT Screen
    const crtBg = this.add.rectangle(245, 175, 330, 160, 0x04140c, 1).setDepth(601).setScrollFactor(0);
    const crtGrid = this.add.graphics().setDepth(602).setScrollFactor(0);
    crtGrid.lineStyle(1, 0x0c301c, 0.5);
    for (let x = 85; x <= 405; x += 20) { crtGrid.moveTo(x, 95); crtGrid.lineTo(x, 255); }
    for (let y = 95; y <= 255; y += 20) { crtGrid.moveTo(85, y); crtGrid.lineTo(405, y); }
    crtGrid.stroke();
    crtGrid.lineStyle(2, 0x1a4830, 1);
    crtGrid.strokeRect(80, 95, 330, 160);
    els.push(crtBg, crtGrid);

    const w1 = this.add.graphics().setDepth(603).setScrollFactor(0);
    const w2 = this.add.graphics().setDepth(603).setScrollFactor(0);
    els.push(w1, w2);

    if (isObsDeck) {
      // Channel A: Rain Sensor Patter
      els.push(this.add.text(90, 102, 'CH-A: Weather Sensor — Continuous Storm Precipitation', {
        fontSize: '8px', color: '#4ac4d4', fontFamily: 'Courier New, monospace', fontStyle: 'bold'
      }).setDepth(603).setScrollFactor(0));
      w1.lineStyle(2, 0x4ac4d4, 0.95);
      for (let x = 0; x < 280; x++) {
        const y = Math.sin(x * 0.25) * 8 * Math.cos(x * 0.05);
        if (x === 0) w1.moveTo(100 + x, 140 + y);
        else w1.lineTo(100 + x, 140 + y);
      }

      // Channel B: Floor Pressure Foot Traffic (Flatline during blackout)
      els.push(this.add.text(90, 175, 'CH-B: Deck Floor Sensors — Footstep Acoustic Signature (7:30 - 8:30 PM)', {
        fontSize: '8px', color: '#ff6666', fontFamily: 'Courier New, monospace', fontStyle: 'bold'
      }).setDepth(603).setScrollFactor(0));
      w2.lineStyle(2, 0xff4444, 0.95);
      w2.moveTo(100, 215); w2.lineTo(380, 215); // Zero flatline!
      w2.stroke();
      els.push(this.add.text(240, 219, '◀ ZERO FOOTSTEPS DETECTED (FLATLINE)', {
        fontSize: '7px', color: '#ff4444', fontFamily: 'Courier New', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(604).setScrollFactor(0));
    } else {
      // Standard Pendulum Oscilloscope
      els.push(this.add.text(90, 102, 'CH-A: Standard 12th Chime (440Hz Harmonic)', {
        fontSize: '8px', color: '#4ac4d4', fontFamily: 'Courier New, monospace', fontStyle: 'bold'
      }).setDepth(603).setScrollFactor(0));
      w1.lineStyle(2, 0x4ac4d4, 0.95);
      for (let x = 0; x < 280; x++) {
        const y = Math.sin(x * 0.08) * 16 * Math.exp(-x * 0.006);
        if (x === 0) w1.moveTo(100 + x, 140 + y);
        else w1.lineTo(100 + x, 140 + y);
      }

      els.push(this.add.text(90, 175, 'CH-B: Anomalous 13th Chime (Acoustic Match: Pendulum Flue)', {
        fontSize: '8px', color: '#ffbb33', fontFamily: 'Courier New, monospace', fontStyle: 'bold'
      }).setDepth(603).setScrollFactor(0));
      w2.lineStyle(2, 0xffbb33, 0.95);
      for (let x = 0; x < 280; x++) {
        const y = (Math.sin(x * 0.12) * 12 + Math.sin(x * 0.04) * 8) * Math.exp(-x * 0.005);
        if (x === 0) w2.moveTo(100 + x, 215 + y);
        else w2.lineTo(100 + x, 215 + y);
      }
    }

    // 3. Right-side Brass Control Panel with Rotary Dials
    const panelBg = this.add.rectangle(480, 175, 120, 160, 0x121828, 1).setDepth(602).setScrollFactor(0);
    const dials = this.add.graphics().setDepth(603).setScrollFactor(0);
    dials.fillStyle(0xd4af37, 1);
    dials.fillCircle(480, 125, 12); dials.fillCircle(480, 175, 12); dials.fillCircle(480, 225, 12);
    dials.fillStyle(0x181206, 1);
    dials.fillCircle(480, 125, 4); dials.fillCircle(480, 175, 4); dials.fillCircle(480, 225, 4);
    dials.lineStyle(1.5, 0xffe066, 1);
    dials.moveTo(480, 125); dials.lineTo(488, 120);
    dials.moveTo(480, 175); dials.lineTo(485, 165);
    dials.moveTo(480, 225); dials.lineTo(475, 218);
    dials.stroke();
    els.push(panelBg, dials);

    els.push(this.add.text(480, 142, 'FREQ (Hz)', { fontSize: '7px', color: '#8899aa', fontFamily: 'Courier New' }).setOrigin(0.5).setDepth(603).setScrollFactor(0));
    els.push(this.add.text(480, 192, 'RESONANCE', { fontSize: '7px', color: '#8899aa', fontFamily: 'Courier New' }).setOrigin(0.5).setDepth(603).setScrollFactor(0));
    els.push(this.add.text(480, 242, 'TELEMETRY', { fontSize: '7px', color: '#8899aa', fontFamily: 'Courier New' }).setOrigin(0.5).setDepth(603).setScrollFactor(0));

    // Summary diagnosis text
    const summaryStr = isObsDeck
      ? 'Acoustic telemetry confirms: Zero footsteps registered on the deck during the blackout. Hugo\'s alibi is shattered!'
      : 'Acoustic signature verified: The 13th chime vibrates at Project Echo\'s calibration frequency.';
    els.push(this.add.text(320, 268, summaryStr, {
      fontSize: '9px', color: '#e6edf4', fontFamily: 'Georgia, serif', fontStyle: 'italic', align: 'center'
    }).setOrigin(0.5).setDepth(603).setScrollFactor(0));

    // Buttons
    const btn = this.add.text(250, 296, '✔ RECORD FINDING', {
      fontSize: '11px', color: '#ffd700', fontFamily: 'Courier New, monospace', fontStyle: 'bold',
      backgroundColor: '#182436', padding: { x: 12, y: 5 }
    }).setOrigin(0.5).setDepth(603).setScrollFactor(0).setInteractive({ useHandCursor: true });
    els.push(btn);

    const closeConsole = () => {
      window.removeEventListener('keydown', onEsc);
      els.forEach(e => e.destroy());
      this.inDialogue = false;
      this.activeGadget = null;
      this.gadgetOverlay?.destroy();
      this.gadgetOverlay = null;
      this.cameras.main.setZoom(this.currentRoomZoom);
      EventBus.emit('gadget-changed', null);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConsole();
    };
    window.addEventListener('keydown', onEsc);

    btn.on('pointerdown', () => {
      if (isObsDeck) {
        if (!gameState.hasEvidence('rain_sensor_data')) {
          gameState.collectEvidence('rain_sensor_data');
          const itemObj = this.interactableObjects.find(io => io.data.evidenceId === 'rain_sensor_data');
          if (itemObj?.marker) { itemObj.marker.destroy(); itemObj.marker = null; }
          this.showDiscovery('Rain Sensor Data', 'Floor sensors show zero footsteps during the blackout. Hugo was not on the Observation Deck!');
        }
      } else {
        if (!gameState.hasEvidence('thirteenth_chime_resonance')) {
          gameState.collectEvidence('thirteenth_chime_resonance');
          const itemObj = this.interactableObjects.find(io => io.data.evidenceId === 'thirteenth_chime_resonance');
          if (itemObj?.marker) { itemObj.marker.destroy(); itemObj.marker = null; }
          this.showDiscovery('Thirteenth Chime Resonance', 'The 13th chime matches the pendulum room — and Project Echo\'s calibration frequency.');
        }
        if (isPendulum && !gameState.hasEvidence('pendulum_weight_sensor')) {
          gameState.collectEvidence('pendulum_weight_sensor');
        }
      }
      closeConsole();
      this.save();
    });

    const closeBtn = this.add.text(390, 296, '✕ CLOSE [ESC]', {
      fontSize: '11px', color: '#8899aa', fontFamily: 'Courier New, monospace',
      backgroundColor: '#141824', padding: { x: 12, y: 5 }
    }).setOrigin(0.5).setDepth(603).setScrollFactor(0).setInteractive({ useHandCursor: true });
    els.push(closeBtn);

    closeBtn.on('pointerdown', closeConsole);
  }

  private microRoverMini() {
    this.inDialogue = true;
    this.cameras.main.setZoom(1.0);
    const els: Phaser.GameObjects.GameObject[] = [];
    let isFinished = false;
    let roverTween: Phaser.Tweens.Tween | null = null;
    const cleanups: Array<() => void> = [];

    // Steampunk Drone Remote Console Base
    const bkg = this.add.rectangle(320, 180, 480, 280, 0x0a0e1c, 0.98).setDepth(600).setScrollFactor(0);
    const frame = this.add.graphics().setDepth(601).setScrollFactor(0);
    frame.lineStyle(3, 0xd4af37, 1);
    frame.strokeRect(80, 40, 480, 280);
    frame.lineStyle(1, 0x5a4214, 1);
    frame.strokeRect(84, 44, 472, 272);
    // Corner brass studs
    frame.fillStyle(0xffe066, 1);
    frame.fillRect(86, 46, 4, 4); frame.fillRect(550, 46, 4, 4);
    frame.fillRect(86, 310, 4, 4); frame.fillRect(550, 310, 4, 4);
    els.push(bkg, frame);

    // Title & Telemetry Header
    els.push(this.add.text(320, 62, '🤖 MICRO ROVER • ACOUSTIC FLUE REMOTE NAVIGATION', {
      fontSize: '11px', color: '#ffd700', fontFamily: 'Courier New, monospace', fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0));

    // Telemetry Indicators
    const telemetryTxt = this.add.text(110, 82, 'SIGNAL: ● 99%  |  HEADLIGHTS: ACTIVE  |  MODE: MANUAL DRIVE / AUTO', {
      fontSize: '8px', color: '#4ac47a', fontFamily: 'Courier New, monospace'
    }).setDepth(602).setScrollFactor(0);
    els.push(telemetryTxt);

    // Blueprinted Ventilation Flue Shaft
    const maze = this.add.graphics().setDepth(602).setScrollFactor(0);
    els.push(maze);
    maze.fillStyle(0x0e1424, 1);
    maze.fillRect(110, 98, 420, 134);
    maze.lineStyle(2, 0x3a4b66, 1);
    maze.strokeRect(110, 98, 420, 134);
    // Duct internal baffle guides
    maze.lineStyle(3, 0x4a6a8a, 0.9);
    maze.moveTo(200, 98); maze.lineTo(200, 178);
    maze.moveTo(280, 150); maze.lineTo(280, 232);
    maze.moveTo(370, 98); maze.lineTo(370, 185);
    maze.stroke();

    // Ventilation hazard grating texture
    maze.lineStyle(1, 0x1e2838, 0.5);
    for (let x = 120; x < 520; x += 16) { maze.moveTo(x, 98); maze.lineTo(x, 232); }
    maze.stroke();

    // Interactive clickable hit zone over the entire duct area for mouse/touch steering
    const ductClickZone = this.add.zone(320, 165, 420, 134).setDepth(603).setScrollFactor(0).setInteractive({ useHandCursor: true });
    els.push(ductClickZone);

    // Micro Rover Probe (with headlights & antenna)
    const roverContainer = this.add.container(145, 130).setDepth(605).setScrollFactor(0);
    const roverLight = this.add.triangle(18, 0, 0, 0, 36, -14, 36, 14, 0xffea70, 0.4);
    const roverBody = this.add.rectangle(0, 0, 16, 11, 0x4ac47a);
    const roverTreads = this.add.rectangle(0, 0, 18, 14, 0x224430).setDepth(-1);
    const roverAntenna = this.add.line(0, 0, -5, -6, -5, -14, 0xd4af37);
    roverContainer.add([roverLight, roverTreads, roverBody, roverAntenna]);
    els.push(roverContainer);

    // Target Goal: Hidden Brass Flue Deadbolt Latch
    const goalX = 485, goalY = 205;
    const goalGlow = this.add.circle(goalX, goalY, 16, 0xd4af37, 0.4).setDepth(603).setScrollFactor(0);
    const goalLatch = this.add.rectangle(goalX, goalY, 28, 28, 0x5a4214, 0.8).setDepth(604).setScrollFactor(0);
    const goalGear = this.add.text(goalX, goalY, '⚙', { fontSize: '14px', color: '#ffd700' }).setOrigin(0.5).setDepth(605).setScrollFactor(0);
    const goalLabel = this.add.text(goalX, goalY - 22, 'TARGET LATCH', { fontSize: '7px', color: '#ffd700', fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5).setDepth(605).setScrollFactor(0);
    this.tweens.add({ targets: goalGlow, scale: 1.5, alpha: 0.1, yoyo: true, repeat: -1, duration: 600 });
    els.push(goalGlow, goalLatch, goalGear, goalLabel);

    // Large goal click zone
    const goalHitZone = this.add.zone(goalX, goalY, 56, 56).setDepth(606).setScrollFactor(0).setInteractive({ useHandCursor: true });
    els.push(goalHitZone);

    // Guidance text
    const guideTxt = this.add.text(320, 246, '▶ [W/A/S/D] or [ARROWS] to Drive  •  Click in Duct to Steer  •  Click Goal / Auto-Pilot', {
      fontSize: '8px', color: '#ffea70', fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5).setDepth(603).setScrollFactor(0);
    els.push(guideTxt);

    const closeConsole = () => {
      cleanups.forEach(c => c());
      if (roverTween) roverTween.stop();
      els.forEach(e => e.destroy());
      this.inDialogue = false;
      this.activeGadget = null;
      this.gadgetOverlay?.destroy();
      this.gadgetOverlay = null;
      this.cameras.main.setZoom(this.currentRoomZoom);
      EventBus.emit('gadget-changed', null);
    };

    const finishMission = () => {
      if (isFinished) return;
      isFinished = true;
      cleanups.forEach(c => c());
      if (roverTween) roverTween.stop();

      AudioManager.getInstance().playSFX('discoveryString');
      AudioManager.getInstance().playSFX('success');

      telemetryTxt.setColor('#00ff88');
      telemetryTxt.setText('STATUS: ✔ SECRET CONNECTING FLUE DOOR DISCOVERED!');
      guideTxt.setColor('#00ff88');
      guideTxt.setText('✦ FLUE PASSAGEWAY MAPPED TO EXHIBITION CHAMBER! ✦');

      if (!gameState.hasEvidence('connecting_door')) {
        gameState.collectEvidence('connecting_door');
        const itemObj = this.interactableObjects.find(io => io.data.evidenceId === 'connecting_door');
        if (itemObj?.marker) {
          itemObj.marker.destroy();
          itemObj.marker = null;
        }
        this.showDiscovery('Hidden Connecting Door', 'A hidden acoustic flue door connecting the Clockwork Gallery directly into the Exhibition Chamber!');
      }

      this.time.delayedCall(1600, () => {
        closeConsole();
        this.save();
      });
    };

    // Auto-pilot / Auto-navigate button
    const autoBtn = this.add.text(240, 285, '▶ AUTO-PILOT [SPACE]', {
      fontSize: '10px', color: '#ffd700', fontFamily: 'Courier New, monospace', fontStyle: 'bold',
      backgroundColor: '#182436', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setDepth(604).setScrollFactor(0).setInteractive({ useHandCursor: true });
    els.push(autoBtn);

    const startAutoPilot = () => {
      if (isFinished) return;
      guideTxt.setText('AUTONAVIGATING PROBE THROUGH AIR DUCT...');
      if (roverTween) roverTween.stop();
      this.tweens.chain({
        targets: roverContainer,
        tweens: [
          { x: 200, duration: 400, onStart: () => roverContainer.setAngle(0) },
          { y: 200, duration: 350, onStart: () => roverContainer.setAngle(90) },
          { x: 320, duration: 450, onStart: () => roverContainer.setAngle(0) },
          { y: 130, duration: 350, onStart: () => roverContainer.setAngle(-90) },
          { x: 420, duration: 400, onStart: () => roverContainer.setAngle(0) },
          { y: goalY, duration: 300, onStart: () => roverContainer.setAngle(90) },
          { x: goalX, duration: 300, onStart: () => roverContainer.setAngle(0) }
        ],
        onComplete: () => {
          finishMission();
        }
      });
    };

    autoBtn.on('pointerdown', startAutoPilot);
    goalHitZone.on('pointerdown', startAutoPilot);

    // Close button
    const closeBtn = this.add.text(400, 285, '✕ CLOSE [ESC]', {
      fontSize: '10px', color: '#8899aa', fontFamily: 'Courier New, monospace',
      backgroundColor: '#141824', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setDepth(604).setScrollFactor(0).setInteractive({ useHandCursor: true });
    els.push(closeBtn);

    closeBtn.on('pointerdown', closeConsole);

    // Click anywhere in duct to steer
    ductClickZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (isFinished) return;
      const tx = Phaser.Math.Clamp(pointer.x, 130, 495);
      const ty = Phaser.Math.Clamp(pointer.y, 115, 220);
      const angle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(roverContainer.x, roverContainer.y, tx, ty));
      roverContainer.setAngle(angle);

      if (roverTween) roverTween.stop();
      const dist = Phaser.Math.Distance.Between(roverContainer.x, roverContainer.y, tx, ty);
      roverTween = this.tweens.add({
        targets: roverContainer,
        x: tx,
        y: ty,
        duration: Math.max(150, dist * 3),
        onUpdate: () => {
          if (Phaser.Math.Distance.Between(roverContainer.x, roverContainer.y, goalX, goalY) < 42) {
            finishMission();
          }
        },
        onComplete: () => {
          if (Phaser.Math.Distance.Between(roverContainer.x, roverContainer.y, goalX, goalY) < 42) {
            finishMission();
          }
        }
      });
    });

    // Manual Keyboard Drive (W / A / S / D / Arrow Keys)
    const moveStep = (dx: number, dy: number, angle: number) => {
      if (isFinished) return;
      if (roverTween) { roverTween.stop(); roverTween = null; }
      roverContainer.x = Phaser.Math.Clamp(roverContainer.x + dx, 130, 495);
      roverContainer.y = Phaser.Math.Clamp(roverContainer.y + dy, 115, 220);
      roverContainer.setAngle(angle);
      try { AudioManager.getInstance().playSFX('type_blip'); } catch(e) {}

      telemetryTxt.setText(`SIGNAL: ● 99%  |  X: ${Math.round(roverContainer.x)} Y: ${Math.round(roverContainer.y)}  |  STATUS: DRIVING`);
      if (Phaser.Math.Distance.Between(roverContainer.x, roverContainer.y, goalX, goalY) < 42) {
        finishMission();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      const k = e.key.toUpperCase();
      if (k === 'W' || k === 'ARROWUP') moveStep(0, -18, -90);
      else if (k === 'S' || k === 'ARROWDOWN') moveStep(0, 18, 90);
      else if (k === 'A' || k === 'ARROWLEFT') moveStep(-18, 0, 180);
      else if (k === 'D' || k === 'ARROWRIGHT') moveStep(18, 0, 0);
      else if (k === ' ' || k === 'ENTER') startAutoPilot();
      else if (k === 'ESCAPE') closeConsole();
    };

    window.addEventListener('keydown', onKeyDown);
    cleanups.push(() => window.removeEventListener('keydown', onKeyDown));
  }

  private voicePrismMini() {
    this.inDialogue = true;
    this.cameras.main.setZoom(1.0);
    const els: Phaser.GameObjects.GameObject[] = [];
    const isClockwork = this.roomId === 'clockwork_gallery';

    // Antique Magnetic Wire Spectrograph Instrument
    const bkg = this.add.rectangle(320, 180, 520, 280, 0x0a0e1c, 0.98).setDepth(600).setScrollFactor(0);
    const frame = this.add.graphics().setDepth(601).setScrollFactor(0);
    frame.lineStyle(3, 0xd4af37, 1);
    frame.strokeRect(60, 40, 520, 280);
    frame.lineStyle(1, 0x6e5418, 1);
    frame.strokeRect(64, 44, 512, 272);
    // Corner studs
    frame.fillStyle(0xffe066, 1);
    frame.fillRect(66, 46, 4, 4); frame.fillRect(570, 46, 4, 4);
    frame.fillRect(66, 310, 4, 4); frame.fillRect(570, 310, 4, 4);
    els.push(bkg, frame);

    // Title Header
    const titleText = isClockwork
      ? '🔊 VOICE PRISM • HIDDEN WIRE DICTAPHONE SPECTROGRAM'
      : '🔊 VOICE PRISM • MAGNETIC WIRE PHONOGRAPH SPECTROGRAM';
    els.push(this.add.text(320, 60, titleText, {
      fontSize: '10px', color: '#ffd700', fontFamily: 'Courier New, monospace', fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0));

    // Rotating Magnetic Wire Reels at Top
    const reel1 = this.add.circle(120, 95, 16, 0xd4af37, 0.9).setDepth(602).setScrollFactor(0);
    const reel2 = this.add.circle(520, 95, 16, 0xd4af37, 0.9).setDepth(602).setScrollFactor(0);
    this.tweens.add({ targets: reel1, angle: 360, repeat: -1, duration: 3000 });
    this.tweens.add({ targets: reel2, angle: 360, repeat: -1, duration: 3000 });
    els.push(reel1, reel2);

    // Frequency Spectrum Visualizer Display
    const specBg = this.add.rectangle(320, 155, 380, 85, 0x040814, 1).setDepth(602).setScrollFactor(0);
    const specFrame = this.add.graphics().setDepth(603).setScrollFactor(0);
    specFrame.lineStyle(1, 0x2a3854, 0.8);
    specFrame.strokeRect(130, 112, 380, 85);
    els.push(specBg, specFrame);

    // Audio frequency bands
    const b1 = this.add.graphics().setDepth(604).setScrollFactor(0);
    els.push(b1);
    const trackLabel = isClockwork
      ? 'PLAYBACK: Hidden Pocket Dictaphone (Recovered from Dark Alcove)'
      : 'PLAYBACK: 7:45 PM Demonstration Announcement Track';
    els.push(this.add.text(140, 118, trackLabel, {
      fontSize: '8px', color: '#7ac4d4', fontFamily: 'Courier New, monospace', fontStyle: 'bold'
    }).setDepth(604).setScrollFactor(0));

    for (let i = 0; i < 44; i++) {
      const h = Math.abs(Math.sin(i * 0.28)) * 22 + 4;
      b1.fillStyle(0x3a8296);
      b1.fillRect(140 + i * 8, 172 - h, 6, h);
      b1.fillStyle(0x6ad0e6);
      b1.fillRect(140 + i * 8, 172 - h, 6, 2); // peak light
    }

    // Magnetic wire splice marker
    b1.fillStyle(0xff3333, 0.9);
    b1.fillRect(140 + 24 * 8, 128, 3, 58);
    els.push(this.add.text(140 + 24 * 8 + 6, 130, '◀ SPLICE ARTIFACT DETECTED', {
      fontSize: '7px', color: '#ff4444', fontFamily: 'Courier New, monospace', fontStyle: 'bold'
    }).setDepth(604).setScrollFactor(0));

    // Acoustic Analysis & Confidence Result Box
    const matchBox = this.add.rectangle(320, 230, 420, 36, 0x141c2c, 0.9).setDepth(602).setScrollFactor(0);
    matchBox.setStrokeStyle(1, 0xd4af37, 0.6);
    const matchString = isClockwork
      ? 'ACOUSTIC MATCH: 94% CONFIDENCE — NADIA THORN\nWhispered tape confession: "I\'m sorry, Aldric... I had no choice."'
      : 'SPLICE DETECTED: Announcement was assembled from pre-recorded tape spools.\nAldric Sable was already dead before the broadcast began!';
    const matchTxt = this.add.text(320, 230, matchString, {
      fontSize: '9px', color: '#ffea70', fontFamily: 'Georgia, serif', align: 'center', lineSpacing: 3
    }).setOrigin(0.5).setDepth(603).setScrollFactor(0);
    els.push(matchBox, matchTxt);

    // Buttons
    const btn = this.add.text(250, 285, '✔ RECORD FINDINGS', {
      fontSize: '11px', color: '#ffd700', fontFamily: 'Courier New, monospace', fontStyle: 'bold',
      backgroundColor: '#182436', padding: { x: 12, y: 5 }
    }).setOrigin(0.5).setDepth(603).setScrollFactor(0).setInteractive({ useHandCursor: true });
    els.push(btn);

    const closeConsole = () => {
      window.removeEventListener('keydown', onEsc);
      els.forEach(e => e.destroy());
      this.inDialogue = false;
      this.activeGadget = null;
      this.gadgetOverlay?.destroy();
      this.gadgetOverlay = null;
      this.cameras.main.setZoom(this.currentRoomZoom);
      EventBus.emit('gadget-changed', null);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConsole();
    };
    window.addEventListener('keydown', onEsc);

    btn.on('pointerdown', () => {
      if (isClockwork) {
        if (!gameState.hasEvidence('petra_hidden_recorder')) {
          gameState.collectEvidence('petra_hidden_recorder');
          const itemObj = this.interactableObjects.find(io => io.data.id === 'dark_corner');
          if (itemObj?.marker) { itemObj.marker.destroy(); itemObj.marker = null; }
          this.showDiscovery('Hidden Dictaphone', 'A pocket recorder concealed in the alcove, bearing Nadia Thorn\'s whispered confession.');
        }
        if (!gameState.hasEvidence('petra_recorder')) {
          gameState.collectEvidence('petra_recorder');
        }
      } else {
        if (!gameState.hasEvidence('spliced_recording')) {
          gameState.collectEvidence('spliced_recording');
          const itemObj = this.interactableObjects.find(io => io.data.evidenceId === 'spliced_recording');
          if (itemObj?.marker) { itemObj.marker.destroy(); itemObj.marker = null; }
          this.showDiscovery('Spliced Recording', 'The demonstration announcement was assembled from earlier magnetic recordings.');
        }
      }
      closeConsole();
      this.save();
    });

    const closeBtn = this.add.text(390, 285, '✕ CLOSE [ESC]', {
      fontSize: '11px', color: '#8899aa', fontFamily: 'Courier New, monospace',
      backgroundColor: '#141824', padding: { x: 12, y: 5 }
    }).setOrigin(0.5).setDepth(603).setScrollFactor(0).setInteractive({ useHandCursor: true });
    els.push(closeBtn);

    closeBtn.on('pointerdown', closeConsole);
  }

  private revealTraceItems() {
    const room = rooms[this.roomId];
    if (!room?.interactables) return;
    AudioManager.getInstance().playSFX('discoveryString');
    let traceFound = 0;
    for (const obj of room.interactables) {
      if (obj.gadgetRequired === 'trace_light' && obj.evidenceId && !gameState.hasEvidence(obj.evidenceId)) {
        traceFound++;
        const existing = this.interactableObjects.find(io => io.data.id === obj.id);
        if (existing) {
          existing.label.setColor('#e6a8ff');
          existing.label.setText(`🔦 ${obj.name}`);
          existing.label.setVisible(true);
          if (existing.marker) {
            if (typeof (existing.marker as any).setTint === 'function') {
              (existing.marker as any).setTint(0xcc66ff);
            } else if (typeof (existing.marker as any).fillStyle === 'function') {
              (existing.marker as any).fillStyle(0xcc66ff, 1);
            }
          }
        } else {
          const ox = obj.x * TILE;
          const oy = obj.y * TILE;
          const ow = (obj.width || 2) * TILE;
          const oh = (obj.height || 1) * TILE;
          const z = this.add.zone(ox, oy, ow + 8, oh + 8);
          this.physics.add.existing(z, true);
          z.setInteractive({ useHandCursor: true });
          z.on('pointerdown', () => {
            if (!this.inDialogue) this.interact(obj);
          });
          const mk = this.add.image(ox, oy - oh / 2 - 8, 'sparkle_gleam').setDepth(oy + 20);
          mk.setTint(0xcc66ff);
          this.tweens.add({ targets: mk, y: oy - oh / 2 - 12, alpha: 0.5, scale: 0.85, yoyo: true, repeat: -1, duration: 600 });
          const lb = this.add.text(ox, oy + 12, `🔦 ${obj.name}`, {
            fontSize: '8px', color: '#e6a8ff', fontFamily: 'Courier New', backgroundColor: '#090d18ee', padding: { x: 5, y: 2 }
          }).setOrigin(0.5).setDepth(150).setVisible(true);
          this.interactableObjects.push({ zone: z, data: obj, marker: mk as any, label: lb });
        }
      }
    }
    if (traceFound > 0) {
      this.showMsg(`🔦 Trace Light: ${traceFound} latent chemical / fingerprint mark(s) illuminated.`);
    } else {
      this.showMsg('🔦 Trace Light active: No latent chemical traces detected in this area.');
    }
  }

  private goToRoom(target: string, fromDir: string) {
    if (this.doorCooldown || this.inDialogue) return;
    this.clearTranquilityFocus();
    this.doorCooldown = true;
    this.inDialogue = true;
    AudioManager.getInstance().playSFX('doorOpen');
    const td = rooms[target]; if (!td) return;

    // Intelligently find the matching entrance door in the target room connecting back to this room
    let sx = (td.width || 40) * TILE / 2;
    let sy = (td.height || 22) * TILE / 2;
    const wallH = TILE * 3;

    const returnExit = (td.exits || []).find((e: any) => e.targetRoom === this.roomId && e.direction !== 'hidden');
    if (returnExit) {
      if (returnExit.y <= 2 || returnExit.direction === 'up') {
        sx = returnExit.x * TILE;
        sy = Math.max(returnExit.y * TILE + 4 * TILE, wallH + 16);
      } else if (returnExit.y >= (td.height || 22) - 3 || returnExit.direction === 'down') {
        sx = returnExit.x * TILE;
        sy = returnExit.y * TILE - 4 * TILE;
      } else if (returnExit.x <= 2 || returnExit.direction === 'left') {
        sx = returnExit.x * TILE + 4 * TILE;
        sy = returnExit.y * TILE;
      } else if (returnExit.x >= (td.width || 40) - 3 || returnExit.direction === 'right') {
        sx = returnExit.x * TILE - 4 * TILE;
        sy = returnExit.y * TILE;
      }
    } else if (td.spawnPoint) {
      sx = td.spawnPoint.x * TILE;
      sy = Math.max(td.spawnPoint.y * TILE, wallH + 20);
    }

    const tw = (td.width || 40) * TILE;
    const th = (td.height || 22) * TILE;
    sx = Phaser.Math.Clamp(sx, 32, tw - 32);
    sy = Phaser.Math.Clamp(sy, wallH + 20, th - 32);

    this.cameras.main.fadeOut(250);
    let transitioned = false;
    const doRestart = () => {
      if (transitioned) return;
      transitioned = true;
      this.registry.set('spawnX', sx);
      this.registry.set('spawnY', sy);
      this.scene.restart({ roomId: target });
    };
    this.cameras.main.once('camerafadeoutcomplete', doRestart);
    this.time.delayedCall(300, doRestart);
  }

  private showRoomPlacard(room: RoomData) {
    const banner = this.add.container(320, 16).setDepth(500).setScrollFactor(0).setAlpha(0);

    const bg = this.add.graphics();
    const bw = 320, bh = 42;
    bg.fillStyle(0x070b16, 0.94);
    bg.fillRoundedRect(-bw / 2, 0, bw, bh, 6);
    bg.lineStyle(1.5, 0xd4af37, 0.9);
    bg.strokeRoundedRect(-bw / 2, 0, bw, bh, 6);

    // Corner filigree studs
    bg.fillStyle(0xd4af37, 1);
    bg.fillCircle(-bw / 2 + 6, 6, 2);
    bg.fillCircle(bw / 2 - 6, 6, 2);
    bg.fillCircle(-bw / 2 + 6, bh - 6, 2);
    bg.fillCircle(bw / 2 - 6, bh - 6, 2);

    const title = this.add.text(0, 12, `✦ ${room.name.toUpperCase()} ✦`, {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    const descText = room.description && room.description.length > 55 ? room.description.substring(0, 52) + '...' : (room.description || '');
    const desc = this.add.text(0, 28, descText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '8px',
      color: '#a0b8d0'
    }).setOrigin(0.5);

    banner.add([bg, title, desc]);

    // Smooth slide down and fade out
    this.tweens.add({
      targets: banner,
      y: 42,
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: banner,
            y: 20,
            alpha: 0,
            duration: 600,
            ease: 'Cubic.easeIn',
            onComplete: () => banner.destroy()
          });
        });
      }
    });
  }

  private showMsg(text: string) {
    AudioManager.getInstance().playSFX('ui_click');
    EventBus.emit('show-msg', { text });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-msg', { detail: { text } }));
    }
    const m = this.add.text(320, 300, text, {
      fontSize: '10px',
      color: '#e0e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#0a0a12f0',
      padding: { x: 8, y: 4 },
      wordWrap: { width: 400 }
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0);
    this.tweens.add({ targets: m, alpha: 0, delay: 3000, duration: 500, onComplete: () => m.destroy() });
  }

  private showDiscovery(name: string, desc: string) {
    AudioManager.getInstance().playSFX('discoveryString');
    const f = this.add.rectangle(320, 180, 640, 360, 0xc4a44a, 0.15).setDepth(500).setScrollFactor(0);
    this.tweens.add({ targets: f, alpha: 0, duration: 500, onComplete: () => f.destroy() });

    // Emit EventBus contracts for high-DPI HTML/CSS discovery modal
    EventBus.emit('show-discovery', { name, description: desc, category: 'Physical Evidence' });
    EventBus.emit('evidence-found', name);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-discovery', {
        detail: { name, description: desc, category: 'Physical Evidence' }
      }));
    }
  }

  private renderRoomArchitecture(room: any, w: number, h: number) {
    const wallH = TILE * 3; // 48px Victorian architectural wall
    const isLibrary = room.id === 'library';
    const isClockwork = room.id === 'clockwork_gallery';
    const isMainHall = room.id === 'main_hall';
    const isObservation = room.id === 'observation_deck';
    const isPendulum = room.id === 'pendulum_room';

    // 1. Base Flooring (Repeating high-detail 16-bit RPG Tile Textures)
    if (isMainHall) {
      // Polished Victorian black and ivory checkerboard tiles with gloss
      this.add.tileSprite(w / 2, (wallH + h) / 2, w, h - wallH, 'tile_marble_checker').setDepth(0);
      // Grand royal crimson runner carpet with gold filigree down the center
      const carpetW = TILE * 6;
      this.add.tileSprite(w / 2, (wallH + h) / 2, carpetW, h - wallH, 'carpet_crimson_runner').setDepth(1);
    } else if (isLibrary) {
      // Warm dark oak parquet wood floor
      this.add.tileSprite(w / 2, (wallH + h) / 2, w, h - wallH, 'tile_parquet_wood').setDepth(0);
      // Large emerald oriental rug in reading area
      this.add.image(w / 2, (wallH + h) / 2 + 10, 'carpet_emerald_rug').setDepth(1);
    } else if (isClockwork) {
      // Industrial steel grating with bronze sub-glow and turning cogs
      this.add.tileSprite(w / 2, (wallH + h) / 2, w, h - wallH, 'tile_industrial_grate').setDepth(0);
    } else if (isObservation) {
      // Cold wet slate pavers with rain puddle reflections
      this.add.tileSprite(w / 2, (wallH + h) / 2, w, h - wallH, 'tile_wet_stone').setDepth(0);
    } else if (isPendulum) {
      // Gothic carved granite masonry
      this.add.tileSprite(w / 2, (wallH + h) / 2, w, h - wallH, 'tile_granite_masonry').setDepth(0);
    } else {
      // Exhibition Chamber & others: Mahogany parquet
      this.add.tileSprite(w / 2, (wallH + h) / 2, w, h - wallH, 'tile_parquet_wood').setDepth(0);
      this.add.tileSprite(w / 2, (wallH + h) / 2, TILE * 6, h - wallH - TILE * 2, 'carpet_crimson_runner').setDepth(1);
    }

    // 2. High Victorian Architectural Wall Header
    this.add.tileSprite(w / 2, wallH / 2, w, wallH, 'wall_victorian').setDepth(2);

    // Wall Lantern Sconces & Floor Warm Lighting Cones
    for (let x = TILE * 4; x < w - TILE * 3; x += TILE * 6) {
      this.add.image(x, wallH - 14, 'prop_sconce_lantern').setDepth(3);

      // Warm radial light aura on floor beneath sconce
      const lightHalo = this.add.circle(x, wallH + 18, 30, 0xffd700, 0.08).setDepth(1);
      this.tweens.add({
        targets: lightHalo,
        alpha: 0.13,
        scale: 1.08,
        yoyo: true,
        repeat: -1,
        duration: 1800 + Math.random() * 600,
        ease: 'Sine.easeInOut'
      });
    }

    // Gothic Arched Windows
    if (isMainHall || isLibrary) {
      this.add.image(TILE * 2 + 10, wallH - 8, 'window_gothic_storm').setDepth(3);
      this.add.image(w - TILE * 2 - 10, wallH - 8, 'window_gothic_storm').setDepth(3);
    }

    // Room Name Plaque Banner
    this.add.text(w / 2, 14, `★ ${room.name.toUpperCase()} ★`, {
      fontFamily: 'serif',
      fontSize: '11px',
      color: '#d4af37',
      fontStyle: 'bold',
      backgroundColor: '#0c0f1aee',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setDepth(5);
  }

  private drawFeatures(room: any, w: number, h: number) {
    const wallH = TILE * 3;
    const isMainHall = room.id === 'main_hall';
    const isLibrary = room.id === 'library';
    const isClockwork = room.id === 'clockwork_gallery';
    const isExhibition = room.id === 'exhibition_chamber';

    // Room-specific architectural furniture
    if (isMainHall) {
      // Fireplace in west wing
      this.add.image(TILE * 6, wallH - 4, 'prop_fireplace').setDepth(wallH);
      // Grandfather clock in east alcove
      this.add.image(w - TILE * 5, wallH - 6, 'prop_grandfather_clock').setDepth(wallH);
      // Velvet armchairs
      this.add.image(TILE * 5, wallH + 32, 'prop_armchair').setDepth(wallH + 32);
      this.add.image(w - TILE * 8, wallH + 32, 'prop_armchair').setDepth(wallH + 32);
      // Display pedestals
      this.add.image(w / 2 - TILE * 6, wallH + 24, 'prop_display_pedestal').setDepth(wallH + 24);
      this.add.image(w / 2 + TILE * 6, wallH + 24, 'prop_display_pedestal').setDepth(wallH + 24);
    } else if (isLibrary) {
      // Grand double-tier bookcases lining back wall
      this.add.image(TILE * 4, wallH - 4, 'prop_grand_bookcase').setDepth(wallH);
      this.add.image(TILE * 8, wallH - 4, 'prop_grand_bookcase').setDepth(wallH);
      this.add.image(w - TILE * 4, wallH - 4, 'prop_grand_bookcase').setDepth(wallH);
      this.add.image(w - TILE * 8, wallH - 4, 'prop_grand_bookcase').setDepth(wallH);
      // Cozy library fireplace
      this.add.image(w / 2, wallH - 4, 'prop_fireplace').setDepth(wallH);
      // Reading armchairs moved south to open walkway around archive desk
      this.add.image(w / 2 - 32, 272, 'prop_armchair').setDepth(272);
      this.add.image(w / 2 + 32, 272, 'prop_armchair').setDepth(272);
    } else if (isClockwork) {
      // Brass steam pipes across top wall
      this.add.tileSprite(w / 2, wallH - 12, w - TILE * 4, 24, 'prop_brass_pipes').setDepth(3);
    } else if (isExhibition) {
      // Additional display pedestals
      this.add.image(TILE * 4, (wallH + h) / 2 - 20, 'prop_display_pedestal').setDepth((wallH + h) / 2 - 20);
      this.add.image(w - TILE * 4, (wallH + h) / 2 - 20, 'prop_display_pedestal').setDepth((wallH + h) / 2 - 20);
    }

    if (!room.features) return;
    for (const f of room.features) {
      if (f==='rain_window' || f==='rain_effect') {
        this.add.rectangle(w-TILE*3,h/2,TILE*2,TILE*4,0x1a2a4a,0.5).setDepth(2);
        this.add.rectangle(w-TILE*3,h/2,TILE*2,TILE*4).setStrokeStyle(2,0x3a4a5a).setDepth(3);
        for(let i=0;i<12;i++){
          const s=this.add.rectangle(w-TILE*4+Math.random()*TILE*3,h/2-TILE*2+Math.random()*TILE*4,1,6+Math.random()*6,0x7aa4cc,0.5).setDepth(4);
          this.tweens.add({targets:s,y:s.y+TILE*4,x:s.x-TILE,duration:700+Math.random()*300,repeat:-1,onRepeat:()=>{s.setPosition(w-TILE*4+Math.random()*TILE*3,h/2-TILE*2);}});
        }
      } else if (f==='clockwork_gears' || f==='giant_gears') {
        for(let i=0;i<3;i++){
          const g=this.add.graphics();
          g.lineStyle(2,0xc4a44a,0.6);
          g.strokeCircle(0,0,14+i*5);
          for(let a=0;a<8;a++){
            const an=(a/8)*Math.PI*2;
            g.moveTo(Math.cos(an)*8,Math.sin(an)*8);
            g.lineTo(Math.cos(an)*(18+i*5),Math.sin(an)*(18+i*5));
          }
          g.setPosition(TILE*3+i*TILE*6,TILE*3).setDepth(3);
          this.tweens.add({targets:g,angle:360,duration:8000+i*3000,repeat:-1});
        }
      } else if (f==='pendulum' || f==='swinging_pendulum') {
        const p=this.add.graphics();
        p.lineStyle(3,0x8a7a5a,0.9);
        p.moveTo(0,0);
        p.lineTo(0,70);
        p.fillStyle(0xd4af37);
        p.fillCircle(0,70,8);
        p.setPosition(w/2,TILE*2).setDepth(3);
        this.tweens.add({targets:p,angle:-15,yoyo:true,repeat:-1,duration:1500,ease:'Sine.easeInOut'});
      } else if (f==='steam_vents') {
        for(let i=0;i<4;i++){
          const vx=TILE*4+i*(w-TILE*8)/3, vy=h-TILE*2;
          this.add.rectangle(vx,vy,TILE,4,0x4a4a5a).setDepth(3);
          for(let j=0;j<4;j++){
            const steam=this.add.circle(vx+Math.random()*8-4,vy-4,2+Math.random()*3,0xddeeff,0.2).setDepth(4);
            this.tweens.add({
              targets:steam,
              y:vy-35-Math.random()*25,
              alpha:0,
              scale:1.6,
              duration:1800+Math.random()*800,
              repeat:-1,
              onRepeat:()=>{
                steam.setPosition(vx+Math.random()*8-4,vy-4);
                steam.setAlpha(0.2);
                steam.setScale(1);
              }
            });
          }
        }
      } else if (f==='locked_door') {
        const g=this.add.graphics();
        g.fillStyle(0x3a1f10,0.9);
        g.fillRect(w/2-TILE,TILE,TILE*2,TILE*2);
        g.lineStyle(2,0xd4af37);
        g.strokeRect(w/2-TILE,TILE,TILE*2,TILE*2);
        g.fillStyle(0xd4af37);
        g.fillCircle(w/2+TILE-4,TILE+TILE,3);
        g.setDepth(3);
      } else if (f==='echoing_walls') {
        const g=this.add.graphics();
        g.lineStyle(1,0x8e44ad,0.12);
        for(let r=30;r<140;r+=20){g.strokeCircle(w/2,h/2,r);}
        g.setDepth(1);
      }
    }
  }

  private setupObstacleColliders(room: any, w: number, h: number) {
    this.obstacleColliders = this.physics.add.staticGroup();
    const wallH = TILE * 3;

    // Top wall segments (leaving gaps only for real visible doors)
    const topExits = (room.exits || []).filter((e: any) => e.direction !== 'hidden' && (e.direction === 'up' || e.y <= 2));
    if (topExits.length === 0) {
      const topObstacle = this.add.rectangle(w / 2, wallH / 2, w, wallH);
      this.obstacleColliders.add(topObstacle);
    } else {
      let curX = 0;
      const sorted = [...topExits].sort((a: any, b: any) => a.x - b.x);
      for (const ex of sorted) {
        const dl = ex.x * TILE - 24;
        const dr = ex.x * TILE + 24;
        if (dl > curX) {
          const segW = dl - curX;
          const seg = this.add.rectangle(curX + segW / 2, wallH / 2, segW, wallH);
          this.obstacleColliders.add(seg);
        }
        curX = Math.max(curX, dr);
      }
      if (curX < w) {
        const segW = w - curX;
        const seg = this.add.rectangle(curX + segW / 2, wallH / 2, segW, wallH);
        this.obstacleColliders.add(seg);
      }
    }

    // Left wall segments
    const leftExits = (room.exits || []).filter((e: any) => e.direction !== 'hidden' && (e.direction === 'left' || e.x <= 2));
    if (leftExits.length === 0) {
      const leftObstacle = this.add.rectangle(8, (wallH + h) / 2, 16, h - wallH);
      this.obstacleColliders.add(leftObstacle);
    } else {
      for (const ex of leftExits) {
        const dY = ex.y * TILE;
        if (dY - 24 > wallH) {
          const s1 = this.add.rectangle(8, (wallH + dY - 24) / 2, 16, dY - 24 - wallH);
          this.obstacleColliders.add(s1);
        }
        if (dY + 24 < h) {
          const s2 = this.add.rectangle(8, (dY + 24 + h) / 2, 16, h - (dY + 24));
          this.obstacleColliders.add(s2);
        }
      }
    }

    // Right wall segments
    const rightExits = (room.exits || []).filter((e: any) => e.direction !== 'hidden' && (e.direction === 'right' || e.x >= (w / TILE - 3)));
    if (rightExits.length === 0) {
      const rightObstacle = this.add.rectangle(w - 8, (wallH + h) / 2, 16, h - wallH);
      this.obstacleColliders.add(rightObstacle);
    } else {
      for (const ex of rightExits) {
        const dY = ex.y * TILE;
        if (dY - 24 > wallH) {
          const s1 = this.add.rectangle(w - 8, (wallH + dY - 24) / 2, 16, dY - 24 - wallH);
          this.obstacleColliders.add(s1);
        }
        if (dY + 24 < h) {
          const s2 = this.add.rectangle(w - 8, (dY + 24 + h) / 2, 16, h - (dY + 24));
          this.obstacleColliders.add(s2);
        }
      }
    }

    // Bottom wall segments (hidden exits do not carve openings in solid walls)
    const bottomExits = (room.exits || []).filter((e: any) => e.direction !== 'hidden' && (e.direction === 'down' || e.y >= (h / TILE - 3)));
    if (bottomExits.length === 0) {
      const bottomObstacle = this.add.rectangle(w / 2, h - 8, w, 16);
      this.obstacleColliders.add(bottomObstacle);
    } else {
      for (const ex of bottomExits) {
        const dX = ex.x * TILE;
        if (dX - 24 > 0) {
          const s1 = this.add.rectangle((dX - 24) / 2, h - 8, dX - 24, 16);
          this.obstacleColliders.add(s1);
        }
        if (dX + 24 < w) {
          const s2 = this.add.rectangle((dX + 24 + w) / 2, h - 8, w - (dX + 24), 16);
          this.obstacleColliders.add(s2);
        }
      }
    }

    // Furniture obstacle collisions
    if (room.interactables) {
      for (const obj of room.interactables) {
        if (['desk', 'main_gear', 'archive_desk', 'shelf_3', 'old_files', 'pendulum'].includes(obj.id)) {
          const ox = obj.x * TILE, oy = obj.y * TILE;
          const ow = (obj.width || 2) * TILE, oh = (obj.height || 1) * TILE;
          const colW = obj.id === 'pendulum' ? 48 : ow - 4;
          const colH = obj.id === 'pendulum' ? 48 : oh - 4;
          const furn = this.add.rectangle(ox, oy, colW, colH);
          this.obstacleColliders.add(furn);
        }
      }
    }

    // Add collider between player and solid obstacles
    this.physics.add.collider(this.player, this.obstacleColliders);
  }

  private checkAdvance() {
    if (storyManager.checkAutoAdvance && storyManager.checkAutoAdvance()) {
      storyManager.advancePhase();
      const p = storyManager.getCurrentPhase();
      if (p?.cutsceneOnEnter && !gameState.hasCutsceneSeen(p.cutsceneOnEnter))
        this.scene.start('CutsceneScene', {cutsceneId:p.cutsceneOnEnter});
    }
  }

  private save() {
    try {
      gameState.setPlayerPosition(this.player.x, this.player.y);
      const d = gameState.serialize();
      SaveManager.save(d);
    } catch(e) {}
  }
}
