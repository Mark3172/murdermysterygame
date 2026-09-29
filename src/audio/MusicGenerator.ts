export class MusicGenerator {
    private ctx: AudioContext;
    private dest: GainNode;
    private scheduledNodes: AudioScheduledSourceNode[] = [];
    private timeouts: number[] = [];

    constructor(ctx: AudioContext, dest: GainNode) {
        this.ctx = ctx;
        this.dest = dest;
    }

    private clear() {
        this.scheduledNodes.forEach(n => {
            try { n.stop(); } catch(e) {}
        });
        this.scheduledNodes = [];
        this.timeouts.forEach(t => clearTimeout(t));
        this.timeouts = [];
    }

    private playTone(freq: number, startTime: number, duration: number, type: OscillatorType, maxGain: number, fadeIn = 0.1, fadeOut = 0.5) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(maxGain, startTime + fadeIn);
        gain.gain.setValueAtTime(maxGain, startTime + duration - fadeOut);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.connect(gain);
        gain.connect(this.dest);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
        
        this.scheduledNodes.push(osc);
    }

    private schedulePattern(notes: {freq: number, time: number, dur: number}[], loopLen: number, maxGain: number) {
        let iterations = 0;
        const scheduleNext = () => {
            const now = this.ctx.currentTime;
            notes.forEach(n => {
                this.playTone(n.freq, now + n.time, n.dur, 'sine', maxGain);
            });
            iterations++;
            this.timeouts.push(window.setTimeout(scheduleNext, loopLen * 1000));
        };
        scheduleNext();
    }

    menuTheme(): () => void {
        this.clear();
        const notes = [
            {freq: 164.81, time: 0, dur: 2}, // E3
            {freq: 196.00, time: 2, dur: 2}, // G3
            {freq: 246.94, time: 4, dur: 2}, // B3
            {freq: 261.63, time: 6, dur: 2}, // C4
            {freq: 246.94, time: 8, dur: 2}, // B3
            {freq: 196.00, time: 10, dur: 2} // G3
        ];
        this.schedulePattern(notes, 16, 0.2);
        
        // Ticking
        const tickLoop = () => {
            this.playTone(800, this.ctx.currentTime, 0.05, 'triangle', 0.05, 0.01, 0.01);
            this.timeouts.push(window.setTimeout(tickLoop, 800));
        };
        tickLoop();

        return () => this.clear();
    }

    explorationTheme(): () => void {
        this.clear();
        
        const drone = this.ctx.createOscillator();
        drone.type = 'sawtooth';
        drone.frequency.value = 55;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;
        
        drone.connect(filter);
        filter.connect(gain);
        gain.connect(this.dest);
        drone.start();
        this.scheduledNodes.push(drone);

        const notes = [
            {freq: 220, time: 2, dur: 4}, // A3
            {freq: 261.63, time: 10, dur: 4}, // C4
            {freq: 329.63, time: 18, dur: 4}, // E4
            {freq: 293.66, time: 26, dur: 4}  // D4
        ];
        this.schedulePattern(notes, 32, 0.1);

        return () => {
            this.clear();
            gain.disconnect();
        };
    }

    suspenseTheme(): () => void {
        this.clear();
        // Simplified pulsing bass
        const drone = this.ctx.createOscillator();
        drone.type = 'triangle';
        drone.frequency.value = 50;
        const gain = this.ctx.createGain();
        drone.connect(gain);
        gain.connect(this.dest);
        drone.start();
        this.scheduledNodes.push(drone);

        const pulseLoop = () => {
            gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.4);
            gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.8);
            this.timeouts.push(window.setTimeout(pulseLoop, 800));
        };
        pulseLoop();

        return () => this.clear();
    }

    discoveryMotif(): () => void {
        this.clear();
        const now = this.ctx.currentTime;
        this.playTone(261.63, now, 0.5, 'sine', 0.2); // C4
        this.playTone(329.63, now + 0.2, 0.5, 'sine', 0.2); // E4
        this.playTone(392.00, now + 0.4, 0.5, 'sine', 0.2); // G4
        this.playTone(523.25, now + 0.6, 1.0, 'sine', 0.2); // C5
        return () => this.clear();
    }

    deductionTheme(): () => void {
        this.clear();
        const tickLoop = () => {
            this.playTone(1000, this.ctx.currentTime, 0.05, 'triangle', 0.1, 0.01, 0.01);
            this.timeouts.push(window.setTimeout(tickLoop, 500)); // 120bpm = 500ms
        };
        tickLoop();
        return () => this.clear();
    }

    resolutionTheme(): () => void {
        this.clear();
        const chords = [
            [261.63, 329.63, 392.00], // C
            [220.00, 261.63, 329.63], // Am
            [174.61, 220.00, 261.63], // F
            [196.00, 246.94, 293.66]  // G
        ];
        
        let i = 0;
        const playChordLoop = () => {
            const chord = chords[i % chords.length];
            chord.forEach(freq => {
                this.playTone(freq, this.ctx.currentTime, 3, 'sine', 0.1, 1, 1);
            });
            i++;
            this.timeouts.push(window.setTimeout(playChordLoop, 4000));
        };
        playChordLoop();
        
        return () => this.clear();
    }

    creditTheme(): () => void {
        return this.menuTheme(); // simplified
    }
}
