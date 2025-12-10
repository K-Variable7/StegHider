// Audio utilities for VaultWars sound effects
// Uses Web Audio API to generate procedural sounds

class AudioManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize on first user interaction to comply with browser policies
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Generate a simple beep tone
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.isEnabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Sound effects for different game actions
  async playMint() {
    await this.ensureAudioContext();
    // Pleasant ascending tone
    this.playTone(523, 0.3, 'sine'); // C5
    setTimeout(() => this.playTone(659, 0.3, 'sine'), 150); // E5
    setTimeout(() => this.playTone(784, 0.4, 'sine'), 300); // G5
  }

  async playReveal() {
    await this.ensureAudioContext();
    // Mysterious descending tone
    this.playTone(784, 0.2, 'triangle'); // G5
    setTimeout(() => this.playTone(659, 0.2, 'triangle'), 100); // E5
    setTimeout(() => this.playTone(523, 0.3, 'triangle'), 200); // C5
  }

  async playSteal() {
    await this.ensureAudioContext();
    // Aggressive sound
    this.playTone(220, 0.1, 'sawtooth'); // A3
    setTimeout(() => this.playTone(277, 0.1, 'sawtooth'), 50); // C#4
    setTimeout(() => this.playTone(330, 0.2, 'sawtooth'), 100); // E4
  }

  async playLevelUp() {
    await this.ensureAudioContext();
    // Triumphant fanfare
    this.playTone(523, 0.2, 'square'); // C5
    setTimeout(() => this.playTone(659, 0.2, 'square'), 100); // E5
    setTimeout(() => this.playTone(784, 0.2, 'square'), 200); // G5
    setTimeout(() => this.playTone(1047, 0.4, 'square'), 300); // C6
  }

  async playSuccess() {
    await this.ensureAudioContext();
    // Positive confirmation
    this.playTone(784, 0.15, 'sine'); // G5
    setTimeout(() => this.playTone(988, 0.15, 'sine'), 75); // B5
    setTimeout(() => this.playTone(1175, 0.2, 'sine'), 150); // D6
  }

  async playError() {
    await this.ensureAudioContext();
    // Negative feedback
    this.playTone(220, 0.3, 'sawtooth'); // A3
  }

  async playFactionSelect() {
    await this.ensureAudioContext();
    // Faction selection sound
    this.playTone(440, 0.1, 'triangle'); // A4
    setTimeout(() => this.playTone(554, 0.1, 'triangle'), 50); // C#5
    setTimeout(() => this.playTone(659, 0.15, 'triangle'), 100); // E5
  }

  // Enable/disable audio
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
