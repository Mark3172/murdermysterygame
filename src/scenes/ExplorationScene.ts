import Phaser from 'phaser';
import { EventBus } from '../engine/EventBus';
import { gameState } from '../logic/GameState';
import { storyManager } from '../logic/StoryPhaseManager';
import { SaveManager } from '../engine/SaveManager';
import { AudioManager } from '../engine/AudioManager';
import { PixelRenderer } from '../rendering/PixelRenderer';
import { rooms } from '../data/rooms';
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

  constructor() { super('ExplorationScene'); }

  init(data: any) {
    this.roomId = data?.roomId || gameState.getCurrentRoom() || 'main_hall';
    this.inDialogue = false;
    this.activeGadget = null;
    this.doorCooldown = true;
  }

  create() {
    const room = rooms[this.roomId];
    if (!room) { this.scene.start('TitleScene'); return; }
    gameState.setCurrentRoom(this.roomId);

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

    // Player tag
    this.playerTag = this.add.text(sx, sy - 24, '🕵️ Ren', {
      fontSize: '8px', color: '#7ab4f8', fontFamily: 'Courier New', backgroundColor: '#060a16d0', padding: { x: 4, y: 1 }
    }).setOrigin(0.5).setDepth(300);

    this.physics.world.setBounds(0, 0, rw, rh);
    this.cameras.main.setBounds(0, 0, rw, rh);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
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

      // Doorway architecture
      const doorBg = this.add.rectangle(ex, ey, 28, 28, 0x2a1a10).setDepth(10);
      const doorFrame = this.add.graphics();
      doorFrame.lineStyle(2, 0xd4af37, 0.85);
      doorFrame.strokeRect(ex - 14, ey - 14, 28, 28);
      // Door planks
      doorFrame.lineStyle(1, 0x5a3a20, 0.7);
      doorFrame.moveTo(ex, ey - 14); doorFrame.lineTo(ex, ey + 14);
      doorFrame.strokePath();
      doorFrame.fillStyle(0xd4af37, 1);
      doorFrame.fillCircle(ex - 3, ey, 2);
      doorFrame.fillCircle(ex + 3, ey, 2);
      doorFrame.setDepth(11);

      // Entrance lanterns
      const l1 = this.add.circle(ex - 18, ey, 3, 0xffea70, 0.8).setDepth(12);
      const l2 = this.add.circle(ex + 18, ey, 3, 0xffea70, 0.8).setDepth(12);
      this.tweens.add({ targets: [l1, l2], alpha: 0.5, yoyo: true, repeat: -1, duration: 1200 });

      // High-contrast Door Banner (clickable with mouse)
      const labelY = exit.direction === 'down' ? ey - 18 : ey + 18;
      const doorBadge = this.add.text(ex, labelY, `🚪 TO ${targetName}`, {
        fontSize: '8px', color: '#ffea70', fontFamily: 'Courier New, monospace', fontStyle: 'bold',
        backgroundColor: '#0a0d1aec', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(150).setInteractive({ useHandCursor: true });

      doorBadge.on('pointerdown', () => {
        if (!this.doorCooldown && !this.inDialogue) {
          this.goToRoom(exit.targetRoom, exit.direction);
        }
      });

      // Generous doorway trigger zone extending into room threshold
      let tzX = ex;
      let tzY = ey;
      let tzW = TILE * 3;
      let tzH = TILE * 3;

      if (exit.direction === 'up' || ey <= 2 * TILE) {
        tzY = Math.max(ey, wallH) - 4;
        tzH = TILE * 3.5;
      } else if (exit.direction === 'down' || ey >= rh - 3 * TILE) {
        tzY = Math.min(ey, rh - 16);
        tzH = TILE * 3.5;
      } else if (exit.direction === 'left' || ex <= 2 * TILE) {
        tzX = Math.max(ex, 16);
        tzW = TILE * 3.5;
      } else if (exit.direction === 'right' || ex >= rw - 3 * TILE) {
        tzX = Math.min(ex, rw - 16);
        tzW = TILE * 3.5;
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

      // Dedicated Pixel Art Prop Texture
      const propKey = PixelRenderer.getPropKey(obj.id);
      const propSprite = this.add.image(ox, oy, propKey).setDepth(oy);

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
      const roleLabel = sus ? `${icon} ${sus.name} • ${sus.title}` : npc.id;
      const lb = this.add.text(nx, ny + 18, roleLabel, {
        fontSize: '8px', color: '#ffffff', fontFamily: 'Courier New', backgroundColor: '#090d1af0', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(ny + 100);

      // Exclamation mark for un-interviewed suspects
      if (sus && !gameState.isSuspectInterviewed(sus.id)) {
        const exclaim = this.add.text(nx, ny - 24, '❗', { fontSize: '10px', color: '#ffea70' }).setOrigin(0.5).setDepth(ny + 101);
        this.tweens.add({ targets: exclaim, y: ny - 28, yoyo: true, repeat: -1, duration: 600 });
      }

      this.npcObjects.push({ sprite: sp as any, data: npc, label: lb });
    }

    // Dust particles
    for (let i=0; i<10; i++) {
      const d = this.add.circle(Math.random()*640, Math.random()*360, 1, 0xc4a44a, 0.15+Math.random()*0.15).setDepth(250).setScrollFactor(0);
      this.tweens.add({targets:d, x:d.x+(Math.random()-0.5)*100, y:d.y+(Math.random()-0.5)*50, alpha:0, duration:4000+Math.random()*3000, repeat:-1, yoyo:true});
    }

    // Room name
    const rn = this.add.text(rw/2, 20, room.name, {fontSize:'10px',color:'#7ac4d4',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(200).setScrollFactor(0);
    this.tweens.add({targets:rn, alpha:0, delay:2000, duration:1000});

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = {
        W: this.input.keyboard.addKey('W'), A: this.input.keyboard.addKey('A'),
        S: this.input.keyboard.addKey('S'), D: this.input.keyboard.addKey('D'),
        E: this.input.keyboard.addKey('E'), N: this.input.keyboard.addKey('N'),
      };
      this.input.keyboard.on('keydown-ESC', () => this.scene.launch('SettingsScene'));
      this.input.keyboard.on('keydown-ONE', () => this.useGadget('tranquility_focus'));
      this.input.keyboard.on('keydown-TWO', () => this.useGadget('echo_lens'));
      this.input.keyboard.on('keydown-THREE', () => this.useGadget('trace_light'));
      this.input.keyboard.on('keydown-FOUR', () => this.useGadget('micro_rover'));
      this.input.keyboard.on('keydown-FIVE', () => this.useGadget('voice_prism'));
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
    EventBus.on('toggle-notebook', () => {
      if (this.scene.isActive('NotebookScene')) this.scene.stop('NotebookScene');
      else this.scene.launch('NotebookScene');
    });

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

    this.events.once('shutdown', () => {
      if (this.lightningTimer) this.lightningTimer.destroy();
    });

    this.save();
  }

  update() {
    // Safety: auto-recover if inDialogue was set but DialogueScene is no longer active
    if (this.inDialogue && !this.scene.isActive('DialogueScene')) {
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
    this.playerTag.setPosition(this.player.x, this.player.y - 24);
    this.player.setDepth(this.player.y);

    // Proximity
    let nearObj: typeof this.interactableObjects[0]|null = null;
    let nearDist = 45;
    for (const ia of this.interactableObjects) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, ia.zone.x, ia.zone.y);
      ia.label.setVisible(d < 45);
      if (d < nearDist) { nearObj = ia; nearDist = d; }
    }

    let nearNpc: typeof this.npcObjects[0]|null = null;
    for (const n of this.npcObjects) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.sprite.x, n.sprite.y);
      if (d < 45) nearNpc = n;
    }

    // Update floating interaction prompt
    if (nearNpc) {
      const sus = nearNpc.data.suspectId ? suspects[nearNpc.data.suspectId] : null;
      this.interactionPrompt.setText(`💬 [E] Talk to ${sus?.name || nearNpc.data.id}`);
      this.interactionPrompt.setVisible(true);
    } else if (nearObj) {
      this.interactionPrompt.setText(`🔍 [E] Examine ${nearObj.data.name}`);
      this.interactionPrompt.setVisible(true);
    } else {
      this.interactionPrompt.setVisible(false);
    }

    if (this.keys.E && Phaser.Input.Keyboard.JustDown(this.keys.E) || this.touchAction) {
      this.touchAction = false;
      if (nearNpc) {
        this.inDialogue = true;
        this.interactionPrompt.setVisible(false);
        const did = nearNpc.data.suspectId ? `${nearNpc.data.suspectId}_interview` : 'intro_arrival';
        this.scene.launch('DialogueScene', {dialogueId:did, suspectId:nearNpc.data.suspectId});
      } else if (nearObj) {
        this.interact(nearObj.data);
      }
    }

    if (this.keys.N && Phaser.Input.Keyboard.JustDown(this.keys.N)) EventBus.emit('toggle-notebook');
  }

  private interact(obj: any) {
    if (obj.gadgetRequired && obj.gadgetRequired !== 'none' && this.activeGadget !== obj.gadgetRequired) {
      this.showMsg(`Requires: ${obj.gadgetRequired.replace('_',' ')}`); return;
    }
    if (obj.evidenceId && !gameState.hasEvidence(obj.evidenceId)) {
      gameState.collectEvidence(obj.evidenceId);
      const ev = evidenceData[obj.evidenceId];
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
    if (this.activeGadget === id) { this.activeGadget=null; this.gadgetOverlay?.destroy(); this.gadgetOverlay=null; EventBus.emit('gadget-changed',null); return; }
    this.activeGadget = id;
    this.gadgetOverlay?.destroy();

    const colors: Record<string,number> = {tranquility_focus:0x2a4a6a, echo_lens:0x2a6a4a, trace_light:0x6a2a8a, voice_prism:0x6a6a2a, micro_rover:0x4a4a2a};
    this.gadgetOverlay = this.add.rectangle(320,180,640,360,colors[id]||0x333333,0.15).setDepth(400).setScrollFactor(0);
    EventBus.emit('gadget-changed', id);

    if (id==='echo_lens' && (this.roomId==='pendulum_room'||this.roomId==='main_hall')) this.echoLensMini();
    else if (id==='micro_rover' && this.roomId==='clockwork_gallery') this.microRoverMini();
    else if (id==='voice_prism' && this.roomId==='exhibition_chamber') this.voicePrismMini();
    else if (id==='trace_light') this.revealTraceItems();
    else this.showMsg(`${id.replace(/_/g,' ')} active.`);
  }

  private echoLensMini() {
    this.inDialogue = true;
    const els: Phaser.GameObjects.GameObject[] = [];
    const bkg = this.add.rectangle(320,180,500,260,0x0a0a12,0.95).setDepth(600).setScrollFactor(0); els.push(bkg);
    els.push(this.add.text(320,70,'🎧 ECHO LENS — Sound Analysis',{fontSize:'11px',color:'#4ac47a',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(601).setScrollFactor(0));
    const w1 = this.add.graphics().setDepth(601).setScrollFactor(0); els.push(w1);
    els.push(this.add.text(120,95,'Standard Bell (12th chime)',{fontSize:'8px',color:'#4a8a9a',fontFamily:'Courier New'}).setDepth(601).setScrollFactor(0));
    w1.lineStyle(2,0x4a8a9a);
    for(let x=0;x<200;x++){const y=Math.sin(x*0.1)*15*Math.exp(-x*0.01);if(x===0)w1.moveTo(120+x,130+y);else w1.lineTo(120+x,130+y);}
    const w2 = this.add.graphics().setDepth(601).setScrollFactor(0); els.push(w2);
    els.push(this.add.text(120,165,'13th Chime (anomalous)',{fontSize:'8px',color:'#c4a44a',fontFamily:'Courier New'}).setDepth(601).setScrollFactor(0));
    w2.lineStyle(2,0xc4a44a);
    for(let x=0;x<200;x++){const y=Math.sin(x*0.12+Math.sin(x*0.03)*2)*15*Math.exp(-x*0.008);if(x===0)w2.moveTo(120+x,200+y);else w2.lineTo(120+x,200+y);}
    els.push(this.add.text(320,240,'The 13th chime has a different resonance.\nIt matches the pendulum room mechanism.',{fontSize:'8px',color:'#a0b0c0',fontFamily:'Courier New',align:'center',wordWrap:{width:400}}).setOrigin(0.5).setDepth(601).setScrollFactor(0));
    const btn = this.add.text(320,290,'[ RECORD FINDING ]',{fontSize:'10px',color:'#4ac47a',fontFamily:'Courier New',backgroundColor:'#1a2a1a',padding:{x:10,y:4}}).setOrigin(0.5).setDepth(601).setScrollFactor(0).setInteractive(); els.push(btn);
    btn.on('pointerdown', () => {
      if(!gameState.hasEvidence('thirteenth_chime_resonance')) { gameState.collectEvidence('thirteenth_chime_resonance'); this.showDiscovery('Thirteenth Chime Resonance','The 13th chime matches the pendulum room — and Project Echo\'s calibration frequency.'); }
      els.forEach(e=>e.destroy()); this.inDialogue=false; this.activeGadget=null; this.gadgetOverlay?.destroy(); this.gadgetOverlay=null; this.save();
    });
  }

  private microRoverMini() {
    this.inDialogue = true;
    const els: Phaser.GameObjects.GameObject[] = [];
    els.push(this.add.rectangle(320,180,400,250,0x0a0a12,0.95).setDepth(600).setScrollFactor(0));
    els.push(this.add.text(320,75,'🤖 MICRO ROVER',{fontSize:'10px',color:'#c4a44a',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(601).setScrollFactor(0));
    const maze=this.add.graphics().setDepth(601).setScrollFactor(0); els.push(maze);
    maze.fillStyle(0x2a2a3a); maze.fillRect(160,100,320,140);
    maze.lineStyle(2,0x4a4a5a); maze.strokeRect(160,100,320,140);
    maze.moveTo(220,100);maze.lineTo(220,180); maze.moveTo(280,160);maze.lineTo(280,240); maze.moveTo(340,100);maze.lineTo(340,200); maze.stroke();
    const rover=this.add.rectangle(180,120,8,8,0x4ac47a).setDepth(602).setScrollFactor(0); els.push(rover);
    const goal=this.add.rectangle(460,220,12,12,0xc4a44a,0.7).setDepth(601).setScrollFactor(0).setInteractive(); els.push(goal);
    this.tweens.add({targets:goal,alpha:0.3,yoyo:true,repeat:-1,duration:500});
    els.push(this.add.text(320,250,'Click the door!',{fontSize:'8px',color:'#8a9aaa',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(601).setScrollFactor(0));
    goal.on('pointerdown', () => {
      this.tweens.chain({targets:rover, tweens:[{x:230,duration:400},{y:190,duration:300},{x:350,y:210,duration:400},{x:460,y:220,duration:500}],
        onComplete:()=>{
          if(!gameState.hasEvidence('connecting_door')){gameState.collectEvidence('connecting_door');this.showDiscovery('Hidden Connecting Door','A hidden door between the clockwork gallery and exhibition chamber!');}
          this.time.delayedCall(1500,()=>{els.forEach(e=>e.destroy());this.inDialogue=false;this.activeGadget=null;this.gadgetOverlay?.destroy();this.gadgetOverlay=null;this.save();});
        }
      });
    });
  }

  private voicePrismMini() {
    this.inDialogue = true;
    const els: Phaser.GameObjects.GameObject[] = [];
    els.push(this.add.rectangle(320,180,500,280,0x0a0a12,0.95).setDepth(600).setScrollFactor(0));
    els.push(this.add.text(320,55,'🔊 VOICE PRISM',{fontSize:'10px',color:'#c4a44a',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(601).setScrollFactor(0));
    const b1=this.add.graphics().setDepth(601).setScrollFactor(0); els.push(b1);
    els.push(this.add.text(120,75,'Announcement Recording:',{fontSize:'8px',color:'#4a8a9a',fontFamily:'Courier New'}).setDepth(601).setScrollFactor(0));
    for(let i=0;i<40;i++){const h=Math.abs(Math.sin(i*0.3))*20+3;b1.fillStyle(0x4a8a9a);b1.fillRect(120+i*8,110-h,6,h*2);}
    b1.fillStyle(0xc44a4a,0.8);b1.fillRect(120+22*8,85,2,50);
    els.push(this.add.text(120+22*8,82,'← SPLICE',{fontSize:'7px',color:'#c44a4a',fontFamily:'Courier New'}).setDepth(601).setScrollFactor(0));
    els.push(this.add.text(320,210,'Whispered "I\'m sorry" matches Nadia Thorn\nwith 94% confidence.',{fontSize:'8px',color:'#e0e8f0',fontFamily:'Courier New',align:'center',wordWrap:{width:400}}).setOrigin(0.5).setDepth(601).setScrollFactor(0));
    const btn=this.add.text(320,280,'[ RECORD FINDINGS ]',{fontSize:'10px',color:'#c4a44a',fontFamily:'Courier New',backgroundColor:'#2a2a1a',padding:{x:10,y:4}}).setOrigin(0.5).setDepth(601).setScrollFactor(0).setInteractive(); els.push(btn);
    btn.on('pointerdown',()=>{
      if(!gameState.hasEvidence('spliced_recording')){gameState.collectEvidence('spliced_recording');this.showDiscovery('Spliced Recording','The announcement was assembled from earlier recordings.');}
      if(!gameState.hasEvidence('petra_recorder')&&gameState.hasEvidence('connecting_door')){gameState.collectEvidence('petra_recorder');this.showDiscovery('Voice Match','Whispered voice matches Nadia Thorn.');}
      els.forEach(e=>e.destroy());this.inDialogue=false;this.activeGadget=null;this.gadgetOverlay?.destroy();this.gadgetOverlay=null;this.save();
    });
  }

  private revealTraceItems() {
    const room = rooms[this.roomId];
    if (!room?.interactables) return;
    for (const obj of room.interactables) {
      if (obj.gadgetRequired==='trace_light' && obj.evidenceId && !gameState.hasEvidence(obj.evidenceId)) {
        const ox = obj.x * TILE;
        const oy = obj.y * TILE;
        const ow = (obj.width || 2) * TILE;
        const oh = (obj.height || 1) * TILE;
        const z = this.add.zone(ox, oy, ow + 8, oh + 8);
        this.physics.add.existing(z, true);
        const mk = this.add.graphics();
        mk.fillStyle(0x9a4aaa, 0.9);
        mk.fillRect(-3, -3, 6, 6);
        mk.setPosition(ox, oy - 16).setDepth(150);
        this.tweens.add({targets: mk, y: oy - 20, yoyo: true, repeat: -1, duration: 600});
        const lb = this.add.text(ox, oy + 12, obj.name, {
          fontSize: '8px', color: '#aa7acc', fontFamily: 'Courier New', backgroundColor: '#090d18ee', padding: { x: 5, y: 2 }
        }).setOrigin(0.5).setDepth(150).setVisible(false);
        this.interactableObjects.push({zone: z, data: obj, marker: mk, label: lb});
      }
    }
    this.showMsg('🔦 Trace Light: hidden traces revealed.');
  }

  private goToRoom(target: string, fromDir: string) {
    if (this.doorCooldown || this.inDialogue) return;
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
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.registry.set('spawnX', sx);
      this.registry.set('spawnY', sy);
      this.scene.restart({ roomId: target });
    });
  }

  private showMsg(text: string) {
    AudioManager.getInstance().playSFX('ui_click');
    const m=this.add.text(320,300,text,{fontSize:'10px',color:'#e0e8f0',fontFamily:'Courier New',backgroundColor:'#0a0a12',padding:{x:8,y:4},wordWrap:{width:400}}).setOrigin(0.5).setDepth(300).setScrollFactor(0);
    this.tweens.add({targets:m,alpha:0,delay:3000,duration:500,onComplete:()=>m.destroy()});
  }

  private showDiscovery(name: string, desc: string) {
    AudioManager.getInstance().playSFX('discoveryString');
    const f=this.add.rectangle(320,180,640,360,0xc4a44a,0.15).setDepth(500).setScrollFactor(0);
    this.tweens.add({targets:f,alpha:0,duration:500,onComplete:()=>f.destroy()});
    const h=this.add.text(320,100,'📋 EVIDENCE FOUND',{fontSize:'12px',color:'#c4a44a',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(501).setScrollFactor(0);
    const n=this.add.text(320,125,name,{fontSize:'14px',color:'#ffffff',fontFamily:'Courier New',fontStyle:'bold'}).setOrigin(0.5).setDepth(501).setScrollFactor(0);
    const d=this.add.text(320,155,desc,{fontSize:'9px',color:'#a0b0c0',fontFamily:'Courier New',wordWrap:{width:350},align:'center'}).setOrigin(0.5,0).setDepth(501).setScrollFactor(0);
    this.tweens.add({targets:[h,n,d],alpha:0,delay:4000,duration:1000,onComplete:()=>{h.destroy();n.destroy();d.destroy();}});
    EventBus.emit('evidence-found', name);
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
      this.add.image(TILE * 8, wallH + 32, 'prop_armchair').setDepth(wallH + 32);
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
      // Reading armchairs
      this.add.image(w / 2 - 32, (wallH + h) / 2 + 10, 'prop_armchair').setDepth((wallH + h) / 2 + 10);
      this.add.image(w / 2 + 32, (wallH + h) / 2 + 10, 'prop_armchair').setDepth((wallH + h) / 2 + 10);
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
        if (['desk', 'main_gear', 'archive_desk', 'shelf_3', 'old_files'].includes(obj.id)) {
          const ox = obj.x * TILE, oy = obj.y * TILE;
          const ow = (obj.width || 2) * TILE, oh = (obj.height || 1) * TILE;
          const furn = this.add.rectangle(ox, oy, ow - 4, oh - 4);
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
