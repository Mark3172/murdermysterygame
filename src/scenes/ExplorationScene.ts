import Phaser from 'phaser';
import { EventBus } from '../engine/EventBus';
import { gameState } from '../logic/GameState';
import { storyManager } from '../logic/StoryPhaseManager';
import { SaveManager } from '../engine/SaveManager';
import { AudioManager } from '../engine/AudioManager';
import { rooms } from '../data/rooms';
import { suspects } from '../data/suspects';
import { evidence as evidenceData } from '../data/evidence';

const TILE = 16;
const SPEED = 80;

export class ExplorationScene extends Phaser.Scene {
  private roomId = 'main_hall';
  private player!: Phaser.GameObjects.Rectangle;
  private playerHead!: Phaser.GameObjects.Arc;
  private playerHair!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private inDialogue = false;
  private activeGadget: string | null = null;
  private gadgetOverlay: Phaser.GameObjects.Rectangle | null = null;
  private interactableObjects: Array<{zone: Phaser.GameObjects.Zone; data: any; marker: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text}> = [];
  private npcObjects: Array<{sprite: Phaser.GameObjects.Rectangle; data: any; label: Phaser.GameObjects.Text}> = [];
  private touchDir = {x:0, y:0};
  private touchAction = false;
  private nextFootstepTime = 0;
  private lightningTimer?: Phaser.Time.TimerEvent;
  private interactionPrompt!: Phaser.GameObjects.Text;

  constructor() { super('ExplorationScene'); }

  init(data: any) {
    this.roomId = data?.roomId || gameState.getCurrentRoom() || 'main_hall';
    this.inDialogue = false;
    this.activeGadget = null;
  }

