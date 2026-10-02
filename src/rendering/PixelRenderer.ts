import Phaser from 'phaser';
import { REN_RAW_RGBA_BASE64, REN_FRAME_WIDTH, REN_FRAME_HEIGHT } from './RenSpriteData';

export class PixelRenderer {
  // ─── PROP TEXTURE REGISTRY ──────────────────────────────────────
  private static propKeyMap: Record<string, string> = {
    pa_speaker: 'prop_pa_speaker',
    desk: 'prop_desk',
    thermos: 'prop_thermos',
    door_bolt: 'prop_door_bolt',
    plaque: 'prop_plaque',
    main_gear: 'prop_main_gear',
    dark_corner: 'prop_dark_corner',
    wall_gap: 'prop_wall_gap',
    shelf_3: 'prop_shelf_3',
    archive_desk: 'prop_archive_desk',
    spilled_ink: 'prop_spilled_ink',
    old_files: 'prop_old_files',
    potted_plant: 'prop_potted_plant',
    pendulum: 'prop_pendulum',
    acoustics: 'prop_acoustics',
    floor_grates: 'prop_floor_grates',
    telescope: 'prop_telescope',
    deck_sensors: 'prop_deck_sensors',
  };

  static getPropKey(id: string): string {
    return this.propKeyMap[id] || 'prop_generic';
  }

  // ─── HIGH-FIDELITY ARCHITECTURAL TILES & ROOM PROPS ──────────────
  static generateTileTextures(scene: Phaser.Scene): void {
    this.drawCheckerboardMarbleTile(scene);
    this.drawParquetWoodTile(scene);
    this.drawIndustrialGrateTile(scene);
    this.drawWetStoneTile(scene);
    this.drawGraniteMasonryTile(scene);
    this.drawVictorianWallTile(scene);
    this.drawCrimsonRunnerTile(scene);
    this.drawEmeraldRugTexture(scene);
    this.drawGothicWindowTexture(scene);
    this.drawFireplaceTexture(scene);
    this.drawGrandfatherClockTexture(scene);
    this.drawGrandBookcaseTexture(scene);
    this.drawArmchairTexture(scene);
    this.drawDisplayPedestalTexture(scene);
    this.drawSconceLanternTexture(scene);
    this.drawBrassPipesTexture(scene);
  }

  private static drawCheckerboardMarbleTile(scene: Phaser.Scene) {
    const key = 'tile_marble_checker';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // 4 tiles (16x16 each). (0,0) and (16,16) dark slate noir marble; (16,0) and (0,16) ivory cream marble
    for (let tx = 0; tx < 32; tx += 16) {
      for (let ty = 0; ty < 32; ty += 16) {
        const isDark = ((tx + ty) / 16) % 2 === 0;
        if (isDark) {
          ctx.fillStyle = '#141724';
          ctx.fillRect(tx, ty, 16, 16);
          // Dark marble veins
          ctx.fillStyle = '#22293d';
          ctx.fillRect(tx + 2, ty + 4, 6, 1);
          ctx.fillRect(tx + 7, ty + 5, 5, 1);
          ctx.fillRect(tx + 4, ty + 10, 8, 1);
          // Bevels
          ctx.fillStyle = '#2a344c';
          ctx.fillRect(tx, ty, 16, 1);
          ctx.fillRect(tx, ty, 1, 16);
          ctx.fillStyle = '#0a0c14';
          ctx.fillRect(tx, ty + 15, 16, 1);
          ctx.fillRect(tx + 15, ty, 1, 16);
        } else {
          ctx.fillStyle = '#2b3447';
          ctx.fillRect(tx, ty, 16, 16);
          // Ivory veining
          ctx.fillStyle = '#42516e';
          ctx.fillRect(tx + 3, ty + 3, 7, 1);
          ctx.fillRect(tx + 9, ty + 4, 4, 1);
          ctx.fillRect(tx + 5, ty + 9, 8, 1);
          // Specular polish highlight
          ctx.fillStyle = '#5c6f96';
          ctx.fillRect(tx + 3, ty + 3, 2, 2);
          // Bevels
          ctx.fillStyle = '#475675';
          ctx.fillRect(tx, ty, 16, 1);
          ctx.fillRect(tx, ty, 1, 16);
          ctx.fillStyle = '#181e2b';
          ctx.fillRect(tx, ty + 15, 16, 1);
          ctx.fillRect(tx + 15, ty, 1, 16);
        }
      }
    }
    // Brass intersection inlay
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(15, 15, 2, 2);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(15, 15, 1, 1);

    canvas.refresh();
  }

  private static drawParquetWoodTile(scene: Phaser.Scene) {
    const key = 'tile_parquet_wood';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // 4 parquet blocks (16x16 each). (0,0) and (16,16) horizontal slats; others vertical slats
    for (let bx = 0; bx < 32; bx += 16) {
      for (let by = 0; by < 32; by += 16) {
        const isHorizontal = ((bx + by) / 16) % 2 === 0;
        if (isHorizontal) {
          const woods = ['#3a2012', '#482916', '#2e180c', '#522f1a'];
          for (let s = 0; s < 4; s++) {
            const py = by + s * 4;
            ctx.fillStyle = woods[s % woods.length];
            ctx.fillRect(bx, py, 16, 4);
            // Grain line
            ctx.fillStyle = '#201007';
            ctx.fillRect(bx + 2, py + 1, 12, 1);
            // Slat seam
            ctx.fillStyle = '#160a04';
            ctx.fillRect(bx, py + 3, 16, 1);
            // Brass nail head
            ctx.fillStyle = '#cda434';
            ctx.fillRect(bx + 1, py + 2, 1, 1);
            ctx.fillRect(bx + 14, py + 2, 1, 1);
          }
        } else {
          const woods = ['#452715', '#351c0f', '#4f2c19', '#2b160a'];
          for (let s = 0; s < 4; s++) {
            const px = bx + s * 4;
            ctx.fillStyle = woods[s % woods.length];
            ctx.fillRect(px, by, 4, 16);
            // Grain line
            ctx.fillStyle = '#201007';
            ctx.fillRect(px + 1, by + 2, 1, 12);
            // Slat seam
            ctx.fillStyle = '#160a04';
            ctx.fillRect(px + 3, by, 1, 16);
            // Brass nail head
            ctx.fillStyle = '#cda434';
            ctx.fillRect(px + 2, by + 1, 1, 1);
            ctx.fillRect(px + 2, by + 14, 1, 1);
          }
        }
      }
    }
    // Block outer border groove
    ctx.strokeStyle = '#140803';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 32, 32);

