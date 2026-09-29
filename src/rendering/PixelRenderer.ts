import Phaser from 'phaser';

export class PixelRenderer {
    static generateRoomBackground(scene: Phaser.Scene, roomId: string, width: number, height: number): Phaser.GameObjects.Graphics {
        const bg = scene.add.graphics();
        bg.fillStyle(0x0a1628); // Deep navy background
        bg.fillRect(0, 0, width, height);

        switch (roomId) {
            case 'main_hall':
                bg.fillStyle(0x4a4a5a); // Stone grey
                for (let i = 0; i < width; i += 32) {
                    for (let j = 0; j < height; j += 32) {
                        if ((i / 32 + j / 32) % 2 === 0) bg.fillRect(i, j, 32, 32);
                    }
                }
                bg.fillStyle(0x3a2a1a); // Wooden walls
                bg.fillRect(0, 0, width, 40);
                bg.fillStyle(0x8a2a2a); // Doors
                bg.fillRect(width / 2 - 32, 0, 64, 40);
                break;
            case 'exhibition_chamber':
                bg.fillStyle(0x1a1a2a); // Dark marble
                bg.fillRect(0, 0, width, height);
                bg.lineStyle(2, 0x4a4a5a);
                for (let i = 0; i < width; i += 64) {
                    bg.moveTo(i, 0); bg.lineTo(i, height);
                }
                for (let j = 0; j < height; j += 64) {
                    bg.moveTo(0, j); bg.lineTo(width, j);
                }
                bg.strokePath();
                break;
            case 'clockwork_gallery':
                bg.fillStyle(0x2a5a5a); // Muted teal metal
                bg.fillRect(0, 0, width, height);
                bg.lineStyle(1, 0x000000);
                for (let i = 0; i < width; i += 16) {
                    bg.moveTo(i, 0); bg.lineTo(i, height);
                }
                bg.strokePath();
                break;
            case 'library_archive':
                bg.fillStyle(0x3a2a1a); // Wooden floor
                for (let i = 0; i < width; i += 16) {
                    if (i % 32 === 0) bg.fillRect(i, 0, 16, height);
                }
                break;
            case 'pendulum_room':
                bg.fillStyle(0x4a4a5a); // Stone
                bg.fillRect(0, 0, width, height);
                bg.fillStyle(0x000000); // Pit
                bg.fillCircle(width / 2, height / 2, 80);
                break;
            case 'observation_deck':
                bg.fillStyle(0x0a1628);
                bg.fillRect(0, 0, width, height);
                bg.lineStyle(2, 0x4a4a5a); // Grating
                for (let i = 0; i < width; i += 8) {
                    bg.moveTo(i, 0); bg.lineTo(i, height);
                }
                for (let j = 0; j < height; j += 8) {
                    bg.moveTo(0, j); bg.lineTo(width, j);
                }
                bg.strokePath();
                break;
        }
        return bg;
    }

    static generateCharacterSprite(scene: Phaser.Scene, charId: string): string {
        const key = `char_${charId}`;
        if (scene.textures.exists(key)) return key;

        // 4 directions (down, up, left, right), 4 frames each
        const canvas = scene.textures.createCanvas(key, 16 * 4, 24 * 4);
        if (!canvas) return key;

        const ctx = canvas.getContext();

        let primaryColor = '#2a5a5a'; // Default
        let hairColor = '#000000';
        switch (charId) {
            case 'ren': primaryColor = '#2a5a5a'; hairColor = '#111111'; break;
            case 'vale': primaryColor = '#ffffff'; hairColor = '#cccccc'; break;
            case 'nadia': primaryColor = '#4a4a5a'; hairColor = '#8a2a2a'; break;
            case 'hugo': primaryColor = '#0a1628'; hairColor = '#000000'; break;
            case 'petra': primaryColor = '#8a2a2a'; hairColor = '#1a1a1a'; break;
            case 'felix': primaryColor = '#c4a44a'; hairColor = '#4a2a00'; break;
            case 'iris': primaryColor = '#4a2a5a'; hairColor = '#eeeeee'; break;
            case 'aldric': primaryColor = '#4a4a5a'; hairColor = '#ffffff'; break;
        }

        for (let dir = 0; dir < 4; dir++) {
            for (let frame = 0; frame < 4; frame++) {
                const ox = frame * 16;
                const oy = dir * 24;

                // Body
                ctx.fillStyle = primaryColor;
                ctx.fillRect(ox + 4, oy + 8, 8, 12);
                
                // Head
                ctx.fillStyle = '#e8c8a8';
                ctx.fillRect(ox + 4, oy + 2, 8, 6);

                // Hair
                ctx.fillStyle = hairColor;
                ctx.fillRect(ox + 3, oy + 0, 10, 4);

                // Legs (animate)
                ctx.fillStyle = '#111111';
                if (frame === 1 || frame === 3) {
                    ctx.fillRect(ox + 4, oy + 20, 3, 4);
                } else {
                    ctx.fillRect(ox + 4, oy + 20, 3, 4);
                    ctx.fillRect(ox + 9, oy + 20, 3, 4);
                }
            }
        }
        canvas.refresh();
        return key;
    }

    static generateInteractionMarker(scene: Phaser.Scene): string {
        const key = 'interaction_marker';
        if (scene.textures.exists(key)) return key;

        const canvas = scene.textures.createCanvas(key, 16, 16);
        if (!canvas) return key;

        const ctx = canvas.getContext();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.lineTo(14, 8);
        ctx.lineTo(8, 14);
        ctx.lineTo(2, 8);
        ctx.fill();
        canvas.refresh();
        
        return key;
    }
}
