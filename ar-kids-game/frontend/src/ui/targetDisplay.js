export class TargetDisplay {
  constructor(container) {
    this.container = container;
  }

  show(target) {
    if (!target) return;
    const icon = this.container.querySelector("#hud-target-icon");
    if (icon) {
      icon.src = target.icon;
      icon.classList.remove("bounce");
      void icon.offsetWidth;
      icon.classList.add("bounce");
    }
  }
}
