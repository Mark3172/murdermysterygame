export class SFXGenerator {
    private ctx: AudioContext;
    private dest: GainNode;

    constructor(ctx: AudioContext, dest: GainNode) {
        this.ctx = ctx;
        this.dest = dest;
    }

    private playNoise(duration: number, bandpassFreq?: number, vol = 0.5): () => void {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        let lastNode: AudioNode = noise;

        if (bandpassFreq) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = bandpassFreq;
            lastNode.connect(filter);
            lastNode = filter;
        }

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        lastNode.connect(gain);
        gain.connect(this.dest);

        noise.start();
        return () => noise.stop();
    }

    private playOscillator(type: OscillatorType, freq: number, duration: number, vol = 0.5, sweepToFreq?: number) {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        if (sweepToFreq) {
            osc.frequency.exponentialRampToValueAtTime(sweepToFreq, this.ctx.currentTime + duration);
        }

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.dest);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    footstep(): void {
        this.playNoise(0.03, 500, 0.3);
    }

    doorOpen(): void {
        this.playOscillator('sawtooth', 100, 0.2, 0.5, 40);
    }

    doorClose(): void {
        this.playOscillator('sine', 60, 0.15, 0.8, 20);
    }

    thunder(): void {
        this.playNoise(1.5, 200, 0.8);
        this.playOscillator('sawtooth', 80, 1.5, 0.6, 40);
    }

    bellChime(pitch = 440): void {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
        
        // slight vibrato
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 5;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 5;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.0);

        osc.connect(gain);
        gain.connect(this.dest);

        osc.start();
        osc.stop(this.ctx.currentTime + 2.0);
        setTimeout(() => lfo.stop(), 2000);
    }

    thirteenthChime(): void {
        this.bellChime(415);
        this.playOscillator('sawtooth', 415, 2.0, 0.2, 410); // Added dissonance
    }

    clockTick(): void {
        this.playOscillator('triangle', 2000, 0.02, 0.1);
    }

    paperRustle(): void {
        this.playNoise(0.1, 2500, 0.2);
    }

    uiClick(): void {
        this.playOscillator('sine', 800, 0.03, 0.4);
    }

    uiHover(): void {
        this.playOscillator('sine', 600, 0.02, 0.1);
    }

    discoveryStinger(): void {
        this.playOscillator('sine', 523.25, 0.1, 0.3); // C5
        setTimeout(() => this.playOscillator('sine', 659.25, 0.1, 0.3), 100); // E5
        setTimeout(() => this.playOscillator('sine', 783.99, 0.2, 0.3), 200); // G5
    }

    tensionBuild(): void {
        this.playOscillator('sawtooth', 50, 3.0, 0.5, 100);
    }

    scream(): void {
        this.playNoise(0.8, 1500, 0.7); // Simplified noise burst for scream
        this.playOscillator('sawtooth', 800, 0.8, 0.5, 400);
    }

    glassBreak(): void {
        this.playNoise(0.2, 6000, 0.6);
    }

    windRain(): () => void {
        return this.playNoise(999, 400, 0.2); // continuous noise
    }

    heartbeat(): void {
        this.playOscillator('sine', 50, 0.08, 0.6, 30);
        setTimeout(() => this.playOscillator('sine', 50, 0.08, 0.6, 30), 200);
    }
}
