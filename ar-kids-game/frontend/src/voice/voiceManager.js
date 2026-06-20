import { gameConfig } from "../config/gameConfig.js";

export class VoiceManager {
  constructor() {
    this.language = gameConfig.defaultLanguage;
    this.translations = {};
    this.speaking = false;
    this.queue = [];
  }

  async loadLanguage(code = gameConfig.defaultLanguage) {
    const response = await fetch(`/locales/${code}.json`);
    if (!response.ok) {
      throw new Error(`Locale not found: ${code}`);
    }
    this.translations = await response.json();
    this.language = code;
  }

  t(key) {
    return this.translations[key] || key;
  }

  formatPhrase(templateKey, itemKey) {
    const template = this.t(templateKey);
    return template.replace("{item}", this.t(itemKey));
  }

  speak(key, prefixKey = null) {
    const parts = [];
    if (prefixKey) parts.push(this.t(prefixKey));
    parts.push(this.t(key));
    this.enqueue(parts.join(" "));
  }

  speakPhrase(phrase) {
    this.enqueue(phrase);
  }

  enqueue(text) {
    this.queue.push(text);
    if (!this.speaking) {
      this.processQueue();
    }
  }

  processQueue() {
    if (this.queue.length === 0) {
      this.speaking = false;
      return;
    }

    this.speaking = true;
    const text = this.queue.shift();

    if (!window.speechSynthesis) {
      this.processQueue();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fa-IR";
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.onend = () => this.processQueue();
    utterance.onerror = () => this.processQueue();
    window.speechSynthesis.speak(utterance);
  }

  announceTarget(voiceKey) {
    this.speakPhrase(this.formatPhrase("findPhrase", voiceKey));
  }

  announceSuccess(voiceKey) {
    this.speak("greatJob");
    setTimeout(
      () => this.speakPhrase(this.formatPhrase("nowFindPhrase", voiceKey)),
      1200
    );
  }

  announceTryAgain() {
    const keys = ["tryAgain", "almostThere", "keepLooking"];
    const key = keys[Math.floor(Math.random() * keys.length)];
    this.speak(key);
  }
}