  create() {
    const room = rooms[this.roomId];
    if (!room) { this.scene.start('TitleScene'); return; }
    gameState.setCurrentRoom(this.roomId);

    const rw = (room.width || 40) * TILE;
    const rh = (room.height || 22) * TILE;

    // Draw room
    const bg = this.add.graphics();
    const bgc = Phaser.Display.Color.HexStringToColor(room.backgroundColor || '#1a1a2a').color;
    const acc = Phaser.Display.Color.HexStringToColor(room.accentColor || '#2a2a3a').color;
    bg.fillStyle(bgc); bg.fillRect(0, 0, rw, rh);
    for (let x = 0; x < rw / TILE; x++) for (let y = 0; y < rh / TILE; y++) {
      bg.fillStyle((x + y) % 2 === 0 ? bgc + 0x050505 : bgc, 0.3);
      bg.fillRect(x * TILE, y * TILE, TILE, TILE);
      bg.lineStyle(1, acc, 0.08); bg.strokeRect(x * TILE, y * TILE, TILE, TILE);
    }
    bg.fillStyle(0x2a2a3a); bg.fillRect(0,0,rw,TILE); bg.fillRect(0,rh-TILE,rw,TILE);
    bg.fillRect(0,0,TILE,rh); bg.fillRect(rw-TILE,0,TILE,rh);
    bg.lineStyle(2, acc, 0.5); bg.strokeRect(TILE, TILE, rw-TILE*2, rh-TILE*2);

    // Room features
    this.drawFeatures(room, rw, rh);

    // Player
    const sx = this.registry.get('spawnX') as number || (room.spawnPoint?.x || rw/2/TILE) * TILE;
    const sy = this.registry.get('spawnY') as number || (room.spawnPoint?.y || rh/2/TILE) * TILE;
    this.registry.remove('spawnX'); this.registry.remove('spawnY');

    this.player = this.add.rectangle(sx, sy, 12, 20, 0x3366aa).setDepth(100);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    this.playerHead = this.add.circle(sx, sy - 8, 5, 0xe8c8a8).setDepth(101);
    this.playerHair = this.add.rectangle(sx, sy - 12, 10, 4, 0x2a1a0a).setDepth(102);

    this.physics.world.setBounds(0, 0, rw, rh);
    this.cameras.main.setBounds(0, 0, rw, rh);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(300);

    // Exits
    if (room.exits) for (const exit of room.exits) {
      if (exit.direction === 'hidden') continue; // hidden exits found via gadgets
      const ex = exit.x * TILE, ey = exit.y * TILE;
      const z = this.add.zone(ex, ey, TILE*2, TILE*2);
      this.physics.add.existing(z, true);
      const arrow = this.add.text(ex, ey, exit.direction==='up'?'▲':exit.direction==='down'?'▼':exit.direction==='left'?'◄':'►', {
        fontSize:'12px', color:'#4a8a9a', fontFamily:'Courier New'
      }).setOrigin(0.5).setDepth(50);
      this.tweens.add({targets:arrow, alpha:0.3, yoyo:true, repeat:-1, duration:800});
      const tgt = rooms[exit.targetRoom];
      if (tgt) this.add.text(ex, ey+14, tgt.name, {fontSize:'7px',color:'#4a8a9a',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(50).setAlpha(0.6);
      this.physics.add.overlap(this.player, z, () => { if (!this.inDialogue) this.goToRoom(exit.targetRoom, exit.direction); });
    }

    // Interactables
    this.interactableObjects = [];
    if (room.interactables) for (const obj of room.interactables) {
      if (obj.evidenceId && gameState.hasEvidence(obj.evidenceId)) continue;
      // Skip items requiring gadgets the player doesn't have yet (unless no gadget required)
      if (obj.gadgetRequired && obj.gadgetRequired !== 'none' && obj.gadgetRequired !== 'tranquility_focus' && !gameState.hasGadget(obj.gadgetRequired)) continue;
      const ox = obj.x * TILE, oy = obj.y * TILE;
      const ow = (obj.width || 2) * TILE, oh = (obj.height || 1) * TILE;
      const z = this.add.zone(ox, oy, ow, oh);
      this.physics.add.existing(z, true);
      z.setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (!this.inDialogue) this.interact(obj);
      });

      this.add.rectangle(ox, oy, ow, oh, 0x3a3a4a, 0.4).setDepth(5);
      const mk = this.add.graphics(); mk.fillStyle(0xc4a44a, 0.8); mk.fillRect(-3,-3,6,6);
      mk.setPosition(ox, oy-16).setDepth(150);
      this.tweens.add({targets:mk, y:oy-20, yoyo:true, repeat:-1, duration:600});
      const lb = this.add.text(ox, oy+12, obj.name, {fontSize:'9px',color:'#c4a44a',fontFamily:'Courier New',backgroundColor:'#0a0a12e0',padding:{x:4,y:2}}).setOrigin(0.5).setDepth(150).setVisible(false);
      this.interactableObjects.push({zone:z, data:obj, marker:mk, label:lb});
    }

    // NPCs
    this.npcObjects = [];
    if (room.npcs) for (const npc of room.npcs) {
      const sus = npc.suspectId ? suspects[npc.suspectId] : null;
      const c = sus?.portraitColors;
      const oc = c ? Phaser.Display.Color.HexStringToColor(c.outfit).color : 0x666666;
      const sc = c ? Phaser.Display.Color.HexStringToColor(c.skin).color : 0xe8c8a8;
      const nx = npc.x * TILE, ny = npc.y * TILE;
      const sp = this.add.rectangle(nx, ny, 14, 22, oc).setDepth(ny);
      sp.setInteractive({ useHandCursor: true });
      sp.on('pointerdown', () => {
        if (!this.inDialogue) {
          this.inDialogue = true;
          const did = npc.suspectId ? `${npc.suspectId}_interview` : 'intro_arrival';
          this.scene.launch('DialogueScene', {dialogueId:did, suspectId:npc.suspectId});
        }
      });

      this.add.circle(nx, ny-9, 6, sc).setDepth(ny+1);
      this.tweens.add({targets:sp, x:nx+1, yoyo:true, repeat:-1, duration:2000+Math.random()*1000});
      const lb = this.add.text(nx, ny+16, sus?.name||npc.id, {fontSize:'9px',color:'#e0e8f0',fontFamily:'Courier New',backgroundColor:'#0a0a12e0',padding:{x:4,y:2}}).setOrigin(0.5).setDepth(200);
      this.npcObjects.push({sprite:sp, data:npc, label:lb});
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
      if (this.time.now > this.nextFootstepTime) {
        AudioManager.getInstance().playSFX('footstep');
        this.nextFootstepTime = this.time.now + 360;
      }
    }
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(dx, dy);

    this.playerHead.setPosition(this.player.x, this.player.y-8);
    this.playerHair.setPosition(this.player.x, this.player.y-12);
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
      this.inDialogue = true;
      this.scene.launch('DialogueScene', {dialogueId:obj.dialogueOnInteract}); return;
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
        const z=this.add.zone(obj.x,obj.y,obj.width||TILE*2,obj.height||TILE); this.physics.add.existing(z,true);
        const mk=this.add.graphics();mk.fillStyle(0x9a4aaa,0.9);mk.fillRect(-3,-3,6,6);mk.setPosition(obj.x,obj.y-16).setDepth(150);
        this.tweens.add({targets:mk,y:obj.y-20,yoyo:true,repeat:-1,duration:600});
        const lb=this.add.text(obj.x,obj.y+12,obj.name,{fontSize:'7px',color:'#aa7acc',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(150).setVisible(false);
        this.interactableObjects.push({zone:z,data:obj,marker:mk,label:lb});
      }
    }
    this.showMsg('🔦 Trace Light: hidden traces revealed.');
  }

