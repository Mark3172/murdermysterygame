import Phaser from 'phaser';

export class PortraitRenderer {
    static generatePortrait(scene: Phaser.Scene, characterId: string, expression: string): string {
        const key = `portrait_${characterId}_${expression}`;
        if (scene.textures.exists(key)) return key;

        const canvas = scene.textures.createCanvas(key, 64, 64);
        if (!canvas) return key;

        const ctx = canvas.getContext();

        let skinColor = '#e8c8a8';
        let clothColor = '#2a5a5a';
        let hairColor = '#000000';
        let eyeColor = '#4a2a00';

        switch (characterId) {
            case 'ren': clothColor = '#2a5a5a'; hairColor = '#111111'; eyeColor = '#4a2a00'; break;
            case 'vale': clothColor = '#ffffff'; hairColor = '#cccccc'; eyeColor = '#8a2a2a'; break; // red scarf
            case 'nadia': clothColor = '#4a4a5a'; hairColor = '#8a2a2a'; eyeColor = '#2a5a2a'; break;
            case 'hugo': clothColor = '#0a1628'; hairColor = '#000000'; eyeColor = '#111111'; break;
            case 'petra': clothColor = '#8a2a2a'; hairColor = '#1a1a1a'; eyeColor = '#4a2a00'; break;
            case 'felix': clothColor = '#c4a44a'; hairColor = '#4a2a00'; eyeColor = '#2a2a2a'; break;
            case 'iris': clothColor = '#4a2a5a'; hairColor = '#eeeeee'; eyeColor = '#4a4a5a'; break;
            case 'aldric': clothColor = '#4a4a5a'; hairColor = '#ffffff'; eyeColor = '#000000'; break;
        }

        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 64, 64);

        // Body
        ctx.fillStyle = clothColor;
        ctx.fillRect(16, 40, 32, 24);

        if (characterId === 'vale') {
            ctx.fillStyle = '#8a2a2a'; // Scarf
            ctx.fillRect(20, 38, 24, 8);
        }

        // Head
        ctx.fillStyle = skinColor;
        ctx.fillRect(20, 16, 24, 24);

        // Hair
        ctx.fillStyle = hairColor;
        ctx.fillRect(18, 12, 28, 8);
        if (characterId === 'ren') {
            ctx.fillRect(16, 16, 6, 10);
            ctx.fillRect(42, 16, 6, 10);
        }

        // Eyes based on expression
        ctx.fillStyle = eyeColor;
        
        let eyeH = 4;
        let eyeW = 4;
        let eyeY = 24;

        if (expression === 'surprised') {
            eyeH = 6; eyeY = 22;
        } else if (expression === 'sad') {
            eyeH = 2; eyeY = 26;
        } else if (expression === 'angry') {
            eyeH = 3;
            // Eyebrows
            ctx.fillStyle = hairColor;
            ctx.fillRect(22, 20, 6, 2);
            ctx.fillRect(36, 20, 6, 2);
            ctx.fillStyle = eyeColor;
        }

        ctx.fillRect(24, eyeY, eyeW, eyeH);
        ctx.fillRect(36, eyeY, eyeW, eyeH);

        // Mouth based on expression
        ctx.fillStyle = '#8a2a2a';
        if (expression === 'smiling') {
            ctx.fillRect(28, 32, 8, 2);
            ctx.fillRect(26, 30, 2, 2);
            ctx.fillRect(36, 30, 2, 2);
        } else if (expression === 'sad' || expression === 'angry') {
            ctx.fillRect(28, 32, 8, 2);
            ctx.fillRect(26, 34, 2, 2);
            ctx.fillRect(36, 34, 2, 2);
        } else if (expression === 'surprised') {
            ctx.fillRect(30, 32, 4, 4);
        } else {
            ctx.fillRect(28, 32, 8, 2);
        }

        canvas.refresh();
        return key;
    }
}
