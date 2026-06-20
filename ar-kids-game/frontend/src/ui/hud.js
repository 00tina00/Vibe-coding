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
          <img class="hud__target-icon" id="hud-target-icon" alt="" />
          <div class="hud__target-info">
            <div class="hud__target-prompt">${this.strings.findThis}</div>
            <div class="hud__target-name" id="hud-target-name"></div>
          </div>
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
        font-size: clamp(1rem, 3vw, 1.4rem);
        font-weight: 800;
        color: #fff;
        text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        background: rgba(255, 215, 0, 0.3);
        padding: 0.3rem 0.8rem;
        border-radius: 999px;
        border: 2px solid rgba(255, 215, 0, 0.7);
        font-family: "Vazirmatn", sans-serif;
        z-index: 3;
      }
      .hud__target-panel {
        position: absolute;
        top: env(safe-area-inset-top, 10px);
        right: 12px;
        margin-top: 8px;
        display: flex;
        flex-direction: row-reverse;
        align-items: center;
        gap: 0.5rem;
        background: rgba(26, 10, 46, 0.82);
        border: 2px solid #ffd700;
        border-radius: 14px;
        padding: 0.4rem 0.6rem;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
        z-index: 3;
        max-width: 42vw;
      }
      .hud__target-icon {
        width: clamp(36px, 9vw, 48px);
        height: clamp(36px, 9vw, 48px);
        object-fit: contain;
        filter: drop-shadow(0 1px 4px rgba(0,0,0,0.5));
        flex-shrink: 0;
        background: rgba(255,255,255,0.12);
        border-radius: 50%;
        padding: 4px;
      }
      .hud__target-info {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
      }
      .hud__target-prompt {
        font-size: clamp(0.65rem, 2vw, 0.75rem);
        font-weight: 700;
        color: #ffd700;
        font-family: "Vazirmatn", sans-serif;
        line-height: 1.2;
      }
      .hud__target-name {
        font-size: clamp(0.85rem, 2.5vw, 1rem);
        font-weight: 800;
        color: #fff;
        font-family: "Vazirmatn", sans-serif;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hud__hint {
        position: absolute;
        bottom: env(safe-area-inset-bottom, 12px);
        left: 50%;
        transform: translateX(-50%);
        font-size: clamp(0.75rem, 2.2vw, 0.9rem);
        color: rgba(255,255,255,0.85);
        background: rgba(0,0,0,0.45);
        padding: 0.3rem 0.75rem;
        border-radius: 999px;
        font-family: "Vazirmatn", sans-serif;
        z-index: 3;
      }
      .hud__level {
        position: absolute;
        bottom: env(safe-area-inset-bottom, 12px);
        left: 12px;
        font-size: 0.85rem;
        color: rgba(255,255,255,0.9);
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        font-family: "Vazirmatn", sans-serif;
        z-index: 3;
      }
      .hud__target-panel.flash {
        animation: target-flash 0.5s ease;
      }
      @keyframes target-flash {
        0%, 100% { border-color: #ffd700; transform: scale(1); }
        50% { border-color: #fff; transform: scale(1.06); }
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
