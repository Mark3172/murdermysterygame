export class AudioManager {
    private static instance: AudioManager;
    
    public audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private ambienceGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;

    private activeMusicNodes: AudioNode[] = [];
    private activeAmbienceNodes: AudioNode[] = [];
    private musicTimer: number | null = null;

    private constructor() {
        // Singleton
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public init() {
        (window as any).AudioManager = AudioManager;
        // Hook up to HTML settings sliders
        const setupSlider = (id: string, channel: 'master' | 'music' | 'ambience' | 'sfx') => {
            const slider = document.getElementById(id) as HTMLInputElement;
            if (slider) {
                const saved = localStorage.getItem(`vol_${channel}`);
                if (saved !== null) {
                    const parsed = parseFloat(saved);
                    slider.value = String(Math.round(parsed * 100));
                }
                slider.addEventListener('input', (e) => {
                    const target = e.target as HTMLInputElement;
                    this.setVolume(channel, parseFloat(target.value));
                });
            }
        };

        setupSlider('vol-master', 'master');
        setupSlider('vol-music', 'music');
        setupSlider('vol-ambience', 'ambience');
        setupSlider('vol-sfx', 'sfx');

        // Allow user interaction on document/window to unlock audioContext
        const onUserInteraction = () => {
            this.resumeContext().then(() => {
                if (this.audioContext && this.audioContext.state === 'running') {
                    window.removeEventListener('pointerdown', onUserInteraction);
                    window.removeEventListener('click', onUserInteraction);
                    window.removeEventListener('keydown', onUserInteraction);
                    window.removeEventListener('touchstart', onUserInteraction);
                    document.removeEventListener('pointerdown', onUserInteraction);
                    document.removeEventListener('click', onUserInteraction);
                    document.removeEventListener('keydown', onUserInteraction);
                    document.removeEventListener('touchstart', onUserInteraction);
                }
            }).catch(() => {});
        };

        window.addEventListener('pointerdown', onUserInteraction, { passive: true });
        window.addEventListener('click', onUserInteraction, { passive: true });
        window.addEventListener('keydown', onUserInteraction, { passive: true });
        window.addEventListener('touchstart', onUserInteraction, { passive: true });
        document.addEventListener('pointerdown', onUserInteraction, { passive: true });
        document.addEventListener('click', onUserInteraction, { passive: true });
        document.addEventListener('keydown', onUserInteraction, { passive: true });
        document.addEventListener('touchstart', onUserInteraction, { passive: true });
    }

    public async resumeContext(): Promise<void> {
        this.ensureContext();
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                // Browser might prevent resume before gesture
            }
        }
    }

    private ensureContext() {
        if (!this.audioContext) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            this.audioContext = new AudioCtx();
            
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.ambienceGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();

            this.musicGain.connect(this.masterGain);
            this.ambienceGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            const savedMaster = localStorage.getItem('vol_master');
            const savedMusic = localStorage.getItem('vol_music');
            const savedAmbience = localStorage.getItem('vol_ambience');
            const savedSfx = localStorage.getItem('vol_sfx');

            this.masterGain.gain.value = savedMaster !== null ? parseFloat(savedMaster) : 0.8;
            this.musicGain.gain.value = savedMusic !== null ? parseFloat(savedMusic) : 0.6;
            this.ambienceGain.gain.value = savedAmbience !== null ? parseFloat(savedAmbience) : 0.5;
            this.sfxGain.gain.value = savedSfx !== null ? parseFloat(savedSfx) : 0.8;
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }
    }

    public playNote(freq: number, duration: number, type: OscillatorType = 'sine', channel: 'music' | 'ambience' | 'sfx' = 'sfx') {
        this.ensureContext();
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = type;
        const now = this.audioContext.currentTime;
        osc.frequency.setValueAtTime(freq, now);
        
        const attack = Math.min(0.015, Math.max(0.005, duration * 0.2));
        const decayEnd = Math.max(now + duration, now + attack + 0.01);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, decayEnd);

        osc.connect(gain);
        
        const destGain = channel === 'music' ? this.musicGain : (channel === 'ambience' ? this.ambienceGain : this.sfxGain);
        if (destGain) gain.connect(destGain);

        osc.start(now);
        osc.stop(decayEnd + 0.05);
    }

    public setVolume(channel: 'master' | 'music' | 'ambience' | 'sfx', value: number) {
        this.ensureContext();
        if (!this.audioContext) return;
        const normalized = Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
        const destGain = channel === 'master' ? this.masterGain : (channel === 'music' ? this.musicGain : (channel === 'ambience' ? this.ambienceGain : this.sfxGain));
        if (destGain) destGain.gain.setValueAtTime(normalized, this.audioContext.currentTime);
        try {
            localStorage.setItem(`vol_${channel}`, String(normalized));
        } catch(e) {}
    }

    public toggleMute(channel: 'master' | 'music' | 'ambience' | 'sfx') {
        if (!this.audioContext) return;
        const destGain = channel === 'master' ? this.masterGain : (channel === 'music' ? this.musicGain : (channel === 'ambience' ? this.ambienceGain : this.sfxGain));
        if (destGain) {
            const currentVolume = destGain.gain.value;
            destGain.gain.setValueAtTime(currentVolume > 0 ? 0 : 0.5, this.audioContext.currentTime);
        }
    }

    public playSFX(name: string) {
        this.ensureContext();
        this.resumeContext().catch(() => {});

        // Sound Captions accessibility feature
        try {
            if (typeof window !== 'undefined' && localStorage.getItem('setting_sound_captions') === 'true') {
                const captions: Record<string, string> = {
                    thunder: '⚡ [Thunder rumbles]',
                    clockTick: '⏱ [Clock ticks]',
                    clock_tick: '⏱ [Clock ticks]',
                    doorOpen: '🚪 [Door opens]',
                    door_open: '🚪 [Door opens]',
                    discoveryString: '✨ [Discovery chime]',
                    discovery_string: '✨ [Discovery chime]',
                    glass_shatter: '💥 [Glass shatters]',
                    type_blip: '⌨ [Typewriter click]',
                    ui_click: '🔘 [Click]',
                    uiClick: '🔘 [Click]',
                    click: '🔘 [Click]',
                    button_click: '🔘 [Click]',
                    digital_beep: '📡 [Gadget signal]',
                    gadget_beep: '📡 [Gadget signal]',
                    tensionDrone: '🎶 [Low tension drone]',
                    tension_drone: '🎶 [Low tension drone]',
                    success: '🎺 [Victorian success fanfare]',
                    success_jingle: '🎺 [Victorian success fanfare]',
                    error: '⚠ [Evidence mismatch buzz]',
                    error_buzz: '⚠ [Evidence mismatch buzz]'
                };
                if (captions[name]) {
                    window.dispatchEvent(new CustomEvent('show-msg', { detail: { text: captions[name] } }));
                }
            }
        } catch(e) {}

        switch(name) {
            case 'footstep':
            case 'footsteps':
                this.footstep();
                break;
            case 'doorOpen':
            case 'door_open':
                this.doorOpen();
                break;
            case 'thunder':
                this.thunder();
                break;
            case 'bellChime':
            case 'bell_chime':
                this.bellChime(440);
                break;
            case 'clockTick':
            case 'clock_tick':
                this.clockTick();
                break;
            case 'paperRustle':
            case 'paper_rustle':
            case 'item_pickup':
                this.paperRustle();
                break;
            case 'uiClick':
            case 'ui_click':
            case 'click':
            case 'button_click':
                this.uiClick();
                break;
            case 'discoveryString':
            case 'discovery_string':
                this.discoveryString();
                break;
            case 'tensionDrone':
            case 'tension_drone':
                this.tensionDrone();
                break;
            case 'success':
            case 'success_jingle':
                this.successJingle();
                break;
            case 'error':
            case 'error_buzz':
                this.errorBuzz();
                break;
            case 'type_blip':
                this.typeBlip();
                break;
            case 'gadget_beep':
            case 'digital_beep':
                this.gadgetBeep();
                break;
            default:
                this.uiClick();
                break;
        }
    }

    // specific SFX
    private footstep() {
        if (!this.audioContext || !this.sfxGain) return;
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const env = this.audioContext.createGain();
        env.gain.setValueAtTime(1, this.audioContext.currentTime);
        env.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        noise.connect(filter);
        filter.connect(env);
        env.connect(this.sfxGain);
        noise.start();
    }

    private doorOpen() {
        if (!this.audioContext || !this.sfxGain) return;
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 1);
        const env = this.audioContext.createGain();
        env.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        env.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.connect(filter).connect(env).connect(this.sfxGain);
        osc.start();
        osc.stop(this.audioContext.currentTime + 1);
    }

    private thunder() {
        if (!this.audioContext || !this.sfxGain) return;
        const bufferSize = this.audioContext.sampleRate * 3.0;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.5));
        }
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        noise.connect(filter).connect(this.sfxGain);
        noise.start();
    }

    public bellChime(pitch: number = 440) {
        if (!this.audioContext || !this.sfxGain) return;
        const osc = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc2.type = 'sine';
        osc.frequency.value = pitch;
        osc2.frequency.value = pitch * 1.5;
        const env = this.audioContext.createGain();
        env.gain.setValueAtTime(1, this.audioContext.currentTime);
        env.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 3);
        osc.connect(env).connect(this.sfxGain);
        osc2.connect(env);
        osc.start();
        osc2.start();
        osc.stop(this.audioContext.currentTime + 3);
        osc2.stop(this.audioContext.currentTime + 3);
    }

    private clockTick() {
        this.playNote(1200, 0.05, 'square', 'sfx');
    }

    private paperRustle() {
        this.footstep(); // roughly similar filtered noise
    }

    private uiClick() {
        this.playNote(800, 0.05, 'sine', 'sfx');
    }

    private discoveryString() {
        const ctx = this.audioContext;
        if (!ctx || !this.sfxGain) return;
        const freqs = [440, 554, 659, 880];
        let t = ctx.currentTime;
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = f;
            env.gain.setValueAtTime(0, t + i * 0.1);
            env.gain.linearRampToValueAtTime(0.3, t + i * 0.1 + 0.05);
            env.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.5);
            osc.connect(env).connect(this.sfxGain!);
            osc.start(t + i * 0.1);
            osc.stop(t + i * 0.1 + 0.5);
        });
    }

    private tensionDrone() {
        if (!this.audioContext || !this.sfxGain) return;
        const osc = this.audioContext.createOscillator();
        const env = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 55;
        env.gain.setValueAtTime(0, this.audioContext.currentTime);
        env.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 2);
        env.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 5);
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        osc.connect(filter).connect(env).connect(this.sfxGain);
        osc.start();
        osc.stop(this.audioContext.currentTime + 5);
    }

    private successJingle() {
        const ctx = this.audioContext;
        if (!ctx || !this.sfxGain) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const t = ctx.currentTime;
        notes.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = f;
            env.gain.setValueAtTime(0, t + i * 0.09);
            env.gain.linearRampToValueAtTime(0.25, t + i * 0.09 + 0.02);
            env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.4);
            osc.connect(env).connect(this.sfxGain!);
            osc.start(t + i * 0.09);
            osc.stop(t + i * 0.09 + 0.4);
        });
    }

    private errorBuzz() {
        const ctx = this.audioContext;
        if (!ctx || !this.sfxGain) return;
        const t = ctx.currentTime;
        [180, 170].forEach(f => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.35);
            env.gain.setValueAtTime(0.2, t);
            env.gain.linearRampToValueAtTime(0, t + 0.35);
            osc.connect(env).connect(this.sfxGain!);
            osc.start(t);
            osc.stop(t + 0.35);
        });
    }

    private typeBlip() {
        const ctx = this.audioContext;
        if (!ctx || !this.sfxGain) return;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 600 + Math.random() * 200;
        const t = ctx.currentTime;
        env.gain.setValueAtTime(0.04, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(env).connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.04);
    }

    private gadgetBeep() {
        const ctx = this.audioContext;
        if (!ctx || !this.sfxGain) return;
        const t = ctx.currentTime;
        [880, 1320].forEach((f, i) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            env.gain.setValueAtTime(0, t + i * 0.08);
            env.gain.linearRampToValueAtTime(0.15, t + i * 0.08 + 0.01);
            env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
            osc.connect(env).connect(this.sfxGain!);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.15);
        });
    }

    // Music control
    public startMusic(trackName: string) {
        this.stopMusic(400);
        this.ensureContext();
        this.resumeContext().catch(() => {});
        if (this.musicTimer) clearInterval(this.musicTimer);

        switch(trackName) {
            case 'menu':
            case 'main_theme':
                this.menuMusic();
                break;
            case 'exploration':
            case 'mysterious_theme':
            case 'ambient_rain':
                this.explorationMusic();
                break;
            case 'suspense':
            case 'tense_theme':
            case 'suspense_theme':
            case 'climax_theme':
                this.suspenseMusic();
                break;
            case 'deduction':
            case 'revelation_theme':
            case 'reconstruction_theme':
                this.deductionMusic();
                break;
            case 'resolution':
            case 'melancholy_theme':
            case 'ending_theme':
                this.resolutionMusic();
                break;
            default:
                this.explorationMusic();
                break;
        }
    }

    public stopMusic(fadeMs: number = 500) {
        if (!this.audioContext || !this.musicGain) return;
        if (this.musicTimer) clearInterval(this.musicTimer);
        
        const currTime = this.audioContext.currentTime;
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, currTime);
        this.musicGain.gain.linearRampToValueAtTime(0.001, currTime + fadeMs / 1000);
        
        setTimeout(() => {
            this.activeMusicNodes.forEach(node => {
                if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                    try { node.stop(); } catch(e){}
                }
                node.disconnect();
            });
            this.activeMusicNodes = [];
            if (this.musicGain) this.musicGain.gain.value = 0.5; // restore default
        }, fadeMs);
    }

    public startAmbience(ambienceName: string) {
        this.stopAmbience();
        this.ensureContext();
        
        if (!this.audioContext || !this.ambienceGain) return;

        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 40;
        const env = this.audioContext.createGain();
        env.gain.value = 0.2;
        osc.connect(env).connect(this.ambienceGain);
        osc.start();
        
        this.activeAmbienceNodes.push(osc, env);
    }

    public stopAmbience() {
        this.activeAmbienceNodes.forEach(node => {
            if (node instanceof OscillatorNode) {
                try { node.stop(); } catch(e){}
            }
            node.disconnect();
        });
        this.activeAmbienceNodes = [];
    }

    // Procedural Music tracks
    private menuMusic() {
        if (!this.audioContext || !this.musicGain) return;
        // Simple tick and piano tones
        let step = 0;
        const scale = [261.63, 329.63, 392.00, 523.25];
        this.musicTimer = window.setInterval(() => {
            if (step % 2 === 0) {
                this.playNote(1200, 0.05, 'square', 'music');
            }
            if (step % 4 === 0) {
                const f = scale[Math.floor(Math.random() * scale.length)];
                this.playNote(f, 1.5, 'sine', 'music');
            }
            step++;
        }, 500);
    }

    private explorationMusic() {
        if (!this.audioContext || !this.musicGain) return;
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 110;
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 0.1;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 10;
        lfo.connect(lfoGain).connect(osc.frequency);
        osc.connect(this.musicGain);
        osc.start();
        lfo.start();
        this.activeMusicNodes.push(osc, lfo, lfoGain);
    }

    private suspenseMusic() {
        if (!this.audioContext || !this.musicGain) return;
        let step = 0;
        this.musicTimer = window.setInterval(() => {
            const f = step % 2 === 0 ? 65.41 : 69.30;
            this.playNote(f, 0.5, 'sawtooth', 'music');
            step++;
        }, 600);
    }

    private deductionMusic() {
        if (!this.audioContext || !this.musicGain) return;
        let step = 0;
        this.musicTimer = window.setInterval(() => {
            if (step % 2 === 0) this.playNote(220, 0.1, 'square', 'music');
            if (step % 4 === 0) this.playNote(330, 0.2, 'sine', 'music');
            step++;
        }, 250);
    }

    private resolutionMusic() {
        if (!this.audioContext || !this.musicGain) return;
        const chords = [
            [261.63, 329.63, 392.00], // C
            [349.23, 440.00, 523.25], // F
        ];
        let step = 0;
        this.musicTimer = window.setInterval(() => {
            const chord = chords[step % 2];
            chord.forEach(f => {
                this.playNote(f, 2.0, 'sine', 'music');
            });
            step++;
        }, 2000);
    }
}
