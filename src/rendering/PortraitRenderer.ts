import Phaser from 'phaser';

export class PortraitRenderer {
  static generatePortrait(scene: Phaser.Scene, characterId: string, expression: string): string {
    const key = `portrait_${characterId}_${expression}`;
    if (scene.textures.exists(key)) return key;

    const canvas = scene.textures.createCanvas(key, 64, 64);
    if (!canvas) return key;

    const ctx = canvas.getContext();
    if (!ctx) return key;

    // Background gradient: dark moody noir with subtle spotlight
    const grad = ctx.createRadialGradient(32, 28, 6, 32, 32, 38);
    grad.addColorStop(0, '#1c2438');
    grad.addColorStop(1, '#080a12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    // Character specific palettes and details
    let skin = '#fae0cc';
    let skinShadow = '#dfbeaa';
    let hair = '#141824';
    let hairHighlight = '#283854';
    let outfit = '#1a2d54';
    let outfitShadow = '#101d36';
    let collar = '#ffffff';
    let tie = '#d32f2f';
    let eyeColor = '#2b425b';
    let accessory = 'none';

    switch (characterId) {
      case 'ren':
        skin = '#fae0cc'; skinShadow = '#dfa68c';
        hair = '#1b202c'; hairHighlight = '#323c52';
        outfit = '#182438'; outfitShadow = '#0e1624';
        collar = '#121620'; tie = '#b82032'; // crimson silk ascot
        eyeColor = '#d48a24'; accessory = 'bandolier_streak';
        break;
      case 'nadia':
        skin = '#fae2d0'; skinShadow = '#dfc2b0';
        hair = '#1b2232'; hairHighlight = '#2c3952';
        outfit = '#f4f6fa'; outfitShadow = '#ccd3df';
        collar = '#8e44ad'; tie = '#6c2d82';
        eyeColor = '#27ae60'; accessory = 'glasses_hairpin';
        break;
      case 'hugo':
        skin = '#ebd5c5'; skinShadow = '#7d6878';
        hair = '#2c1e18'; hairHighlight = '#442e24';
        outfit = '#28303e'; outfitShadow = '#1a202a';
        collar = '#dcd8d0'; tie = '#7a2436';
        eyeColor = '#34495e'; accessory = 'stethoscope';
        break;
      case 'petra':
        skin = '#e8b88a'; skinShadow = '#cf986c';
        hair = '#b84824'; hairHighlight = '#ea6e3c';
        outfit = '#4d5e38'; outfitShadow = '#364228';
        collar = '#d48a30'; tie = '#00000000';
        eyeColor = '#d35400'; accessory = 'camera_strap';
        break;
      case 'felix':
        skin = '#e8b090'; skinShadow = '#ca9274';
        hair = '#9ca4b0'; hairHighlight = '#c2cbd6';
        outfit = '#1e2026'; outfitShadow = '#121418';
        collar = '#f5f7fa'; tie = '#e6b820';
        eyeColor = '#2c3e50'; accessory = 'mustache_chain';
        break;
      case 'iris':
        skin = '#ecd0c2'; skinShadow = '#ccaeb0';
        hair = '#78828e'; hairHighlight = '#b0b8c4';
        outfit = '#1e3868'; outfitShadow = '#122448';
        collar = '#e8ecf4'; tie = '#d0d4e0';
        eyeColor = '#3498db'; accessory = 'chignon_brooch';
        break;
      case 'vale':
      default:
        skin = '#fadcc8'; skinShadow = '#d8bca8';
        hair = '#d0d4dc'; hairHighlight = '#eef2f8';
        outfit = '#edf1f5'; outfitShadow = '#c4ccd8';
        collar = '#204a36'; tie = '#00000000';
        eyeColor = '#2980b9'; accessory = 'glasses_stethoscope';
        break;
    }

    // ─── 1. TORSO & CLOTHING ───────────────────────────────────────
    ctx.fillStyle = outfit;
    ctx.beginPath();
    ctx.moveTo(10, 60);
    ctx.lineTo(16, 44);
    ctx.lineTo(26, 40);
    ctx.lineTo(38, 40);
    ctx.lineTo(48, 44);
    ctx.lineTo(54, 60);
    ctx.closePath();
    ctx.fill();

    // Coat lapels & shading
    ctx.fillStyle = outfitShadow;
    ctx.fillRect(10, 52, 8, 8);
    ctx.fillRect(46, 52, 8, 8);

    // Collar / Inner Shirt
    ctx.fillStyle = collar;
    ctx.beginPath();
    ctx.moveTo(27, 40);
    ctx.lineTo(32, 48);
    ctx.lineTo(37, 40);
    ctx.closePath();
    ctx.fill();

    // Tie / Cravat / Brooch
    if (tie !== '#00000000') {
      ctx.fillStyle = tie;
      ctx.fillRect(30, 44, 4, 16);
      ctx.beginPath();
      ctx.moveTo(32, 44);
      ctx.lineTo(30, 42);
      ctx.lineTo(34, 42);
      ctx.closePath();
      ctx.fill();
    }

    // Accessories
    if (accessory === 'bandolier_streak') {
      // Leather gadget bandolier strap across chest
      ctx.strokeStyle = '#422818';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, 44); ctx.lineTo(46, 60);
      ctx.stroke();
      // Brass buckle
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(30, 50, 4, 3);
    } else if (accessory === 'camera_strap') {
      ctx.strokeStyle = '#2b1d0c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, 44); ctx.lineTo(46, 60);
      ctx.stroke();
    } else if (accessory === 'mustache_chain') {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(28, 54);
      ctx.quadraticCurveTo(32, 58, 40, 52);
      ctx.stroke();
    } else if (accessory === 'stethoscope' || accessory === 'glasses_stethoscope') {
      ctx.strokeStyle = '#708090';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32, 44, 9, 0, Math.PI);
      ctx.stroke();
    }

