export class Hud {
  constructor(rootElement, strings) {
    this.strings = strings;
    this.root = rootElement;
    this.render();
  }

  render() {
    this.root.innerHTML = `
      <div class="hud">
        <div class="hud__score" id="hud-score">⭐ ۰</div>

        <div class="hud__target-panel" id="hud-target-panel">
          <div class="hud__target-prompt">${this.strings.findThis}</div>
          <div class="hud__target-icon-wrap">
            <div class="hud__target-ring"></div>
            <img class="hud__target-icon" id="hud-target-icon" alt="" />
          </div>
          <div class="hud__target-name" id="hud-target-name"></div>
        </div>

        <div class="hud__hint">${this.strings.lookAround}</div>
        <div class="hud__level" id="hud-level"></div>
      </div>
    `;

    this.scoreEl = this.root.querySelector("#hud-score");
    this.targetIconEl = this.root.querySelector("#hud-target-icon");
    this.targetNameEl = this.root.querySelector("#hud-target-name");
    this.targetPanelEl = this.root.querySelector("#hud-target-panel");
    this.levelEl = this.root.querySelector("#hud-level");

    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById("hud-styles")) return;

    const style = document.createElement("style");
    style.id = "hud-styles";
    style.textContent = `
      .hud {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .hud__score {
        position: absolute;
        top: env(safe-area-inset-top, 8px);
        left: 50%;
        transform: translateX(-50%);
        margin-top: 8px;
        font-size: clamp(1.2rem, 3.5vw, 1.8rem);
        font-weight: 800;
        color: #fff;
        text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        background: rgba(255, 215, 0, 0.3);
        padding: 0.35rem 1rem;
        border-radius: 999px;
        border: 2px solid rgba(255, 215, 0, 0.7);
        font-family: "Vazirmatn", sans-serif;
        z-index: 3;
      }
      .hud__target-panel {
        position: absolute;
        top: env(safe-area-inset-top, 8px);
        left: 50%;
        transform: translateX(-50%);
        margin-top: 52px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        background: rgba(26, 10, 46, 0.75);
        border: 3px solid #ffd700;
        border-radius: 20px;
        padding: 0.6rem 1.2rem 0.8rem;
        box-shadow: 0 4px 24px rgba(255, 215, 0, 0.35);
        z-index: 3;
        min-width: clamp(140px, 30vw, 200px);
      }
      .hud__target-prompt {
        font-size: clamp(1rem, 3vw, 1.3rem);
        font-weight: 800;
        color: #ffd700;
        font-family: "Vazirmatn", sans-serif;
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
      }
      .hud__target-icon-wrap {
        position: relative;
        width: clamp(80px, 20vw, 120px);
        height: clamp(80px, 20vw, 120px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .hud__target-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 4px solid #fff;
        box-shadow: 0 0 24px rgba(255,215,0,0.6);
        animation: pulse-ring 1.5s ease-in-out infinite;
      }
      @keyframes pulse-ring {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.85; }
      }
      .hud__target-icon {
        width: 70%;
        height: 70%;
        object-fit: contain;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        z-index: 1;
      }
      .hud__target-name {
        font-size: clamp(1.1rem, 3.5vw, 1.5rem);
        font-weight: 800;
        color: #fff;
        font-family: "Vazirmatn", sans-serif;
        text-shadow: 0 2px 6px rgba(0,0,0,0.6);
      }
      .hud__hint {
        position: absolute;
        bottom: env(safe-area-inset-bottom, 12px);
        left: 50%;
        transform: translateX(-50%);
        font-size: clamp(0.85rem, 2.5vw, 1rem);
        color: rgba(255,255,255,0.85);
        background: rgba(0,0,0,0.45);
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        font-family: "Vazirmatn", sans-serif;
        z-index: 3;
      }
      .hud__level {
        position: absolute;
        bottom: env(safe-area-inset-bottom, 12px);
        left: 16px;
        font-size: 0.95rem;
        color: rgba(255,255,255,0.9);
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        font-family: "Vazirmatn", sans-serif;
        z-index: 3;
      }
      .hud__target-panel.flash {
        animation: target-flash 0.5s ease;
      }
      @keyframes target-flash {
        0%, 100% { border-color: #ffd700; }
        50% { border-color: #fff; transform: translateX(-50%) scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }

  toPersianDigits(num) {
    return String(num).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  }

  updateScore(score) {
    this.scoreEl.textContent = `⭐ ${this.toPersianDigits(score)}`;
  }

  updateTarget(target) {
    if (!target) return;
    this.targetIconEl.src = target.icon;
    this.targetIconEl.alt = this.strings[target.voiceKey] || target.voiceKey;
    this.targetNameEl.textContent = this.strings[target.voiceKey] || target.voiceKey;

    this.targetPanelEl.classList.remove("flash");
    void this.targetPanelEl.offsetWidth;
    this.targetPanelEl.classList.add("flash");
  }

  updateLevel(level) {
    this.levelEl.textContent = `${this.strings.level} ${this.toPersianDigits(level)}`;
  }
}