    canvas.refresh();
  }

  private static drawIndustrialGrateTile(scene: Phaser.Scene) {
    const key = 'tile_industrial_grate';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Sub-chamber with glowing orange steam embers
    ctx.fillStyle = '#140c06';
    ctx.fillRect(0, 0, 32, 32);
    // Subtle bronze cogs under floor
    ctx.fillStyle = '#7a3b12';
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.arc(24, 24, 6, 0, Math.PI * 2);
    ctx.fill();

    // Heavy cast iron grating ribs
    ctx.fillStyle = '#222834';
    for (let x = 0; x < 32; x += 8) {
      ctx.fillRect(x, 0, 2, 32);
    }
    for (let y = 0; y < 32; y += 8) {
      ctx.fillRect(0, y, 32, 2);
    }

    // Top rib highlights
    ctx.fillStyle = '#3a4456';
    for (let x = 0; x < 32; x += 8) {
      ctx.fillRect(x, 0, 1, 32);
    }
    for (let y = 0; y < 32; y += 8) {
      ctx.fillRect(0, y, 32, 1);
    }

    // Hex bolt studs at corners
    ctx.fillStyle = '#c49a45';
    ctx.fillRect(1, 1, 2, 2);
    ctx.fillRect(29, 1, 2, 2);
    ctx.fillRect(1, 29, 2, 2);
    ctx.fillRect(29, 29, 2, 2);

    canvas.refresh();
  }

  private static drawWetStoneTile(scene: Phaser.Scene) {
    const key = 'tile_wet_stone';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Dark wet slate flagstones
    ctx.fillStyle = '#121622';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#1a202e';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillRect(17, 1, 14, 14);
    ctx.fillRect(1, 17, 14, 14);
    ctx.fillRect(17, 17, 14, 14);

    // Deep mortar joints
    ctx.fillStyle = '#080a10';
    ctx.fillRect(0, 15, 32, 2);
    ctx.fillRect(15, 0, 2, 32);

    // Rain puddle reflections & water gloss sheen
    ctx.fillStyle = '#2b3e58';
    ctx.fillRect(4, 5, 8, 4);
    ctx.fillRect(20, 20, 7, 5);
    ctx.fillStyle = '#52749e';
    ctx.fillRect(6, 6, 4, 1);
    ctx.fillRect(22, 21, 3, 1);

    canvas.refresh();
  }

  private static drawGraniteMasonryTile(scene: Phaser.Scene) {
    const key = 'tile_granite_masonry';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    ctx.fillStyle = '#181e28';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#222a38';
    ctx.fillRect(2, 2, 28, 12);
    ctx.fillRect(2, 18, 28, 12);
    // Stone texture speckling
    ctx.fillStyle = '#323c4e';
    ctx.fillRect(6, 5, 3, 2);
    ctx.fillRect(20, 8, 4, 2);
    ctx.fillRect(10, 22, 5, 2);
    // Deep acoustic mortar joint
    ctx.fillStyle = '#0d1016';
    ctx.fillRect(0, 15, 32, 2);
    ctx.fillRect(15, 0, 2, 16);
    ctx.fillRect(15, 16, 2, 16);

    canvas.refresh();
  }

  private static drawVictorianWallTile(scene: Phaser.Scene) {
    const key = 'wall_victorian';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 64, 44);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // 1. Top Crown Molding (0..8)
    ctx.fillStyle = '#222838';
    ctx.fillRect(0, 0, 64, 8);
    // Gold dentil blocks
    ctx.fillStyle = '#d4af37';
    for (let x = 2; x < 64; x += 6) {
      ctx.fillRect(x, 2, 3, 4);
    }
    ctx.fillStyle = '#141822';
    ctx.fillRect(0, 7, 64, 1);

    // 2. Victorian Damask Wallpaper (8..28)
    ctx.fillStyle = '#131828';
    ctx.fillRect(0, 8, 64, 20);
    // Gold & navy fleur-de-lis / diamond damask motifs
    for (let x = 6; x < 64; x += 16) {
      ctx.fillStyle = '#3a4a70';
      ctx.fillRect(x, 14, 4, 4);
      ctx.fillStyle = '#cda434';
      ctx.fillRect(x + 1, 15, 2, 2);
      ctx.fillStyle = '#3a4a70';
      ctx.fillRect(x + 1, 12, 2, 2);
      ctx.fillRect(x + 1, 18, 2, 2);
    }

    // 3. Gold Chair Rail (28..31)
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 28, 64, 3);
    ctx.fillStyle = '#fff0aa';
    ctx.fillRect(0, 28, 64, 1);

    // 4. Mahogany Wainscoting (31..44)
    ctx.fillStyle = '#361d10';
    ctx.fillRect(0, 31, 64, 13);
    // Recessed wood panels
    for (let x = 4; x < 64; x += 28) {
      ctx.fillStyle = '#241208';
      ctx.fillRect(x, 33, 24, 8);
      ctx.strokeStyle = '#4e2a18';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 33, 24, 8);
    }
    // Heavy baseboard
    ctx.fillStyle = '#140a05';
    ctx.fillRect(0, 42, 64, 2);

    canvas.refresh();
  }

  private static drawCrimsonRunnerTile(scene: Phaser.Scene) {
    const key = 'carpet_crimson_runner';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 64, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Deep rich royal crimson
    ctx.fillStyle = '#6e121e';
    ctx.fillRect(0, 0, 64, 32);

    // Inner velvet plush highlight
    ctx.fillStyle = '#821a28';
    ctx.fillRect(0, 6, 64, 20);

    // Gold filigree embroidered borders (top and bottom)
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 2, 64, 2);
    ctx.fillRect(0, 28, 64, 2);

    // Gold floral florets
    for (let x = 4; x < 64; x += 8) {
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(x, 2, 2, 2);
      ctx.fillRect(x, 28, 2, 2);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(x - 1, 1, 1, 1);
      ctx.fillRect(x + 2, 1, 1, 1);
    }

    // Outer fringe
    ctx.fillStyle = '#c49a3c';
    ctx.fillRect(0, 0, 64, 1);
    ctx.fillRect(0, 31, 64, 1);

    canvas.refresh();
  }

  private static drawEmeraldRugTexture(scene: Phaser.Scene) {
    const key = 'carpet_emerald_rug';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 96, 96);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Base emerald velvet
    ctx.fillStyle = '#0f2f20';
    ctx.fillRect(0, 0, 96, 96);

    // Gold & Ivory decorative border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 88, 88);

    ctx.strokeStyle = '#f4ebd0';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 80, 80);

    // Corner filigree
    const corners = [[10,10], [80,10], [10,80], [80,80]];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#275e42';
      ctx.fillRect(cx - 2, cy - 2, 10, 10);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(cx, cy, 6, 6);
    });

    // Grand center medallion
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(48, 48, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f4ebd0';
    ctx.beginPath();
    ctx.arc(48, 48, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#801420';
    ctx.beginPath();
    ctx.arc(48, 48, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe066';
    ctx.fillRect(47, 47, 2, 2);

    canvas.refresh();
  }

  private static drawGothicWindowTexture(scene: Phaser.Scene) {
    const key = 'window_gothic_storm';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 56);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Stone arch casing
    ctx.fillStyle = '#222838';
    ctx.fillRect(0, 0, 32, 56);

    // Arched glass opening
    ctx.fillStyle = '#0e1628';
    ctx.fillRect(3, 12, 26, 42);
    ctx.beginPath();
    ctx.arc(16, 14, 13, Math.PI, 0);
    ctx.fill();

    // Storm clouds and rain streaks
    ctx.fillStyle = '#1c2844';
    ctx.fillRect(5, 14, 22, 38);
    ctx.fillStyle = '#4a6a96';
    // Rain droplets
    for (let y = 14; y < 50; y += 7) {
      ctx.fillRect(8 + (y % 5) * 3, y, 1, 4);
      ctx.fillRect(18 + (y % 4) * 2, y + 2, 1, 4);
    }

    // Leaded stained-glass mullions
    ctx.fillStyle = '#12151e';
    ctx.fillRect(15, 2, 2, 52); // center vertical mullion
    ctx.fillRect(3, 28, 26, 2);  // horizontal mullion
    ctx.fillRect(3, 42, 26, 2);

    // Arch tracery
    ctx.strokeStyle = '#12151e';
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 12, 26, 42);

    canvas.refresh();
  }

  private static drawFireplaceTexture(scene: Phaser.Scene) {
    const key = 'prop_fireplace';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 48, 44);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Stone mantel top
    ctx.fillStyle = '#3a4256';
    ctx.fillRect(0, 0, 48, 8);
    ctx.fillStyle = '#4e5a74';
    ctx.fillRect(0, 0, 48, 2); // mantel highlight

    // Brass candelabra and clock on mantel
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(6, -2, 4, 2); // candelabra base
    ctx.fillRect(22, 2, 6, 6); // mantel clock
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 3, 4, 4); // clock face

    // Stone columns
    ctx.fillStyle = '#2a3242';
    ctx.fillRect(2, 8, 8, 36);
    ctx.fillRect(38, 8, 8, 36);

    // Brick firebox
    ctx.fillStyle = '#181210';
    ctx.fillRect(10, 8, 28, 34);
    ctx.fillStyle = '#422018';
    for (let y = 10; y < 40; y += 6) {
      for (let x = 11; x < 36; x += 8) {
        ctx.fillRect(x + ((y % 12) ? 4 : 0), y, 6, 4);
      }
    }

    // Cast-iron andirons & burning logs
    ctx.fillStyle = '#101010';
    ctx.fillRect(12, 38, 24, 4);
    ctx.fillStyle = '#5c220a';
    ctx.fillRect(14, 34, 20, 6);

    // Flickering hearth flames
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(24, 32, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(24, 32, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 30, 2, 3);

    canvas.refresh();
  }

  private static drawGrandfatherClockTexture(scene: Phaser.Scene) {
    const key = 'prop_grandfather_clock';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 20, 56);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Mahogany body
    ctx.fillStyle = '#3a1f10';
    ctx.fillRect(1, 4, 18, 50);

    // Pediment top & brass finial
    ctx.fillStyle = '#4f2c18';
    ctx.fillRect(3, 2, 14, 3);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(9, 0, 2, 3);

    // Clock hood & face
    ctx.fillStyle = '#261208';
    ctx.fillRect(2, 6, 16, 16);
    ctx.fillStyle = '#f4eedb';
    ctx.beginPath();
    ctx.arc(10, 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Clock hands
    ctx.fillStyle = '#101010';
    ctx.fillRect(9, 11, 2, 4);
    ctx.fillRect(10, 13, 3, 1);

    // Glass waist & swinging pendulum
    ctx.fillStyle = '#182434';
    ctx.fillRect(4, 24, 12, 24);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 24, 12, 24);

    // Pendulum rod and brass bob
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(9, 26, 2, 12);
    ctx.beginPath();
    ctx.arc(10, 40, 4, 0, Math.PI * 2);
    ctx.fill();

    // Heavy base
    ctx.fillStyle = '#261208';
    ctx.fillRect(0, 50, 20, 6);

    canvas.refresh();
  }

  private static drawGrandBookcaseTexture(scene: Phaser.Scene) {
    const key = 'prop_grand_bookcase';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 48, 56);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Dark walnut frame
    ctx.fillStyle = '#2a150c';
    ctx.fillRect(0, 0, 48, 56);
    ctx.fillStyle = '#3c2012';
    ctx.fillRect(0, 0, 48, 4); // crown molding

    // 4 shelf tiers
    const bookColors = ['#8c1c28', '#1c4a78', '#20683a', '#966e1c', '#602878', '#a83c22'];
    for (let shelf = 0; shelf < 4; shelf++) {
      const sy = 6 + shelf * 12;
      // Shelf board
      ctx.fillStyle = '#422414';
      ctx.fillRect(2, sy + 10, 44, 2);

      // Book spines
      let bx = 3;
      while (bx < 42) {
        const bw = (bx % 3 === 0) ? 3 : 2;
        const col = bookColors[(shelf * 3 + bx) % bookColors.length];
        ctx.fillStyle = col;
        ctx.fillRect(bx, sy + 1, bw, 9);
        // Gold spine lettering
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(bx, sy + 3, bw, 1);
        bx += bw + 1;
      }
    }

    // Brass rolling ladder on right side
    ctx.fillStyle = '#c49a3c';
    ctx.fillRect(40, 6, 2, 48);
    ctx.fillRect(45, 6, 2, 48);
    for (let r = 12; r < 52; r += 8) {
      ctx.fillRect(40, r, 7, 1);
    }

    canvas.refresh();
  }

  private static drawArmchairTexture(scene: Phaser.Scene) {
    const key = 'prop_armchair';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 28, 28);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Deep crimson velvet backrest
    ctx.fillStyle = '#6e141e';
    ctx.fillRect(3, 2, 22, 14);
    // Tufted buttons
    ctx.fillStyle = '#42080e';
    ctx.fillRect(7, 5, 2, 2);
    ctx.fillRect(13, 5, 2, 2);
    ctx.fillRect(19, 5, 2, 2);
    ctx.fillRect(10, 10, 2, 2);
    ctx.fillRect(16, 10, 2, 2);

    // Rolled arms
    ctx.fillStyle = '#8a1c28';
    ctx.fillRect(1, 8, 4, 14);
    ctx.fillRect(23, 8, 4, 14);

    // Thick seat cushion
    ctx.fillStyle = '#821824';
    ctx.fillRect(4, 14, 20, 10);
    ctx.fillStyle = '#9e2230';
    ctx.fillRect(5, 14, 18, 2);

    // Dark walnut legs
    ctx.fillStyle = '#2a160c';
    ctx.fillRect(3, 24, 3, 4);
    ctx.fillRect(22, 24, 3, 4);

    canvas.refresh();
  }

  private static drawDisplayPedestalTexture(scene: Phaser.Scene) {
    const key = 'prop_display_pedestal';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 24, 36);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Marble pedestal base
    ctx.fillStyle = '#1c2230';
    ctx.fillRect(2, 18, 20, 18);
    ctx.fillStyle = '#2c3548';
    ctx.fillRect(0, 16, 24, 3); // top cap
    ctx.fillRect(0, 33, 24, 3); // base plinth
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 18, 24, 1);

    // Crimson velvet cushion
    ctx.fillStyle = '#801420';
    ctx.fillRect(4, 13, 16, 3);

    // Glowing brass prototype inside
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(12, 9, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff0aa';
    ctx.fillRect(11, 8, 2, 2);

    // Glass cloche bell jar
    ctx.strokeStyle = '#7090b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(12, 7, 6, Math.PI, 0);
    ctx.lineTo(18, 13);
    ctx.lineTo(6, 13);
    ctx.closePath();
    ctx.stroke();
    // Glass specular reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(8, 5, 2, 6);

    canvas.refresh();
  }

  private static drawSconceLanternTexture(scene: Phaser.Scene) {
    const key = 'prop_sconce_lantern';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 16, 22);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Brass wall bracket
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(6, 2, 4, 3);
    ctx.fillRect(7, 5, 2, 6);
    ctx.fillRect(4, 10, 8, 2);

    // Glass lantern body
    ctx.fillStyle = '#181b24';
    ctx.fillRect(3, 12, 10, 8);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 12, 10, 8);

    // Glowing gas flame core
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(8, 16, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 15, 2, 2);

    canvas.refresh();
  }

  private static drawBrassPipesTexture(scene: Phaser.Scene) {
    const key = 'prop_brass_pipes';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 48, 24);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    // Horizontal main pipe
    ctx.fillStyle = '#a67c2e';
    ctx.fillRect(0, 8, 48, 8);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 9, 48, 2); // metallic highlight
    ctx.fillStyle = '#614818';
    ctx.fillRect(0, 15, 48, 1); // shadow

    // Pipe joints / flanges
    ctx.fillStyle = '#c49a3c';
    ctx.fillRect(10, 6, 3, 12);
    ctx.fillRect(32, 6, 3, 12);

    // Pressure gauge dial
    ctx.fillStyle = '#222222';
    ctx.fillRect(21, 1, 8, 8);
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(25, 5, 4, 0, Math.PI * 2);
    ctx.fill();
    // Red indicator needle
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(25, 3, 1, 3);

    // Steam valve wheel
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(33, 3, 3, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  // ─── CHARACTER SPRITES ──────────────────────────────────────────
  // Frame dimension: 24x34. 4 frames per direction, 4 directions = 96x136
  static generateCharacterSprite(scene: Phaser.Scene, charId: string): string {
    const key = `char_${charId}`;
    if (scene.textures.exists(key)) return key;

    // Detective Ren (Player) — Rendered from authentic 16-bit RPG reference spritesheet
    if (charId === 'ren') {
      const fw = REN_FRAME_WIDTH;
      const fh = REN_FRAME_HEIGHT;
      const canvas = scene.textures.createCanvas(key, fw * 4, fh * 4);
      if (!canvas) return key;

      const ctx = canvas.getContext();
      if (!ctx) return key;

      try {
        const binary = atob(REN_RAW_RGBA_BASE64);
        const bytes = new Uint8ClampedArray(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const imgData = new ImageData(bytes, fw * 4, fh * 4);
        ctx.putImageData(imgData, 0, 0);
        canvas.refresh();
      } catch (err) {
        console.error('Failed to draw Ren raw RGBA data:', err);
      }

      const dirs = ['down', 'up', 'left', 'right'];
      for (let d = 0; d < 4; d++) {
        for (let f = 0; f < 4; f++) {
          canvas.add(`${dirs[d]}_${f}`, 0, f * fw, d * fh, fw, fh);
        }
      }

      for (const d of dirs) {
        const animKey = `${charId}_walk_${d}`;
        if (!scene.anims.exists(animKey)) {
          scene.anims.create({
            key: animKey,
            frames: [
              { key, frame: `${d}_0` },
              { key, frame: `${d}_1` },
              { key, frame: `${d}_2` },
              { key, frame: `${d}_3` },
            ],
            frameRate: 6,
            repeat: -1,
          });
        }
      }

      return key;
    }

    // NPC Characters — Rendered with matching 24x34 16-bit RPG proportions
    const fw = 24;
    const fh = 34;
    const canvas = scene.textures.createCanvas(key, fw * 4, fh * 4);
    if (!canvas) return key;

    const ctx = canvas.getContext();
    if (!ctx) return key;

    // Palette & visual features per character
    const cfg = this.getCharacterConfig(charId);

    // Render 4 directions (0: down, 1: up, 2: left, 3: right)
    for (let dir = 0; dir < 4; dir++) {
      for (let frame = 0; frame < 4; frame++) {
        const ox = frame * fw;
        const oy = dir * fh;
        this.drawCharacterFrame(ctx, ox, oy, dir, frame, cfg);
      }
    }

    canvas.refresh();

    // Register named frames for Phaser sprite animations
    const dirs = ['down', 'up', 'left', 'right'];
    for (let d = 0; d < 4; d++) {
      for (let f = 0; f < 4; f++) {
        canvas.add(`${dirs[d]}_${f}`, 0, f * fw, d * fh, fw, fh);
      }
    }

    // Register animations on scene
    for (const d of dirs) {
      const animKey = `${charId}_walk_${d}`;
      if (!scene.anims.exists(animKey)) {
        scene.anims.create({
          key: animKey,
          frames: [
            { key, frame: `${d}_0` },
            { key, frame: `${d}_1` },
            { key, frame: `${d}_2` },
            { key, frame: `${d}_3` },
          ],
          frameRate: 6,
          repeat: -1,
        });
      }
    }

    return key;
  }

  private static getCharacterConfig(id: string) {
    switch (id) {
      case 'ren': // Player Detective
        return {
          id: 'ren',
          hair: '#141824',
          hairHighlight: '#283854',
          skin: '#fcd5b4',
          skinShadow: '#e0b08a',
          coat: '#1a2d54',
          coatHighlight: '#2b4782',
          coatShadow: '#111d36',
          collar: '#ffffff',
          tie: '#d32f2f',
          pants: '#151c2c',
          shoes: '#0c0f16',
          accessory: 'cowlick_lapel',
        };
      case 'nadia': // Lead Acoustician
        return {
          id: 'nadia',
          hair: '#1b2232',
          hairHighlight: '#2c3952',
          skin: '#fae2d0',
          skinShadow: '#dfc2b0',
          coat: '#f4f6fa',
          coatHighlight: '#ffffff',
          coatShadow: '#c8d0de',
          collar: '#8e44ad', // lavender blouse
          tie: '#6c2d82',
          pants: '#262933', // pencil skirt
          shoes: '#12141a',
          accessory: 'glasses_hairpin',
        };
      case 'hugo': // Doctor (Son)
        return {
          id: 'hugo',
          hair: '#2c1e18',
          hairHighlight: '#442e24',
          skin: '#ebd5c5',
          skinShadow: '#7d6878', // exhaustion dark circles
          coat: '#28303e',
          coatHighlight: '#384256',
          coatShadow: '#1a202a',
          collar: '#dcd8d0',
          tie: '#7a2436', // loosened burgundy tie
          pants: '#1e2430',
          shoes: '#3a2214',
          accessory: 'stethoscope_bags',
        };
      case 'petra': // Investigative Journalist
        return {
          id: 'petra',
          hair: '#b84824',
          hairHighlight: '#ea6e3c',
          skin: '#e8b88a',
          skinShadow: '#cf986c',
          coat: '#4d5e38', // olive safari vest
          coatHighlight: '#627648',
          coatShadow: '#364228',
          collar: '#d48a30',
          tie: '#00000000',
          pants: '#343d2c',
          shoes: '#382012',
          accessory: 'camera_strap_ponytail',
        };
      case 'felix': // Wealthy Patron
        return {
          id: 'felix',
          hair: '#9ca4b0',
          hairHighlight: '#c2cbd6',
          skin: '#e8b090',
          skinShadow: '#ca9274',
          coat: '#1e2026', // double-breasted tycoon jacket
          coatHighlight: '#2e323b',
          coatShadow: '#121418',
          collar: '#f5f7fa',
          tie: '#e6b820', // canary yellow silk cravat
          pants: '#181a1f',
          shoes: '#0a0b0d',
          accessory: 'watchchain_mustache',
        };
      case 'iris': // Retired Engineer
        return {
          id: 'iris',
          hair: '#78828e',
          hairHighlight: '#b0b8c4',
          skin: '#ecd0c2',
          skinShadow: '#ccaeb0',
          coat: '#1e3868', // Victorian indigo shawl
          coatHighlight: '#2c4e8e',
          coatShadow: '#122448',
          collar: '#e8ecf4',
          tie: '#d0d4e0', // silver brooch
          pants: '#141f38', // long skirt
          shoes: '#101420',
          accessory: 'chignon_glove',
        };
      case 'vale': // Forensic Mentor
      default:
        return {
          id: 'vale',
          hair: '#d0d4dc',
          hairHighlight: '#eef2f8',
          skin: '#fadcc8',
          skinShadow: '#d8bca8',
          coat: '#edf1f5',
          coatHighlight: '#ffffff',
          coatShadow: '#c4ccd8',
          collar: '#204a36', // green turtleneck
          tie: '#00000000',
          pants: '#222830',
          shoes: '#111318',
          accessory: 'glasses_stethoscope',
        };
    }
  }

  private static drawCharacterFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: number,
    frame: number,
    cfg: ReturnType<typeof PixelRenderer.getCharacterConfig>
  ) {
    const sx = 3;
    const sy = 4;
    const p = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(ox + sx + x), Math.floor(oy + sy + y), 1, 1);
    };
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(ox + sx + x), Math.floor(oy + sy + y), Math.floor(w), Math.floor(h));
    };

    // Walking bounce offset
    const bob = (frame === 1 || frame === 3) ? 1 : 0;

    // ─── 1. LEGS & SHOES ───────────────────────────────────────────
    if (dir === 0 || dir === 1) {
      // FRONT OR BACK
      if (frame === 0 || frame === 2) {
        // Standing neutral
        rect(5, 19, 3, 5, cfg.pants);
        rect(10, 19, 3, 5, cfg.pants);
        rect(5, 24, 3, 2, cfg.shoes);
        rect(10, 24, 3, 2, cfg.shoes);
      } else if (frame === 1) {
        // Step left
        rect(4, 18, 3, 5, cfg.pants);
        rect(11, 20, 3, 4, cfg.pants);
        rect(4, 23, 3, 2, cfg.shoes);
        rect(11, 24, 3, 2, cfg.shoes);
      } else if (frame === 3) {
        // Step right
        rect(4, 20, 3, 4, cfg.pants);
        rect(11, 18, 3, 5, cfg.pants);
        rect(4, 24, 3, 2, cfg.shoes);
        rect(11, 23, 3, 2, cfg.shoes);
      }
    } else {
      // SIDE (LEFT / RIGHT)
      if (frame === 0 || frame === 2) {
        rect(7, 19, 4, 5, cfg.pants);
        rect(6, 24, 5, 2, cfg.shoes);
      } else if (frame === 1) {
        rect(5, 18, 4, 5, cfg.pants);
        rect(9, 20, 3, 4, cfg.pants);
        rect(4, 23, 4, 2, cfg.shoes);
        rect(9, 24, 3, 2, cfg.shoes);
      } else if (frame === 3) {
        rect(8, 18, 4, 5, cfg.pants);
        rect(5, 20, 3, 4, cfg.pants);
        rect(8, 23, 4, 2, cfg.shoes);
        rect(4, 24, 3, 2, cfg.shoes);
      }
    }

    // ─── 2. TORSO & COAT ───────────────────────────────────────────
    const ty = 11 + bob;
    // Base jacket / coat
    rect(4, ty, 10, 8, cfg.coat);
    rect(5, ty, 8, 1, cfg.coatHighlight);
    rect(4, ty + 7, 10, 1, cfg.coatShadow);

    // Front details (DIR 0: DOWN)
    if (dir === 0) {
      // Shirt collar V-neck
      rect(8, ty, 2, 3, cfg.collar);
      // Tie / Ascot / Brooch
      if (cfg.tie !== '#00000000') {
        rect(8, ty + 1, 2, 4, cfg.tie);
        p(8, ty + 5, cfg.tie);
      }
      // Lapel shading
      rect(6, ty + 1, 1, 6, cfg.coatHighlight);
      rect(11, ty + 1, 1, 6, cfg.coatHighlight);
      // Buttons / Watch chain
      if (cfg.accessory === 'watchchain_mustache') {
        p(7, ty + 3, '#f1c40f');
        p(8, ty + 4, '#f1c40f');
        p(9, ty + 4, '#f1c40f');
        p(10, ty + 3, '#f1c40f');
      } else {
        p(7, ty + 4, '#d4af37');
        p(7, ty + 6, '#d4af37');
      }

      // Hands at sides
      rect(3, ty + 1, 1, 5, cfg.coat);
      rect(14, ty + 1, 1, 5, cfg.coat);
      p(3, ty + 6, cfg.skin);
      p(14, ty + 6, cfg.accessory === 'chignon_glove' ? '#5a3824' : cfg.skin);
    } else if (dir === 1) {
      // Back seam & collar
      rect(8, ty, 2, 8, cfg.coatShadow);
      rect(3, ty + 1, 1, 5, cfg.coatShadow);
      rect(14, ty + 1, 1, 5, cfg.coatShadow);
    } else {
      // Side profile
      rect(dir === 2 ? 4 : 10, ty + 2, 2, 5, cfg.coatShadow);
      // Arm swing
      const armX = dir === 2 ? (frame === 1 ? 5 : frame === 3 ? 9 : 7) : (frame === 1 ? 9 : frame === 3 ? 5 : 7);
      rect(armX, ty + 1, 2, 5, cfg.coat);
      p(armX, ty + 6, cfg.skin);
    }

    // Special chest accessories
    if (cfg.accessory === 'camera_strap_ponytail') {
      // Diagonal camera strap
      for (let s = 0; s < 7; s++) {
        p(5 + s, ty + s, '#2b1d0c');
      }
      // Silver rangefinder camera on hip
      rect(11, ty + 4, 3, 3, '#a0abb8');
      p(12, ty + 5, '#4080b0'); // camera lens
    } else if (cfg.accessory === 'stethoscope_bags' && dir === 0) {
      // Stethoscope tubing
      p(6, ty, '#708090');
      p(6, ty + 1, '#708090');
      p(11, ty, '#708090');
      p(11, ty + 1, '#708090');
      p(9, ty + 3, '#b0c0d0'); // bell
    }

    // ─── 3. HEAD & FACE ────────────────────────────────────────────
    const hy = 3 + bob;
    // Neck
    rect(7, hy + 7, 4, 2, cfg.skinShadow);

    // Head base (skin)
    rect(5, hy + 2, 8, 6, cfg.skin);
    rect(4, hy + 3, 10, 4, cfg.skin);

    // Face details
    if (dir === 0) {
      // EYES & NOSE
      p(6, hy + 4, '#ffffff'); // left sclera
      p(7, hy + 4, '#1a2233'); // left pupil
      p(10, hy + 4, '#ffffff'); // right sclera
      p(11, hy + 4, '#1a2233'); // right pupil

      // Eyebrows
      rect(6, hy + 3, 2, 1, cfg.hair);
      rect(10, hy + 3, 2, 1, cfg.hair);

      // Glasses
      if (cfg.accessory === 'glasses_hairpin' || cfg.accessory === 'glasses_stethoscope') {
        rect(5, hy + 4, 3, 1, '#a6b8cc');
        rect(10, hy + 4, 3, 1, '#a6b8cc');
        p(8, hy + 4, '#a6b8cc');
        p(6, hy + 4, '#d0f0ff'); // glint
      }

      // Eye bags for Hugo
      if (cfg.accessory === 'stethoscope_bags') {
        rect(6, hy + 5, 2, 1, '#7d6878');
        rect(10, hy + 5, 2, 1, '#7d6878');
      }

      // Mustache for Felix
      if (cfg.accessory === 'watchchain_mustache') {
        rect(7, hy + 6, 4, 1, '#b0b8c4');
        p(6, hy + 6, '#b0b8c4');
        p(11, hy + 6, '#b0b8c4');
      }
    } else if (dir === 2) {
      // Left eye profile
      p(5, hy + 4, '#1a2233');
      p(6, hy + 4, '#ffffff');
    } else if (dir === 3) {
      // Right eye profile
      p(12, hy + 4, '#1a2233');
      p(11, hy + 4, '#ffffff');
    }

    // ─── 4. HAIR & HEADPIECES ──────────────────────────────────────
    if (dir === 1) {
      // Full back hair
      rect(4, hy, 10, 8, cfg.hair);
      rect(5, hy, 8, 2, cfg.hairHighlight);
      if (cfg.accessory === 'camera_strap_ponytail') {
        // High ponytail back
        rect(8, hy - 3, 4, 4, cfg.hairHighlight);
        rect(9, hy - 2, 3, 7, cfg.hair);
        p(8, hy - 1, '#2b1d0c'); // hair tie
      } else if (cfg.accessory === 'chignon_glove') {
        // Braided chignon bun
        rect(7, hy + 2, 4, 4, cfg.hairHighlight);
        p(8, hy + 1, '#dce2ee'); // silver comb
      }
    } else {
      // Hair top crown
      rect(5, hy, 8, 3, cfg.hair);
      rect(6, hy, 6, 1, cfg.hairHighlight);

      // Sides
      rect(3, hy + 1, 2, 5, cfg.hair);
      rect(13, hy + 1, 2, 5, cfg.hair);

      // Specific hairstyles
      if (cfg.id === 'ren') {
        // Detective Cowlick / Spiky front fringe
        p(5, hy - 1, cfg.hair);
        p(6, hy - 1, cfg.hairHighlight);
        rect(6, hy + 2, 2, 2, cfg.hair);
        p(9, hy + 2, cfg.hair);
      } else if (cfg.id === 'nadia') {
        // Sharp asymmetric bob & gold hairpin
        rect(4, hy + 2, 2, 5, cfg.hair);
        rect(12, hy + 2, 2, 4, cfg.hair);
        rect(12, hy + 1, 2, 1, '#e5b73b'); // gold hairpin
      } else if (cfg.id === 'petra') {
        // Ponytail spilling to side
        p(13, hy - 1, cfg.hairHighlight);
        rect(14, hy, 2, 5, cfg.hair);
      } else if (cfg.id === 'felix') {
        // Slicked back silver temples
        rect(4, hy + 1, 1, 4, cfg.hairHighlight);
        rect(13, hy + 1, 1, 4, cfg.hairHighlight);
      } else if (cfg.id === 'iris') {
        // Silver-streaked chignon comb
        p(12, hy + 1, '#dce2ee');
      }
    }
  }

  // ─── INTERACTIVE CLUE MARKER ────────────────────────────────────
  static generateInteractionMarker(scene: Phaser.Scene): string {
    const key = 'sparkle_gleam';
    if (scene.textures.exists(key)) return key;

    const canvas = scene.textures.createCanvas(key, 16, 16);
    if (!canvas) return key;

    const ctx = canvas.getContext();
    if (!ctx) return key;

    // Glowing detective 4-point star
    // Soft outer glow
    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Medium glow
    ctx.fillStyle = 'rgba(255, 235, 120, 0.6)';
    ctx.beginPath();
    ctx.arc(8, 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sharp star diamond
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(8, 1);
    ctx.lineTo(10, 6);
    ctx.lineTo(15, 8);
    ctx.lineTo(10, 10);
    ctx.lineTo(8, 15);
    ctx.lineTo(6, 10);
    ctx.lineTo(1, 8);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();

    canvas.refresh();
    return key;
  }

  // ─── PROCEDURAL PROP GENERATOR ──────────────────────────────────
  static generateAllProps(scene: Phaser.Scene): void {
    this.generateTileTextures(scene);
    this.generateInteractionMarker(scene);

    this.drawDeskProp(scene);
    this.drawThermosProp(scene);
    this.drawDoorBoltProp(scene);
    this.drawPlaqueProp(scene);
    this.drawPaSpeakerProp(scene);
    this.drawMainGearProp(scene);
    this.drawDarkCornerProp(scene);
    this.drawWallGapProp(scene);
    this.drawShelf3Prop(scene);
    this.drawArchiveDeskProp(scene);
    this.drawSpilledInkProp(scene);
    this.drawOldFilesProp(scene);
    this.drawPottedPlantProp(scene);
    this.drawPendulumProp(scene);
    this.drawAcousticsProp(scene);
    this.drawFloorGratesProp(scene);
    this.drawTelescopeProp(scene);
    this.drawDeckSensorsProp(scene);
    this.drawGenericProp(scene);
  }

  private static drawDeskProp(scene: Phaser.Scene) {
    const key = 'prop_desk';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 64, 44);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Mahogany executive desk body
    ctx.fillStyle = '#3a1f10';
    ctx.fillRect(2, 6, 60, 36);

    // Desk top surface with beveled wood highlight
    ctx.fillStyle = '#5c331a';
    ctx.fillRect(0, 4, 64, 14);
    ctx.fillStyle = '#784323';
    ctx.fillRect(0, 2, 64, 2);

    // Green leather blotter pad with gold leaf trim
    ctx.fillStyle = '#1c3a28';
    ctx.fillRect(16, 5, 32, 10);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(17, 6, 30, 8);

    // Scattered documents on desk
    ctx.fillStyle = '#f0ebe0';
    ctx.fillRect(20, 7, 8, 6);
    ctx.fillStyle = '#333333';
    ctx.fillRect(22, 8, 4, 1);
    ctx.fillRect(22, 10, 4, 1);

    // Glass inkwell & quill
    ctx.fillStyle = '#223344';
    ctx.fillRect(40, 7, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(42, 5, 1, 4);

    // Banker's Lamp (brass with green glass shade)
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(52, 10, 4, 2); // base
    ctx.fillRect(53, 5, 2, 6);  // neck
    ctx.fillStyle = '#228b22';
    ctx.fillRect(50, 4, 8, 4);  // green glass shade
    ctx.fillStyle = '#fff4a0';
    ctx.fillRect(51, 8, 6, 1);  // warm bulb glow

    // Pedestal drawers (left and right)
    ctx.fillStyle = '#2e180c';
    ctx.fillRect(4, 18, 16, 22);
    ctx.fillRect(44, 18, 16, 22);

    // Center kneehole
    ctx.fillStyle = '#140a05';
    ctx.fillRect(20, 18, 24, 22);

    // Drawer dividers and brass handles
    for (let d = 0; d < 3; d++) {
      const dy = 20 + d * 7;
      ctx.fillStyle = '#482714';
      ctx.fillRect(5, dy, 14, 6);
      ctx.fillRect(45, dy, 14, 6);
      // Brass handle pulls
      ctx.fillStyle = '#e5b73b';
      ctx.fillRect(10, dy + 2, 4, 2);
      ctx.fillRect(50, dy + 2, 4, 2);
    }

    canvas.refresh();
  }

  private static drawThermosProp(scene: Phaser.Scene) {
    const key = 'prop_thermos';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 20, 20);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // White porcelain saucer
    ctx.fillStyle = '#e8ecf0';
    ctx.beginPath();
    ctx.ellipse(14, 14, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Teacup
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 10, 6, 4);
    ctx.fillStyle = '#7a3c10'; // tea liquid
    ctx.fillRect(12, 10, 4, 1);

    // Stainless steel vacuum thermos
    ctx.fillStyle = '#b0bac6';
    ctx.fillRect(3, 4, 7, 13);
    ctx.fillStyle = '#e0e8f2';
    ctx.fillRect(4, 4, 2, 13); // specular metallic reflection

    // Signature red band
    ctx.fillStyle = '#c02626';
    ctx.fillRect(3, 8, 7, 3);

    // Black stopper lid
    ctx.fillStyle = '#1e242c';
    ctx.fillRect(4, 2, 5, 2);

    // Steam curl
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(13, 6, 1, 2);
    ctx.fillRect(14, 4, 1, 2);

    canvas.refresh();
  }

  private static drawDoorBoltProp(scene: Phaser.Scene) {
    const key = 'prop_door_bolt';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 20);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Aged oak backplate with brass studs
    ctx.fillStyle = '#3a2012';
    ctx.fillRect(2, 2, 28, 16);
    ctx.strokeStyle = '#180c05';
    ctx.strokeRect(2, 2, 28, 16);

    // Corner rivets
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(26, 4, 2, 2);
    ctx.fillRect(4, 14, 2, 2);
    ctx.fillRect(26, 14, 2, 2);

    // Heavy iron bolt casing
    ctx.fillStyle = '#222830';
    ctx.fillRect(8, 6, 16, 8);
    ctx.fillStyle = '#384250';
    ctx.fillRect(8, 6, 16, 2);

    // Sliding deadbolt bar
    ctx.fillStyle = '#708090';
    ctx.fillRect(4, 8, 24, 4);
    ctx.fillStyle = '#a0b0c0';
    ctx.fillRect(4, 8, 24, 1);

    // Bolt handle knob
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(18, 5, 4, 6);

    canvas.refresh();
  }

  private static drawPlaqueProp(scene: Phaser.Scene) {
    const key = 'prop_plaque';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 20, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Mahogany wall mount backing
    ctx.fillStyle = '#2c160a';
    ctx.fillRect(1, 2, 18, 28);

    // Golden brass plaque
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(3, 4, 14, 24);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(4, 5, 12, 1);

    // Engraved observatory dome emblem
    ctx.fillStyle = '#8c7018';
    ctx.beginPath();
    ctx.arc(10, 10, 3, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(7, 10, 6, 2);

    // Engraved text lines
    for (let l = 0; l < 4; l++) {
      ctx.fillRect(5, 15 + l * 3, 10, 1);
    }

    // Tucked secret paper edge sticking out of top-right corner!
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(15, 3, 3, 4);

    canvas.refresh();
  }

  private static drawPaSpeakerProp(scene: Phaser.Scene) {
    const key = 'prop_pa_speaker';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Walnut wall shield plate
    ctx.fillStyle = '#3a2012';
    ctx.fillRect(4, 4, 24, 24);
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(5, 5, 22, 22);

    // Flared brass megaphone horn
    ctx.fillStyle = '#b89224';
    ctx.beginPath();
    ctx.moveTo(16, 16);
    ctx.lineTo(8, 8);
    ctx.lineTo(24, 8);
    ctx.closePath();
    ctx.fill();

    // Concentric acoustic wire grill
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(16, 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(15, 7, 2, 6);
    ctx.fillRect(13, 9, 6, 2);

    // Copper wires running down to terminal
    ctx.strokeStyle = '#b85824';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 24); ctx.lineTo(16, 30);
    ctx.moveTo(18, 24); ctx.lineTo(18, 30);
    ctx.stroke();

    canvas.refresh();
  }

  private static drawMainGearProp(scene: Phaser.Scene) {
    const key = 'prop_main_gear';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 96, 96);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const cx = 48, cy = 48;

    // Dark industrial machinery recess
    ctx.fillStyle = '#141820';
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.fill();

    // Master brass gear rim
    ctx.fillStyle = '#c49a34';
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();

    // 16 Gear teeth around perimeter
    ctx.fillStyle = '#e0b848';
    for (let t = 0; t < 16; t++) {
      const angle = (t / 16) * Math.PI * 2;
      const tx = cx + Math.cos(angle) * 38;
      const ty = cy + Math.sin(angle) * 38;
      ctx.fillRect(tx - 3, ty - 3, 6, 6);
    }

    // Inner cutout ring
    ctx.fillStyle = '#1c222c';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    // 6 Ornamental gear spokes
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
      ctx.stroke();
    }

    // Heavy central axle hub
    ctx.fillStyle = '#505a68';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Intermeshing secondary copper pinion gear at top-right
    ctx.fillStyle = '#b85828';
    ctx.beginPath();
    ctx.arc(80, 24, 12, 0, Math.PI * 2);
    ctx.fill();
    for (let pt = 0; pt < 8; pt++) {
      const pa = (pt / 8) * Math.PI * 2;
      ctx.fillRect(80 + Math.cos(pa) * 12 - 2, 24 + Math.sin(pa) * 12 - 2, 4, 4);
    }

    canvas.refresh();
  }

  private static drawDarkCornerProp(scene: Phaser.Scene) {
    const key = 'prop_dark_corner';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Deep shadowed stone alcove
    const grad = ctx.createRadialGradient(8, 8, 2, 16, 16, 18);
    grad.addColorStop(0, '#06080e');
    grad.addColorStop(1, 'rgba(10, 14, 24, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    // Spiderweb in corner
    ctx.strokeStyle = 'rgba(200, 210, 225, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.lineTo(8, 0);
    ctx.moveTo(0, 14); ctx.lineTo(14, 0);
    ctx.moveTo(0, 20); ctx.lineTo(20, 0);
    ctx.stroke();

    // Planted wiretap recorder on floor
    ctx.fillStyle = '#1c222c';
    ctx.fillRect(12, 18, 8, 6);
    ctx.fillStyle = '#7a8898';
    ctx.fillRect(13, 19, 3, 4); // micro cassette spool
    // Status LED
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(18, 19, 2, 2);

    canvas.refresh();
  }

  private static drawWallGapProp(scene: Phaser.Scene) {
    const key = 'prop_wall_gap';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 20);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Rusted iron ventilation grate
    ctx.fillStyle = '#2a221c';
    ctx.fillRect(2, 2, 28, 16);
    ctx.strokeStyle = '#4a382c';
    ctx.strokeRect(2, 2, 28, 16);

    // Grate louvers with gap
    ctx.fillStyle = '#100c08';
    for (let g = 0; g < 4; g++) {
      ctx.fillRect(4, 4 + g * 3, 12, 2);
    }
    // Broken pried section revealing dark opening
    ctx.fillStyle = '#000000';
    ctx.fillRect(18, 4, 10, 12);
    // Subtle draft breeze lines
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.2)';
    ctx.beginPath();
    ctx.moveTo(22, 6); ctx.lineTo(16, 12);
    ctx.stroke();

    canvas.refresh();
  }

  private static drawShelf3Prop(scene: Phaser.Scene) {
    const key = 'prop_shelf_3';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 64, 28);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Walnut bookshelf unit
    ctx.fillStyle = '#2e180c';
    ctx.fillRect(0, 0, 64, 28);
    ctx.fillStyle = '#482714';
    ctx.fillRect(0, 0, 64, 3);
    ctx.fillRect(0, 13, 64, 3);
    ctx.fillRect(0, 25, 64, 3);

    // Colorful leatherbound books on shelves
    const bookColors = ['#8a2020', '#1c4a30', '#203a68', '#8a6420', '#4a2068', '#683a20'];
    let bx = 3;
    while (bx < 60) {
      // Leave empty dust gap between x = 24 and 40 where missing lantern sat!
      if (bx >= 22 && bx <= 40) {
        bx += 4;
        continue;
      }
      const bw = 3 + (bx % 3);
      const c = bookColors[(bx * 3) % bookColors.length];
      // Upper shelf
      ctx.fillStyle = c;
      ctx.fillRect(bx, 3, bw, 10);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(bx + 1, 6, bw - 2, 1); // gold spine rib

      // Lower shelf
      ctx.fillStyle = bookColors[(bx + 2) % bookColors.length];
      ctx.fillRect(bx, 16, bw, 9);
      bx += bw + 1;
    }

    // Clean dust-free lantern outline in the gap
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(24, 6, 14, 7);
    ctx.strokeStyle = 'rgba(255, 235, 140, 0.4)';
    ctx.strokeRect(25, 7, 12, 6);

    canvas.refresh();
  }

  private static drawArchiveDeskProp(scene: Phaser.Scene) {
    const key = 'prop_archive_desk';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 48, 36);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Dark oak table top
    ctx.fillStyle = '#3c2415';
    ctx.fillRect(2, 4, 44, 28);
    ctx.fillStyle = '#5c3822';
    ctx.fillRect(0, 2, 48, 4);

    // Legs
    ctx.fillStyle = '#22140a';
    ctx.fillRect(2, 28, 4, 8);
    ctx.fillRect(42, 28, 4, 8);

    // Open ledger book
    ctx.fillStyle = '#f2ecd8';
    ctx.fillRect(10, 8, 24, 14);
    ctx.fillStyle = '#333333';
    ctx.fillRect(21, 8, 2, 14); // center spine
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(12, 10 + r * 3, 8, 1);
      ctx.fillRect(24, 10 + r * 3, 8, 1);
    }

    // Brass magnifying glass
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(38, 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a0d8ef';
    ctx.beginPath();
    ctx.arc(38, 12, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(40, 15, 4, 2); // handle

    canvas.refresh();
  }

  private static drawSpilledInkProp(scene: Phaser.Scene) {
    const key = 'prop_spilled_ink';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 24, 20);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Tipped glass bottle
    ctx.fillStyle = '#2c1e34';
    ctx.fillRect(3, 8, 6, 8);
    ctx.fillStyle = '#c48232'; // cork stopper
    ctx.fillRect(9, 10, 2, 4);

    // Spilled violet ink puddle
    ctx.fillStyle = '#4a154b';
    ctx.beginPath();
    ctx.ellipse(15, 12, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shimmering chemical gloss
    ctx.fillStyle = '#8e24aa';
    ctx.beginPath();
    ctx.ellipse(14, 11, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e1bee7';
    ctx.fillRect(13, 10, 2, 1);

    canvas.refresh();
  }

  private static drawOldFilesProp(scene: Phaser.Scene) {
    const key = 'prop_old_files';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 36);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Steel olive filing cabinet
    ctx.fillStyle = '#2c352a';
    ctx.fillRect(2, 2, 28, 32);
    ctx.strokeStyle = '#404c3e';
    ctx.strokeRect(2, 2, 28, 32);

    // 3 Drawers
    for (let d = 0; d < 3; d++) {
      const dy = 4 + d * 10;
      ctx.fillStyle = '#384436';
      ctx.fillRect(4, dy, 24, 8);
      // Brass handle
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(13, dy + 3, 6, 2);
      // White label slot
      ctx.fillStyle = '#eef2f0';
      ctx.fillRect(14, dy + 1, 4, 1);
    }

    // Top drawer ajar with files
    ctx.fillStyle = '#e0c888'; // manila folder tab
    ctx.fillRect(8, 2, 6, 3);

    canvas.refresh();
  }

  private static drawPottedPlantProp(scene: Phaser.Scene) {
    const key = 'prop_potted_plant';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 36);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Terracotta ornate planter urn
    ctx.fillStyle = '#8a3c20';
    ctx.beginPath();
    ctx.moveTo(8, 20); ctx.lineTo(24, 20);
    ctx.lineTo(21, 34); ctx.lineTo(11, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b85834';
    ctx.fillRect(7, 18, 18, 3); // rim

    // Dark soil
    ctx.fillStyle = '#24140c';
    ctx.fillRect(10, 19, 12, 3);

    // Cascading fern fronds
    const greens = ['#1e5b28', '#2e7d32', '#4caf50', '#81c784'];
    for (let f = 0; f < 12; f++) {
      const angle = (f / 12) * Math.PI * 2;
      const r = 8 + (f % 5) * 2;
      ctx.strokeStyle = greens[f % greens.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 18);
      ctx.quadraticCurveTo(16 + Math.cos(angle) * r, 8, 16 + Math.cos(angle) * (r + 4), 16 + Math.sin(angle) * r);
      ctx.stroke();
    }

    canvas.refresh();
  }

  private static drawPendulumProp(scene: Phaser.Scene) {
    const key = 'prop_pendulum';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 64, 64);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const cx = 32, cy = 32;

    // Inscribed marble floor dial
    ctx.fillStyle = '#1c2432';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();

    // Compass rose & degree ticks
    ctx.strokeStyle = '#c49a34';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.stroke();

    for (let d = 0; d < 12; d++) {
      const a = (d / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22);
      ctx.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26);
      ctx.stroke();
    }

    // Heavy spherical brass bob with pointed tip
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = '#fff0a0';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pointed stylus at bottom
    ctx.fillStyle = '#8a6818';
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + 9);
    ctx.lineTo(cx + 2, cy + 9);
    ctx.lineTo(cx, cy + 14);
    ctx.closePath();
    ctx.fill();

    canvas.refresh();
  }

  private static drawAcousticsProp(scene: Phaser.Scene) {
    const key = 'prop_acoustics';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 36);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Cast-iron surveyor tripod
    ctx.strokeStyle = '#222830';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 16); ctx.lineTo(6, 34);
    ctx.moveTo(16, 16); ctx.lineTo(16, 34);
    ctx.moveTo(16, 16); ctx.lineTo(26, 34);
    ctx.stroke();

    // Parabolic brass acoustic sound dish
    ctx.fillStyle = '#c49a34';
    ctx.beginPath();
    ctx.arc(16, 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Concentric diaphragm collector
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(16, 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(16, 12, 2, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  private static drawFloorGratesProp(scene: Phaser.Scene) {
    const key = 'prop_floor_grates';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Cast bronze floor grating
    ctx.fillStyle = '#382e22';
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = '#604f38';
    ctx.strokeRect(1, 1, 30, 30);

    // Warm underglow from mechanical machinery
    ctx.fillStyle = 'rgba(255, 180, 50, 0.25)';
    ctx.fillRect(3, 3, 26, 26);

    // Diamond lattice mesh
    ctx.strokeStyle = '#18120c';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 32; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(0, i);
      ctx.moveTo(32 - i, 0); ctx.lineTo(32, i);
      ctx.stroke();
    }

    canvas.refresh();
  }

  private static drawTelescopeProp(scene: Phaser.Scene) {
    const key = 'prop_telescope';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 40, 44);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Mahogany tripod legs
    ctx.strokeStyle = '#4a2814';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 20); ctx.lineTo(6, 42);
    ctx.moveTo(20, 20); ctx.lineTo(20, 42);
    ctx.moveTo(20, 20); ctx.lineTo(34, 42);
    ctx.stroke();

    // Tripod brass mount head
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(17, 17, 6, 6);

    // Polished brass optical barrel angled up toward the sky
    ctx.save();
    ctx.translate(20, 18);
    ctx.rotate(-0.55); // angled upward ~32 degrees
    // Main tube
    ctx.fillStyle = '#e5b73b';
    ctx.fillRect(-18, -4, 34, 8);
    ctx.fillStyle = '#fff0a0';
    ctx.fillRect(-18, -4, 34, 2); // highlight
    // Dew shield at objective lens
    ctx.fillStyle = '#b89020';
    ctx.fillRect(16, -6, 6, 12);
    ctx.fillStyle = '#40a0d0'; // glass lens reflection
    ctx.fillRect(21, -5, 1, 10);
    // Eyepiece drawtube
    ctx.fillStyle = '#222222';
    ctx.fillRect(-24, -2, 6, 4);
    ctx.restore();

    canvas.refresh();
  }

  private static drawDeckSensorsProp(scene: Phaser.Scene) {
    const key = 'prop_deck_sensors';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Iron stanchion pole
    ctx.fillStyle = '#3a4454';
    ctx.fillRect(15, 6, 3, 32);

    // Barometer glass gauge housing
    ctx.fillStyle = '#222a36';
    ctx.fillRect(10, 18, 13, 14);
    ctx.fillStyle = '#eef4f8';
    ctx.beginPath();
    ctx.arc(16, 25, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c02626'; // gauge needle
    ctx.beginPath();
    ctx.moveTo(16, 25); ctx.lineTo(18, 23);
    ctx.stroke();

    // Rotating anemometer wind cups at top
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, 6); ctx.lineTo(24, 6);
    ctx.stroke();
    // Copper cups
    ctx.fillStyle = '#b85824';
    ctx.beginPath(); ctx.arc(8, 6, 3, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(24, 6, 3, Math.PI, Math.PI * 2); ctx.fill();

    canvas.refresh();
  }

  private static drawGenericProp(scene: Phaser.Scene) {
    const key = 'prop_generic';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Victorian carved wooden cabinet / chest
    ctx.fillStyle = '#3a2012';
    ctx.fillRect(2, 4, 28, 26);
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(4, 6, 24, 22);

    ctx.fillStyle = '#5c3822';
    ctx.fillRect(0, 2, 32, 4);

    ctx.fillStyle = '#d4af37';
    ctx.fillRect(14, 16, 4, 3); // brass keyhole

    canvas.refresh();
  }
}
