import Phaser from 'phaser';

export interface InputState {
    direction: { x: number; y: number };
    action: boolean;
    notebook: boolean;
    pause: boolean;
    gadgetSwitch: boolean;
}

export class InputController {
    private scene: Phaser.Scene;
    private keys: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
        w: Phaser.Input.Keyboard.Key;
        a: Phaser.Input.Keyboard.Key;
        s: Phaser.Input.Keyboard.Key;
        d: Phaser.Input.Keyboard.Key;
        space: Phaser.Input.Keyboard.Key;
        enter: Phaser.Input.Keyboard.Key;
        e: Phaser.Input.Keyboard.Key;
        tab: Phaser.Input.Keyboard.Key;
        esc: Phaser.Input.Keyboard.Key;
        q: Phaser.Input.Keyboard.Key; // Gadget switch
    };
    
    private touchDirection = { x: 0, y: 0 };
    private touchActionPressed = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        const keyboard = this.scene.input.keyboard;
        
        if (!keyboard) {
            throw new Error("Keyboard not available in scene input");
        }
        
        this.keys = {
            up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            enter: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
            e: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            tab: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB),
            esc: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
            q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
        };

        this.setupTouchControls();
    }

    private setupTouchControls() {
        const isMobile = 'ontouchstart' in window;
        const touchControls = document.getElementById('touch-controls');
        
        if (touchControls) {
            if (isMobile) {
                touchControls.style.display = 'block';
                this.bindTouchEvents();
            } else {
                touchControls.style.display = 'none';
            }
        }
    }

    private bindTouchEvents() {
        const dpadButtons = document.querySelectorAll('#touch-controls [data-dir]');
        
        dpadButtons.forEach(btn => {
            const dir = btn.getAttribute('data-dir');
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.setTouchDirection(dir, true);
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.setTouchDirection(dir, false);
            });
        });

        const actionBtn = document.getElementById('touch-action');
        if (actionBtn) {
            actionBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchActionPressed = true;
            });
            
            actionBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchActionPressed = false;
            });
        }
    }

    private setTouchDirection(dir: string | null, isPressed: boolean) {
        if (!dir) return;
        
        // Reset
        this.touchDirection = { x: 0, y: 0 };
        
        if (isPressed) {
            switch(dir) {
                case 'up': this.touchDirection.y = -1; break;
                case 'down': this.touchDirection.y = 1; break;
                case 'left': this.touchDirection.x = -1; break;
                case 'right': this.touchDirection.x = 1; break;
            }
        }
    }

    public update(): InputState {
        let dx = 0;
        let dy = 0;

        if (this.keys.up.isDown || this.keys.w.isDown) dy -= 1;
        if (this.keys.down.isDown || this.keys.s.isDown) dy += 1;
        if (this.keys.left.isDown || this.keys.a.isDown) dx -= 1;
        if (this.keys.right.isDown || this.keys.d.isDown) dx += 1;

        if (this.touchDirection.x !== 0 || this.touchDirection.y !== 0) {
            dx = this.touchDirection.x;
            dy = this.touchDirection.y;
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        const action = Phaser.Input.Keyboard.JustDown(this.keys.space) || 
                       Phaser.Input.Keyboard.JustDown(this.keys.enter) || 
                       Phaser.Input.Keyboard.JustDown(this.keys.e) || 
                       this.touchActionPressed;

        const notebook = Phaser.Input.Keyboard.JustDown(this.keys.tab);
        const pause = Phaser.Input.Keyboard.JustDown(this.keys.esc);
        const gadgetSwitch = Phaser.Input.Keyboard.JustDown(this.keys.q);

        // Reset touch action so it functions like a JustDown event if desired,
        // but typically touch state resets on touchend. We'll leave it simple.
        if (this.touchActionPressed) {
            this.touchActionPressed = false; // consume action
        }

        return {
            direction: { x: dx, y: dy },
            action,
            notebook,
            pause,
            gadgetSwitch
        };
    }
}