    // ─── 2. NECK & HEAD ────────────────────────────────────────────
    // Neck shadow
    ctx.fillStyle = skinShadow;
    ctx.fillRect(28, 34, 8, 8);

    // Head oval
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(32, 26, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jawline shadow
    ctx.strokeStyle = skinShadow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(32, 26, 13, 0.4, Math.PI - 0.4);
    ctx.stroke();

    // ─── 3. EYES & EXPRESSION ──────────────────────────────────────
    let eyeH = 4;
    let eyeY = 24;
    let browY = 20;
    let browAngle = 0;

    if (expression === 'surprised') {
      eyeH = 6; eyeY = 22; browY = 18;
    } else if (expression === 'sad' || expression === 'thinking') {
      eyeH = 3; eyeY = 25; browAngle = 0.2;
    } else if (expression === 'angry') {
      eyeH = 3; eyeY = 24; browAngle = -0.3;
    } else if (expression === 'nervous') {
      eyeH = 4; eyeY = 24;
      // Sweat drop
      ctx.fillStyle = '#64b5f6';
      ctx.fillRect(44, 18, 2, 4);
    }

    // White sclera
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, eyeY, 6, eyeH);
    ctx.fillRect(35, eyeY, 6, eyeH);

    // Colored Iris / Pupil
    ctx.fillStyle = eyeColor;
    ctx.fillRect(25, eyeY, 3, eyeH);
    ctx.fillRect(36, eyeY, 3, eyeH);

    // Eye catchlight glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(25, eyeY, 1, 1);
    ctx.fillRect(36, eyeY, 1, 1);

