export class Menu {
  constructor(rootElement, strings, onStart) {
    this.root = rootElement;
    this.strings = strings;
    this.onStart = onStart;
    this.render();
  }

  render() {
    const menu = document.createElement("div");
    menu.className = "menu interactive";
    menu.innerHTML = `
      <div class="menu__card">
        <div class="menu__emoji">🌟</div>
        <h1 class="menu__title">${this.strings.appTitle}</h1>
        <button class="menu__start" id="menu-start" aria-label="${this.strings.startGame}">
          ▶
        </button>
        <p class="menu__hint">${this.strings.startGame}</p>
      </div>
    `;

    this.root.appendChild(menu);
    this.injectStyles();

    menu.querySelector("#menu-start").addEventListener("click", async () => {
      menu.classList.add("hidden");
      await this.onStart();
    });
  }

  injectStyles() {
    if (document.getElementById("menu-styles")) return;

    const style = document.createElement("style");
    style.id = "menu-styles";
    style.textContent = `
      .menu {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(26,10,46,0.92), rgba(74,20,140,0.88));
        z-index: 10;
      }
      .menu__card {
        text-align: center;
        color: #fff;
      }
      .menu__emoji {
        font-size: 4rem;
        margin-bottom: 0.5rem;
      }
      .menu__title {
        font-size: clamp(1.8rem, 5vw, 2.8rem);
        margin-bottom: 2rem;
        font-weight: 800;
        font-family: "Vazirmatn", sans-serif;
      }
      .menu__start {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #ffd700, #ff9500);
        font-size: 2rem;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255,215,0,0.4);
      }
      .menu__hint {
        margin-top: 1rem;
        font-size: 1.1rem;
        opacity: 0.9;
        font-family: "Vazirmatn", sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  hide() {
    const menu = this.root.querySelector(".menu");
    if (menu) menu.classList.add("hidden");
  }

  show() {
    const menu = this.root.querySelector(".menu");
    if (menu) menu.classList.remove("hidden");
  }
}
