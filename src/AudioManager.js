export class AudioManager {
  constructor() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
    this.enabled = true;

    // Unlock audio context on first interaction
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
  }

  playMechanicalClick() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playMagneticSnap() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    
    // Low thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
    
    // Optional mobile haptics
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  }
}
