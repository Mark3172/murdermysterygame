import Phaser from 'phaser';

export class SceneTransition {
    public static fadeToBlack(scene: Phaser.Scene, duration: number, callback: () => void) {
        scene.cameras.main.fadeOut(duration, 0, 0, 0);
        scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            callback();
        });
    }

    public static slideTransition(scene: Phaser.Scene, direction: 'up' | 'down' | 'left' | 'right', callback: () => void) {
        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        
        let dx = 0;
        let dy = 0;
        
        switch (direction) {
            case 'up': dy = -height; break;
            case 'down': dy = height; break;
            case 'left': dx = -width; break;
            case 'right': dx = width; break;
        }

        scene.cameras.main.pan(scene.cameras.main.scrollX + dx + width/2, scene.cameras.main.scrollY + dy + height/2, 500, 'Power2');
        scene.time.delayedCall(500, () => {
            callback();
        });
    }
}
