export class AudioManager {
    private static instance: AudioManager;
    
    public audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private ambienceGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;

    // Space / Ambient reverb-delay bus
    private spaceInput: GainNode | null = null;
    private spaceDelay: DelayNode | null = null;
    private spaceFeedback: GainNode | null = null;
    private spaceFilter: BiquadFilterNode | null = null;

    // Master bus filters for warm analog tone
    private musicWarmthFilter: BiquadFilterNode | null = null;
    private ambienceFilter: BiquadFilterNode | null = null;

    private activeMusicNodes: AudioNode[] = [];
    private activeAmbienceNodes: AudioNode[] = [];
    private currentTrackCleanups: (() => void)[] = [];
    private currentTrack: string | null = null;

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
        if (typeof window !== 'undefined') {
            (window as any).AudioManager = AudioManager;
        }

        // Hook up to HTML settings sliders
        const setupSlider = (id: string, channel: 'master' | 'music' | 'ambience' | 'sfx') => {
            if (typeof document === 'undefined') return;
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
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
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
        if (!this.audioContext && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            this.audioContext = new AudioCtx();
            
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.ambienceGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();

            // Warmth filters to remove all digital harshness
            this.musicWarmthFilter = this.audioContext.createBiquadFilter();
            this.musicWarmthFilter.type = 'lowpass';
            this.musicWarmthFilter.frequency.value = 1800; // Warm analog cutoff
            this.musicWarmthFilter.Q.value = 0.6;

            this.ambienceFilter = this.audioContext.createBiquadFilter();
            this.ambienceFilter.type = 'lowpass';
            this.ambienceFilter.frequency.value = 900;
            this.ambienceFilter.Q.value = 0.5;

            // Space / Ambient Reverb-Delay Bus
            this.spaceInput = this.audioContext.createGain();
            this.spaceInput.gain.value = 0.4;

            this.spaceDelay = this.audioContext.createDelay(1.0);
            this.spaceDelay.delayTime.value = 0.34; // 340ms warm slap

            this.spaceFeedback = this.audioContext.createGain();
            this.spaceFeedback.gain.value = 0.32; // 32% feedback

            this.spaceFilter = this.audioContext.createBiquadFilter();
            this.spaceFilter.type = 'lowpass';
            this.spaceFilter.frequency.value = 750; // Warm decay roll-off

            // Wire Space Bus
            this.spaceInput.connect(this.spaceDelay);
            this.spaceDelay.connect(this.spaceFilter);
            this.spaceFilter.connect(this.spaceFeedback);
            this.spaceFeedback.connect(this.spaceDelay);
            this.spaceFilter.connect(this.masterGain);

            // Connect sub-mixes through warmth filters to master
            this.musicGain.connect(this.musicWarmthFilter);
            this.musicWarmthFilter.connect(this.masterGain);

            this.ambienceGain.connect(this.ambienceFilter);
            this.ambienceFilter.connect(this.masterGain);

            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            // Load saved volume preferences or defaults (music and ambience defaults lowered to be comfortable)
            const savedMaster = localStorage.getItem('vol_master');
            const savedMusic = localStorage.getItem('vol_music');
            const savedAmbience = localStorage.getItem('vol_ambience');
            const savedSfx = localStorage.getItem('vol_sfx');

            this.masterGain.gain.value = savedMaster !== null ? parseFloat(savedMaster) : 0.8;
            this.musicGain.gain.value = savedMusic !== null ? parseFloat(savedMusic) : 0.45;
            this.ambienceGain.gain.value = savedAmbience !== null ? parseFloat(savedAmbience) : 0.35;
            this.sfxGain.gain.value = savedSfx !== null ? parseFloat(savedSfx) : 0.7;
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }
    }