    // Eyebrows
    ctx.strokeStyle = hair;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, browY - browAngle * 5);
    ctx.lineTo(29, browY + browAngle * 5);
    ctx.moveTo(35, browY + browAngle * 5);
    ctx.lineTo(42, browY - browAngle * 5);
    ctx.stroke();

    // Glasses
    if (accessory.includes('glasses')) {
      ctx.strokeStyle = '#a6b8cc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(21, eyeY - 2, 9, 8);
      ctx.strokeRect(34, eyeY - 2, 9, 8);
      ctx.beginPath();
      ctx.moveTo(30, eyeY + 2); ctx.lineTo(34, eyeY + 2);
      ctx.stroke();
      // Glass sheen
      ctx.fillStyle = 'rgba(200, 240, 255, 0.4)';
      ctx.fillRect(22, eyeY - 1, 2, 6);
      ctx.fillRect(35, eyeY - 1, 2, 6);
    }

    // Fatigue circles for Hugo
    if (characterId === 'hugo') {
      ctx.strokeStyle = '#7d6878';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(26, eyeY + eyeH + 1, 3, 0, Math.PI);
      ctx.arc(38, eyeY + eyeH + 1, 3, 0, Math.PI);
      ctx.stroke();
    }

    // Mustache for Felix
    if (accessory === 'mustache_chain') {
      ctx.fillStyle = '#c4ccd8';
      ctx.beginPath();
      ctx.moveTo(26, 34);
      ctx.quadraticCurveTo(32, 31, 38, 34);
      ctx.quadraticCurveTo(32, 36, 26, 34);
      ctx.fill();
    } else {
      // Mouth
      ctx.fillStyle = '#8a2a2a';
      if (expression === 'smiling') {
        ctx.beginPath();
        ctx.arc(32, 32, 4, 0, Math.PI);
        ctx.stroke();
      } else if (expression === 'surprised') {
        ctx.beginPath();
        ctx.arc(32, 34, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (expression === 'sad' || expression === 'angry') {
        ctx.beginPath();
        ctx.arc(32, 36, 4, Math.PI, 0);
        ctx.stroke();
      } else {
        ctx.fillRect(30, 34, 4, 1);
      }
    }

    // ─── 4. HAIR & ACCESSORIES ────────────────────────────────────
    ctx.fillStyle = hair;
    // Hair base volume
    ctx.beginPath();
    ctx.arc(32, 22, 15, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Hair highlights
    ctx.fillStyle = hairHighlight;
    ctx.fillRect(24, 10, 16, 3);

    if (accessory === 'bandolier_streak') {
      // Ren's sleek detective swept bangs with silver rogue streak
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(26, 8);
      ctx.lineTo(22, 14);
      ctx.lineTo(28, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(22, 12, 6, 7);
      ctx.fillRect(33, 13, 6, 6);

      // Signature Silver-Blue Rogue Streak
      ctx.fillStyle = '#c0d0e2';
      ctx.beginPath();
      ctx.moveTo(26, 8);
      ctx.lineTo(23, 17);
      ctx.lineTo(26, 17);
      ctx.lineTo(28, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8294aa';
      ctx.fillRect(23, 17, 3, 2);
    } else if (accessory === 'cowlick') {
      // Ren's detective fringe and cowlick
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(26, 8);
      ctx.lineTo(24, 2);
      ctx.lineTo(30, 7);
      ctx.closePath();
      ctx.fill();
      // Bangs
      ctx.fillRect(24, 14, 4, 6);
      ctx.fillRect(34, 14, 4, 5);
    } else if (accessory === 'glasses_hairpin') {
      // Nadia's sleek bob and gold hairpin
      ctx.fillStyle = hair;
      ctx.fillRect(18, 18, 4, 16);
      ctx.fillRect(42, 18, 4, 14);
      // Gold hairpin
      ctx.fillStyle = '#e5b73b';
      ctx.fillRect(40, 13, 6, 2);
    } else if (accessory === 'camera_strap') {
      // Petra's high ponytail
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(46, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(22, 15, 6, 6);
    } else if (accessory === 'chignon_brooch') {
      // Iris's silver chignon bun
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(32, 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dce2ee';
      ctx.fillRect(30, 7, 4, 2); // silver comb
    }

    // ─── 5. ORNATE GOLD FRAME BORDER ──────────────────────────────
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 62, 62);
    ctx.strokeStyle = '#6e5418';
    ctx.strokeRect(2, 2, 60, 60);

    // Corner brass studs
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(3, 3, 2, 2);
    ctx.fillRect(59, 3, 2, 2);
    ctx.fillRect(3, 59, 2, 2);
    ctx.fillRect(59, 59, 2, 2);

    canvas.refresh();
    return key;
  }
}