  private goToRoom(target: string, fromDir: string) {
    if (this.inDialogue) return;
    this.inDialogue = true;
    AudioManager.getInstance().playSFX('doorOpen');
    const td = rooms[target]; if (!td) return;
    let sx = (td.width||40)*TILE/2, sy = (td.height||22)*TILE/2;
    if (fromDir==='up') sy=(td.height||22)*TILE-TILE*3;
    if (fromDir==='down') sy=TILE*3;
    if (fromDir==='left') sx=(td.width||40)*TILE-TILE*3;
    if (fromDir==='right') sx=TILE*3;
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete',()=>{
      this.registry.set('spawnX',sx); this.registry.set('spawnY',sy);
      this.scene.restart({roomId:target});
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

  private drawFeatures(room: any, w: number, h: number) {
    if (!room.features) return;
    for (const f of room.features) {
      if (f==='rain_window' || f==='rain_effect') {
        this.add.rectangle(w-TILE*3,h/2,TILE*2,TILE*4,0x1a2a4a,0.5).setDepth(2);
        this.add.rectangle(w-TILE*3,h/2,TILE*2,TILE*4).setStrokeStyle(2,0x3a4a5a).setDepth(3);
        for(let i=0;i<8;i++){const s=this.add.rectangle(w-TILE*4+Math.random()*TILE*3,h/2-TILE*2+Math.random()*TILE*4,1,6+Math.random()*6,0x5a7a9a,0.4).setDepth(4);this.tweens.add({targets:s,y:s.y+TILE*4,x:s.x-TILE,duration:800+Math.random()*400,repeat:-1,onRepeat:()=>{s.setPosition(w-TILE*4+Math.random()*TILE*3,h/2-TILE*2);}});}
      } else if (f==='clockwork_gears' || f==='giant_gears') {
        for(let i=0;i<3;i++){const g=this.add.graphics();g.lineStyle(2,0xc4a44a,0.5);g.strokeCircle(0,0,12+i*4);for(let a=0;a<8;a++){const an=(a/8)*Math.PI*2;g.moveTo(Math.cos(an)*8,Math.sin(an)*8);g.lineTo(Math.cos(an)*(16+i*4),Math.sin(an)*(16+i*4));}g.setPosition(TILE*3+i*TILE*6,TILE*3).setDepth(3);this.tweens.add({targets:g,angle:360,duration:8000+i*3000,repeat:-1});}
      } else if (f==='pendulum' || f==='swinging_pendulum') {
        const p=this.add.graphics();p.lineStyle(2,0x8a7a5a,0.8);p.moveTo(0,0);p.lineTo(0,60);p.fillStyle(0xc4a44a);p.fillCircle(0,60,6);p.setPosition(w/2,TILE*2).setDepth(3);this.tweens.add({targets:p,angle:-15,yoyo:true,repeat:-1,duration:1500,ease:'Sine.easeInOut'});
      } else if (f==='bookshelves' || f==='dust_motes') {
        for(let i=0;i<4;i++){for(let b=0;b<6;b++){this.add.rectangle(TILE*2+b*6,TILE*2+i*TILE*3,5,TILE-2,[0x8a2a2a,0x2a5a5a,0x5a4a2a,0x3a3a6a,0x6a5a2a,0x4a2a4a][b%6]).setDepth(3);}this.add.rectangle(TILE*2+18,TILE*2+i*TILE*3+8,42,2,0x3a2a1a).setDepth(2);}
      } else if (f==='telescope' || f==='telescopes') {
        this.add.triangle(w/2,TILE*4,0,20,-4,0,4,0,0x4a4a5a).setDepth(3);this.add.circle(w/2,TILE*4-4,6,0x3a3a4a).setDepth(3);
      } else if (f==='display_cases' || f==='prototype_display') {
        for(let i=0;i<3;i++){const cx=TILE*6+i*TILE*8;this.add.rectangle(cx,h/2,TILE*3,TILE*2,0x2a3a4a,0.3).setDepth(3);this.add.rectangle(cx,h/2,TILE*3,TILE*2).setStrokeStyle(1,0x4a6a7a,0.5).setDepth(4);}
      } else if (f==='brass_railings' || f==='marble_floor') {
        // Draw decorative floor/railing accents
        const g=this.add.graphics();g.lineStyle(1,0xc4a44a,0.25);
        for(let i=1;i<5;i++){g.moveTo(TILE*2,TILE*2+i*(h-TILE*4)/5);g.lineTo(w-TILE*2,TILE*2+i*(h-TILE*4)/5);}
        g.setDepth(1);
      } else if (f==='steam_vents') {
        for(let i=0;i<4;i++){
          const vx=TILE*4+i*(w-TILE*8)/3, vy=h-TILE*2;
          const vent=this.add.rectangle(vx,vy,TILE,4,0x4a4a5a).setDepth(3);
          // Steam particles
          for(let j=0;j<3;j++){
            const steam=this.add.circle(vx+Math.random()*8-4,vy-4,2+Math.random()*2,0xcccccc,0.15).setDepth(4);
            this.tweens.add({targets:steam,y:vy-30-Math.random()*20,alpha:0,duration:2000+Math.random()*1000,repeat:-1,yoyo:false,
              onRepeat:()=>{steam.setPosition(vx+Math.random()*8-4,vy-4);steam.setAlpha(0.15);}});
          }
        }
      } else if (f==='locked_door') {
        // Draw a heavy door indicator
        const g=this.add.graphics();g.fillStyle(0x4a3a2a,0.8);g.fillRect(w/2-TILE,TILE,TILE*2,TILE*2);
        g.lineStyle(2,0x8b4513);g.strokeRect(w/2-TILE,TILE,TILE*2,TILE*2);
        g.fillStyle(0xd4af37);g.fillCircle(w/2+TILE-4,TILE+TILE,3); // doorknob
        g.setDepth(3);
      } else if (f==='echoing_walls') {
        // Draw subtle concentric arcs to suggest acoustics
        const g=this.add.graphics();g.lineStyle(1,0x8e44ad,0.1);
        for(let r=30;r<120;r+=20){g.strokeCircle(w/2,h/2,r);}
        g.setDepth(1);
      }
    }
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