    /**
     * Backward-compatible playNote method with built-in lowpass damping
     * to ensure no raw square or sawtooth waves ever sound harsh.
     */
    public playNote(freq: number, duration: number, type: OscillatorType = 'sine', channel: 'music' | 'ambience' | 'sfx' = 'sfx') {
        this.ensureContext();
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Prevent harsh raw wave buzz: soft lowpass filter
        if (type === 'square' || type === 'sawtooth') {
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, now);
            osc.type = 'triangle'; // Convert raw buzzy waveforms to warm filtered triangle
        } else {
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);
            osc.type = type;
        }

        osc.frequency.setValueAtTime(freq, now);
        
        // Soft attack to avoid clicks, exponential natural decay
        const attack = Math.min(0.04, Math.max(0.015, duration * 0.15));
        const decayEnd = Math.max(now + duration, now + attack + 0.05);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, decayEnd);

        osc.connect(filter);
        filter.connect(gain);
        
        const destGain = channel === 'music' ? this.musicGain : (channel === 'ambience' ? this.ambienceGain : this.sfxGain);
        if (destGain) gain.connect(destGain);

        // Subtle space echo for music and chimes
        if (channel === 'music' && this.spaceInput) {
            gain.connect(this.spaceInput);
        }

        osc.start(now);
        osc.stop(decayEnd + 0.05);
    }

    /**
     * Play a warm acoustic instrument tone (piano/rhodes/celesta style)
     */
    public playWarmTone(freq: number, duration: number, options: {
        attack?: number;
        gain?: number;
        harmonic?: number;
        lowpass?: number;
        channel?: 'music' | 'ambience' | 'sfx';
        sendSpace?: boolean;
    } = {}) {
        this.ensureContext();
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const attack = options.attack ?? 0.04;
        const peakGain = options.gain ?? 0.14;
        const lowpassFreq = options.lowpass ?? 850;
        const sendSpace = options.sendSpace ?? true;
        const channel = options.channel ?? 'music';

        const oscFundamental = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        oscFundamental.type = 'sine';
        oscFundamental.frequency.setValueAtTime(freq, now);

        // Subtle warm overtone for acoustic body
        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(freq * (options.harmonic ?? 2), now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(lowpassFreq, now);
        filter.frequency.exponentialRampToValueAtTime(250, now + duration);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        const harmGain = ctx.createGain();
        harmGain.gain.setValueAtTime(0.15, now);

        oscFundamental.connect(filter);
        oscHarmonic.connect(harmGain);
        harmGain.connect(filter);
        filter.connect(gain);

        const destGain = channel === 'music' ? this.musicGain : (channel === 'ambience' ? this.ambienceGain : this.sfxGain);
        if (destGain) gain.connect(destGain);

        if (sendSpace && this.spaceInput) {
            gain.connect(this.spaceInput);
        }

        oscFundamental.start(now);
        oscHarmonic.start(now);
        oscFundamental.stop(now + duration + 0.05);
        oscHarmonic.stop(now + duration + 0.05);
    }

    public setVolume(channel: 'master' | 'music' | 'ambience' | 'sfx', value: number) {
        this.ensureContext();
        if (!this.audioContext) return;
        const normalized = Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
        const destGain = channel === 'master' ? this.masterGain : (channel === 'music' ? this.musicGain : (channel === 'ambience' ? this.ambienceGain : this.sfxGain));
        if (destGain) {
            destGain.gain.linearRampToValueAtTime(normalized, this.audioContext.currentTime + 0.05);
        }
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

        // Accessibility Sound Captions
        try {
            if (typeof window !== 'undefined' && localStorage.getItem('setting_sound_captions') === 'true') {
                const captions: Record<string, string> = {
                    thunder: '⚡ [Thunder rumbles softly]',
                    clockTick: '⏱ [Clock ticks]',
                    clock_tick: '⏱ [Clock ticks]',
                    doorOpen: '🚪 [Door opens]',
                    door_open: '🚪 [Door opens]',
                    discoveryString: '✨ [Discovery chime]',
                    discovery_string: '✨ [Discovery chime]',
                    glass_shatter: '💥 [Glass shatters]',
                    type_blip: '⌨ [Typewriter tap]',
                    ui_click: '🔘 [Click]',
                    uiClick: '🔘 [Click]',
                    click: '🔘 [Click]',
                    button_click: '🔘 [Click]',
                    digital_beep: '📡 [Gadget resonance]',
                    gadget_beep: '📡 [Gadget resonance]',
                    tensionDrone: '🎶 [Tension swell]',
                    tension_drone: '🎶 [Tension swell]',
                    success: '🎺 [Victorian fanfare]',
                    success_jingle: '🎺 [Victorian fanfare]',
                    error: '⚠ [Evidence mismatch]',
                    error_buzz: '⚠ [Evidence mismatch]'
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

    // ==========================================
    // REFINED SOUND EFFECTS (Pleasant & Tactile)
    // ==========================================

    /**
     * Soft cushioned footstep on Victorian parquet / carpet.
     */
    private footstep() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const bufferSize = Math.floor(this.audioContext.sampleRate * 0.06);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);
        
        const env = this.audioContext.createGain();
        env.gain.setValueAtTime(0.18, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        
        noise.connect(filter);
        filter.connect(env);
        env.connect(this.sfxGain);
        noise.start(now);
    }

    /**
     * Heavy oak door swing with soft brass latch.
     */
    private doorOpen() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        
        // Deep resonance creak
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.65);
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);

        const env = this.audioContext.createGain();
        env.gain.setValueAtTime(0.12, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(filter);
        filter.connect(env);
        env.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.7);

        // Soft brass latch click at start
        this.playWarmTone(340, 0.05, { gain: 0.06, attack: 0.005, channel: 'sfx', sendSpace: false });
    }

    /**
     * Distant, deep rolling storm thunder (deep lowpass rumble, non-jarring).
     */
    private thunder() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const duration = 2.8;
        const bufferSize = Math.floor(this.audioContext.sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Pink-like smoothed noise
        let b0 = 0, b1 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99 * b0 + white * 0.05;
            b1 = 0.95 * b1 + white * 0.1;
            const progress = i / bufferSize;
            // Rolling swell envelope
            const amp = Math.sin(progress * Math.PI) * Math.exp(-progress * 1.5);
            data[i] = (b0 + b1) * amp;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(85, now);
        filter.Q.value = 1.2;

        const env = this.audioContext.createGain();
        env.gain.setValueAtTime(0.3, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(env);
        env.connect(this.sfxGain);
        noise.start(now);
    }

    /**
     * Victorian resonant clock bell chime with natural musical partials.
     */
    public bellChime(pitch: number = 440) {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const duration = 2.5;

        // Brass bell partials (fundamental, minor 3rd partial, octave fifth)
        const partials = [
            { freq: pitch, gain: 0.22 },
            { freq: pitch * 1.5, gain: 0.12 },
            { freq: pitch * 2.76, gain: 0.05 }
        ];

        partials.forEach(p => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            const filter = this.audioContext!.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(p.freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(p.freq * 2.5, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(p.gain, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain!);

            if (this.spaceInput) {
                gain.connect(this.spaceInput);
            }

            osc.start(now);
            osc.stop(now + duration + 0.05);
        });
    }

    /**
     * Authentic antique clock escapement tick.
     * Muted wooden tap, soft, cozy and completely relaxing.
     */
    private clockTick() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.022);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.03);
    }

    /**
     * Gentle parchment paper rustle.
     */
    private paperRustle() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const bufferSize = Math.floor(this.audioContext.sampleRate * 0.09);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(1.5, now);

        const env = this.audioContext.createGain();
        env.gain.setValueAtTime(0.08, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        noise.connect(filter);
        filter.connect(env);
        env.connect(this.sfxGain);
        noise.start(now);
    }

    /**
     * Subtle, tactile mechanical button click.
     */
    private uiClick() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.018);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.025);
    }

    /**
     * Shimmering celesta / orchestral harp discovery chime.
     */
    private discoveryString() {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playWarmTone(freq, 1.2, {
                    attack: 0.015,
                    gain: 0.12,
                    harmonic: 2,
                    lowpass: 1800,
                    channel: 'sfx',
                    sendSpace: true
                });
            }, idx * 70);
        });
    }

    /**
     * Warm cinematic tension swell.
     */
    private tensionDrone() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(65, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 3.3);
    }

    /**
     * Warm Victorian success fanfare with golden brass harmonics.
     */
    private successJingle() {
        const arpeggio = [
            { f: 523.25, d: 0.18 }, // C5
            { f: 659.25, d: 0.18 }, // E5
            { f: 783.99, d: 0.22 }, // G5
            { f: 1046.50, d: 0.70 } // C6
        ];
        let delay = 0;
        arpeggio.forEach(note => {
            setTimeout(() => {
                this.playWarmTone(note.f, note.d, {
                    attack: 0.02,
                    gain: 0.16,
                    harmonic: 2,
                    lowpass: 1500,
                    channel: 'sfx',
                    sendSpace: true
                });
            }, delay);
            delay += 110;
        });
    }

    /**
     * Muted low cello double-stop for evidence mismatch (conveys "incorrect" without piercing buzz).
     */
    private errorBuzz() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        [120, 115].forEach(freq => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            const filter = this.audioContext!.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(220, now);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain!);

            osc.start(now);
            osc.stop(now + 0.4);
        });
    }

    /**
     * Soft antique typewriter key tap.
     */
    private typeBlip() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320 + Math.random() * 80, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.025);
    }

    /**
     * Soft crystal acoustic chime for gadgets.
     */
    private gadgetBeep() {
        [880, 1174.66].forEach((f, i) => {
            setTimeout(() => {
                this.playWarmTone(f, 0.4, {
                    attack: 0.015,
                    gain: 0.09,
                    harmonic: 1.5,
                    lowpass: 1600,
                    channel: 'sfx',
                    sendSpace: true
                });
            }, i * 90);
        });
    }

    // ==========================================
    // MUSIC CONTROL & ATMOSPHERIC GENERATORS
    // ==========================================

    public startMusic(trackName: string) {
        if (this.currentTrack === trackName && this.activeMusicNodes.length > 0) {
            return; // Already playing this track smoothly
        }
        this.currentTrack = trackName;
        this.stopMusic(350);
        this.ensureContext();
        this.resumeContext().catch(() => {});

        setTimeout(() => {
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
        }, 150);
    }

    public stopMusic(fadeMs: number = 400) {
        if (!this.audioContext || !this.musicGain) return;
        
        // Execute and clear all track cleanups (intervals, timeouts, LFOs)
        this.currentTrackCleanups.forEach(clean => {
            try { clean(); } catch(e){}
        });
        this.currentTrackCleanups = [];

        const currTime = this.audioContext.currentTime;
        const currentVol = this.musicGain.gain.value;
        this.musicGain.gain.setValueAtTime(currentVol, currTime);
        this.musicGain.gain.linearRampToValueAtTime(0.0001, currTime + fadeMs / 1000);
        
        setTimeout(() => {
            this.activeMusicNodes.forEach(node => {
                if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                    try { node.stop(); } catch(e){}
                }
                try { node.disconnect(); } catch(e){}
            });
            this.activeMusicNodes = [];
            
            // Restore saved music volume target
            if (this.musicGain && this.audioContext) {
                const saved = localStorage.getItem('vol_music');
                const target = saved !== null ? parseFloat(saved) : 0.45;
                this.musicGain.gain.setValueAtTime(target, this.audioContext.currentTime);
            }
        }, fadeMs + 20);
    }

    public startAmbience(ambienceName: string) {
        this.stopAmbience();
        this.ensureContext();
        if (!this.audioContext || !this.ambienceGain) return;

        // Soothing observatory draft and distant rain
        const now = this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * 2.0;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.03, now);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambienceGain);

        noise.start(now);
        this.activeAmbienceNodes.push(noise, filter, gain);
    }

    public stopAmbience() {
        this.activeAmbienceNodes.forEach(node => {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                try { node.stop(); } catch(e){}
            }
            try { node.disconnect(); } catch(e){}
        });
        this.activeAmbienceNodes = [];
    }

    // ==========================================
    // PROCEDURAL MUSIC TRACKS (Cool to the Ear)
    // ==========================================

    /**
     * EXPLORATION MUSIC: "Nocturne in the Victorian Observatory"
     * Warm, breathing minor-9th ambient pads with delicate celesta starlight chimes
     * and subtle rain texture. Beautiful, relaxing, cool to the ear.
     */
    private explorationMusic() {
        if (!this.audioContext || !this.musicGain) return;
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // 1. Dual detuned ambient pad oscillators for lush, warm chorus
        const oscA = ctx.createOscillator();
        const oscB = ctx.createOscillator();
        const padFilter = ctx.createBiquadFilter();
        const padGain = ctx.createGain();

        // Slow breathing LFO for organic volume swell
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.08, now); // Breath cycle every 12 seconds
        lfoGain.gain.setValueAtTime(0.04, now);
        lfo.connect(lfoGain);
        lfoGain.connect(padGain.gain);

        oscA.type = 'sine';
        oscB.type = 'triangle';
        oscA.frequency.setValueAtTime(146.83, now); // D3
        oscB.frequency.setValueAtTime(147.20, now); // Detuned D3

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(340, now); // Very warm cutoff

        padGain.gain.setValueAtTime(0.12, now);

        oscA.connect(padFilter);
        oscB.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.musicGain);

        oscA.start(now);
        oscB.start(now);
        lfo.start(now);
        this.activeMusicNodes.push(oscA, oscB, lfo, padFilter, padGain, lfoGain);

        // 2. Harmonic chord progression: Dm9 -> Bbmaj7 -> Gm9 -> Asus4
        const chordPitches = [
            146.83, // D3
            116.54, // Bb2
            98.00,  // G2
            110.00   // A2
        ];
        let chordIndex = 0;
        const chordInterval = window.setInterval(() => {
            if (!this.audioContext || !this.musicGain) return;
            chordIndex = (chordIndex + 1) % chordPitches.length;
            const targetFreq = chordPitches[chordIndex];
            const t = this.audioContext.currentTime;
            oscA.frequency.exponentialRampToValueAtTime(targetFreq, t + 2.5);
            oscB.frequency.exponentialRampToValueAtTime(targetFreq * 1.003, t + 2.5);
        }, 8000);

        // 3. Delicate pentatonic starlight chimes (occasional, tranquil and cool)
        const chimeScales = [
            [293.66, 349.23, 440.00, 523.25, 587.33], // D minor pentatonic
            [261.63, 349.23, 440.00, 523.25, 659.25], // F major / Bbmaj7
            [293.66, 392.00, 440.00, 587.33, 698.46], // G minor
            [329.63, 440.00, 493.88, 587.33, 659.25]  // A suspended
        ];
        let chimeStep = 0;
        const chimeInterval = window.setInterval(() => {
            if (!this.audioContext || !this.musicGain) return;
            // 70% chance to play a soft starlight chime note
            if (Math.random() < 0.75) {
                const scale = chimeScales[chordIndex];
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.playWarmTone(note, 2.2, {
                    attack: 0.03,
                    gain: 0.08,
                    harmonic: 2,
                    lowpass: 950,
                    channel: 'music',
                    sendSpace: true
                });
            }
            chimeStep++;
        }, 3400);

        this.currentTrackCleanups.push(() => {
            clearInterval(chordInterval);
            clearInterval(chimeInterval);
        });
    }

    /**
     * MENU MUSIC: "The Thirteenth Chime Prelude"
     * Melancholy noir piano arpeggio echoing through space delay with warm cello pad.
     */
    private menuMusic() {
        if (!this.audioContext || !this.musicGain) return;
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Cello bass pad in A minor
        const padOsc = ctx.createOscillator();
        const padFilter = ctx.createBiquadFilter();
        const padGain = ctx.createGain();

        padOsc.type = 'triangle';
        padOsc.frequency.setValueAtTime(110.00, now); // A2

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(320, now);

        padGain.gain.setValueAtTime(0.14, now);

        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.musicGain);

        padOsc.start(now);
        this.activeMusicNodes.push(padOsc, padFilter, padGain);

        // Noir piano arpeggios (Am -> Fmaj7 -> Dm9 -> E7)
        const arpeggios = [
            [220.00, 261.63, 329.63, 392.00], // Am7: A3, C4, E4, G4
            [174.61, 220.00, 261.63, 329.63], // Fmaj7: F3, A3, C4, E4
            [146.83, 220.00, 261.63, 349.23], // Dm: D3, A3, C4, F4
            [164.81, 207.65, 246.94, 293.66]  // E7: E3, G#3, B3, D4
        ];
        const bassNotes = [110.00, 87.31, 73.42, 82.41];

        let bar = 0;
        let noteInBar = 0;

        const arpInterval = window.setInterval(() => {
            if (!this.audioContext || !this.musicGain) return;
            const currentArp = arpeggios[bar % arpeggios.length];
            const note = currentArp[noteInBar % currentArp.length];

            this.playWarmTone(note, 1.4, {
                attack: 0.02,
                gain: 0.12,
                harmonic: 2,
                lowpass: 1100,
                channel: 'music',
                sendSpace: true
            });

            noteInBar++;
            if (noteInBar >= 4) {
                noteInBar = 0;
                bar++;
                const nextBass = bassNotes[bar % bassNotes.length];
                const t = this.audioContext.currentTime;
                padOsc.frequency.exponentialRampToValueAtTime(nextBass, t + 0.8);
            }
        }, 700);

        this.currentTrackCleanups.push(() => {
            clearInterval(arpInterval);
        });
    }

    /**
     * SUSPENSE MUSIC: "Clockwork Shadows"
     * Deep cinematic sub-bass heartbeat pulse and eerie harmonic glass tension.
     * Zero harsh buzzes.
     */
    private suspenseMusic() {
        if (!this.audioContext || !this.musicGain) return;
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Eerie glass harmonic shimmer (pure pianissimo sine cluster: D5 + Eb5 beating)
        const glassA = ctx.createOscillator();
        const glassB = ctx.createOscillator();
        const glassGain = ctx.createGain();

        glassA.type = 'sine';
        glassB.type = 'sine';
        glassA.frequency.setValueAtTime(587.33, now); // D5
        glassB.frequency.setValueAtTime(592.50, now); // Slight dissonance (beating at 5Hz)

        glassGain.gain.setValueAtTime(0.018, now); // Very quiet, chilling psychological backdrop

        glassA.connect(glassGain);
        glassB.connect(glassGain);
        glassGain.connect(this.musicGain);

        glassA.start(now);
        glassB.start(now);
        this.activeMusicNodes.push(glassA, glassB, glassGain);

        // Deep cinematic heartbeat pulse (D1 / 48Hz with lowpass)
        let step = 0;
        const pulseInterval = window.setInterval(() => {
            if (!this.audioContext || !this.musicGain) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();

            const freq = step % 4 === 0 ? 46.25 : 55.00; // Deep low sub
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(110, t);

            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.16, t + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(t);
            osc.stop(t + 0.6);

            // Occasional soft minor piano stab on measure downbeats
            if (step % 8 === 0) {
                this.playWarmTone(146.83, 1.8, {
                    attack: 0.04,
                    gain: 0.11,
                    harmonic: 1.5,
                    lowpass: 450,
                    channel: 'music',
                    sendSpace: true
                });
            }

            step++;
        }, 650);

        this.currentTrackCleanups.push(() => {
            clearInterval(pulseInterval);
        });
    }

    /**
     * DEDUCTION MUSIC: "The Detective's Mind Palace"
     * Cool walking noir jazz bass line in D Dorian with muted clockwork marimba stabs.
     * Rhythmic, focused, intellectual, pleasing.
     */
    private deductionMusic() {
        if (!this.audioContext || !this.musicGain) return;

        // Walking noir bass line: D2 -> F2 -> G2 -> Ab2 -> A2 -> C3 -> D2
        const bassLine = [
            73.42,  // D2
            87.31,  // F2
            98.00,  // G2
            103.83, // Ab2
            110.00, // A2
            130.81, // C3
            98.00,  // G2
            87.31   // F2
        ];

        // Muted jazz chords for intellect/rhythm
        const jazzChords = [
            [220.00, 261.63, 349.23], // Dm
            [246.94, 293.66, 392.00]  // G7
        ];

        let step = 0;
        const deductionInterval = window.setInterval(() => {
            if (!this.audioContext || !this.musicGain) return;

            // Walking bass note
            const bassNote = bassLine[step % bassLine.length];
            this.playWarmTone(bassNote, 0.42, {
                attack: 0.02,
                gain: 0.16,
                harmonic: 2,
                lowpass: 380,
                channel: 'music',
                sendSpace: false
            });

            // Muted marimba chord on off-beats
            if (step % 2 === 1) {
                const chord = jazzChords[(Math.floor(step / 2)) % jazzChords.length];
                chord.forEach(f => {
                    this.playWarmTone(f, 0.35, {
                        attack: 0.015,
                        gain: 0.07,
                        harmonic: 1.5,
                        lowpass: 650,
                        channel: 'music',
                        sendSpace: true
                    });
                });
            }

            step++;
        }, 360);

        this.currentTrackCleanups.push(() => {
            clearInterval(deductionInterval);
        });
    }

    /**
     * RESOLUTION MUSIC: "Truth & Resolution"
     * Rich, warm, golden choral/string pad progression with gentle bells.
     */
    private resolutionMusic() {
        if (!this.audioContext || !this.musicGain) return;

        const chordProgressions = [
            [174.61, 220.00, 261.63, 329.63], // Fmaj7
            [196.00, 246.94, 293.66, 349.23], // G7
            [130.81, 164.81, 196.00, 246.94], // Cmaj7
            [110.00, 164.81, 220.00, 261.63]  // Am
        ];

        let step = 0;
        const resolutionInterval = window.setInterval(() => {
            if (!this.audioContext || !this.musicGain) return;
            const chord = chordProgressions[step % chordProgressions.length];
            chord.forEach(f => {
                this.playWarmTone(f, 2.8, {
                    attack: 0.25,
                    gain: 0.09,
                    harmonic: 2,
                    lowpass: 950,
                    channel: 'music',
                    sendSpace: true
                });
            });

            // High resolution bell
            if (step % 2 === 0) {
                this.playWarmTone(523.25 * (step % 4 === 0 ? 1 : 1.25), 2.0, {
                    attack: 0.03,
                    gain: 0.08,
                    harmonic: 2,
                    lowpass: 1400,
                    channel: 'music',
                    sendSpace: true
                });
            }

            step++;
        }, 2400);

        this.currentTrackCleanups.push(() => {
            clearInterval(resolutionInterval);
        });
    }
}
