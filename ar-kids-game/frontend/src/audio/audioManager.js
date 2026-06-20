import * as Tone from "tone";

export class AudioManager {
  constructor() {
    this.initialized = false;
    this.successSynth = null;
    this.errorSynth = null;
    this.sparkleSynth = null;
  }

  async init() {
    if (this.initialized) return;
    await Tone.start();

    this.successSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.4 },
    }).toDestination();

    this.errorSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0, release: 0.2 },
    }).toDestination();

    this.sparkleSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.15, release: 0.1 },
      harmonicity: 5.1,
      modulationIndex: 20,
      resonance: 4000,
      octaves: 0.5,
    }).toDestination();

    this.sparkleSynth.volume.value = -12;
    this.initialized = true;
  }

  playSuccess() {
    if (!this.initialized) return;
    const now = Tone.now();
    this.successSynth.triggerAttackRelease(["C5", "E5", "G5"], "8n", now);
    this.successSynth.triggerAttackRelease(["E5", "G5", "C6"], "8n", now + 0.12);
    this.sparkleSynth.triggerAttackRelease("32n", now + 0.05);
  }

  playIncorrect() {
    if (!this.initialized) return;
    const now = Tone.now();
    this.errorSynth.triggerAttackRelease("A4", "16n", now);
    this.errorSynth.triggerAttackRelease("G4", "16n", now + 0.15);
  }

  playLevelUp() {
    if (!this.initialized) return;
    const now = Tone.now();
    ["C4", "E4", "G4", "C5"].forEach((note, i) => {
      this.successSynth.triggerAttackRelease(note, "16n", now + i * 0.1);
    });
  }
}
