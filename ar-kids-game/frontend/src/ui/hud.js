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
        <div class="hud__target" id="hud-target">
          <div class="hud__target-ring"></div>
          <img class="hud__target-icon" id="hud-target-icon" alt="" />
        </div>
        <div class="hud__level" id="hud-level"></div>
      </div>
    `;

    this.scoreEl = this.root.querySelector("#hud-score");
    this.targetIconEl = this.root.querySelector("#hud-target-icon");
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
        top: env(safe-area-inset-top, 12px);
        left: 50%;
        transform: translateX(-50%);
        margin-top: 12px;
        font-size: clamp(1.4rem, 4vw, 2rem);
        font-weight: 800;
        color: #fff;
        text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        background: rgba(255, 215, 0, 0.25);
        padding: 0.4rem 1.2rem;
        border-radius: 999px;
        border: 2px solid rgba(255, 215, 0, 0.6);
        font-family: "Vazirmatn", sans-serif;
      }
      .hud__target {
        position: absolute;
        top: env(safe-area-inset-top, 12px);
        left: 50%;
        transform: translateX(-50%);
        margin-top: 72px;
        width: clamp(72px, 18vw, 110px);
        height: clamp(72px, 18vw, 110px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .hud__target-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 4px solid rgba(255,255,255,0.8);
        box-shadow: 0 0 20px rgba(255,215,0,0.5);
        animation: pulse-ring 2s ease-in-out infinite;
      }
      @keyframes pulse-ring {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.85; }
      }
      .hud__target-icon {
        width: 65%;
        height: 65%;
        object-fit: contain;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
        z-index: 1;
      }
      .hud__level {
        position: absolute;
        bottom: env(safe-area-inset-bottom, 12px);
        left: 16px;
        font-size: 1rem;
        color: rgba(255,255,255,0.9);
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        font-family: "Vazirmatn", sans-serif;
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
  }

  updateLevel(level) {
    this.levelEl.textContent = `${this.strings.level} ${this.toPersianDigits(level)}`;
  }
}
