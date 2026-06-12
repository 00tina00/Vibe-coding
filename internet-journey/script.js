/**
 * Journey UI + Three.js world integration
 */
import { PostOfficeWorld } from "./world3d.js";

const STAGES = [
  {
    id: 0,
    title: "کلاینت",
    tech: "Client",
    icon: "💻",
    persianNum: "۱",
    previewClass: "preview-0",
    desc: "کلاینت همان شما، مرورگر یا دستگاهی است که درخواست را آغاز می‌کند.",
    detail:
      "وقتی آدرس یک وب‌سایت را وارد می‌کنید، مرورگر شما یک نامه درخواست با برچسب <strong>GET /</strong> به پست‌خانه اینترنت می‌فرستد.",
    carry: true,
  },
  {
    id: 1,
    title: "DNS",
    tech: "DNS (دفتر نام‌ها)",
    icon: "📇",
    persianNum: "۲",
    previewClass: "preview-1",
    desc: "DNS نام‌های دامنه را به آدرس IP تبدیل می‌کند.",
    detail:
      "کارمند DNS نام <strong>google.com</strong> را به <strong>142.250.x.x</strong> ترجمه می‌کند.",
    carry: true,
  },
  {
    id: 2,
    title: "مسیریابی IP",
    tech: "IP Routing",
    icon: "🗺️",
    persianNum: "۳",
    previewClass: "preview-2",
    desc: "IP مسیر رسیدن بسته‌ها به مقصد را تعیین می‌کند.",
    detail: "اتاق کنترل با نقشه‌های زنده — GPS برای داده.",
    carry: true,
  },
  {
    id: 3,
    title: "کارخانه بسته",
    tech: "Packet",
    icon: "📦",
    persianNum: "۴",
    previewClass: "preview-3",
    desc: "داده‌های بزرگ به بسته‌های کوچک تقسیم می‌شوند.",
    detail: "ماشین نامه بزرگ را به ده‌ها پاکت کوچک تقسیم می‌کند.",
    carry: true,
  },
  {
    id: 4,
    title: "مدیریت مطمئن",
    tech: "TCP",
    icon: "🔢",
    persianNum: "۵",
    previewClass: "preview-4",
    desc: "TCP تحویل قابل‌اعتماد و مرتب بسته‌ها را تضمین می‌کند.",
    detail: "شماره‌گذاری، درخواست مجدد، و چیدمان مرتب بسته‌ها.",
    carry: true,
  },
  {
    id: 5,
    title: "دست دادن سه‌مرحله‌ای",
    tech: "TCP Handshake",
    icon: "🤝",
    persianNum: "۶",
    previewClass: "preview-5",
    desc: "قبل از ارسال داده، دو طرف اتصال را تأیید می‌کنند.",
    detail: "<strong>SYN</strong> → <strong>SYN-ACK</strong> → <strong>ACK</strong>",
    carry: true,
  },
  {
    id: 6,
    title: "زبان درخواست‌ها",
    tech: "HTTP",
    icon: "📨",
    persianNum: "۷",
    previewClass: "preview-6",
    desc: "HTTP قالب درخواست و پاسخ را مشخص می‌کند.",
    detail: "درخواست‌ها با قالب استاندارد <strong>HTTP</strong> مهر می‌شوند.",
    carry: true,
  },
  {
    id: 7,
    title: "رمزنگاری",
    tech: "TLS / HTTPS",
    icon: "🔒",
    persianNum: "۸",
    previewClass: "preview-7",
    desc: "HTTPS اطلاعات را رمزنگاری و امن می‌کند.",
    detail: "اتاق خزانه — <strong>TLS</strong> محتوا را قفل می‌کند.",
    carry: true,
  },
  {
    id: 8,
    title: "سرور مقصد",
    tech: "Server",
    icon: "🗄️",
    persianNum: "۹",
    previewClass: "preview-8",
    desc: "سرور بسته‌ها را دریافت و دوباره سرهم می‌کند.",
    detail: "ردیف‌های رک سرور داده را پردازش می‌کنند.",
    carry: true,
  },
  {
    id: 9,
    title: "پاسخ",
    tech: "Response",
    icon: "🚚",
    persianNum: "۱۰",
    previewClass: "preview-9",
    desc: "پاسخ به کلاینت برمی‌گردد و صفحه ساخته می‌شود.",
    detail: "<strong>HTML</strong>، <strong>CSS</strong> و تصاویر به مرورگر برمی‌گردند.",
    carry: true,
  },
];

const timelineTrack = document.getElementById("timeline-track");
const stageNum = document.getElementById("stage-num");
const stageTitle = document.getElementById("stage-title");
const stageTech = document.getElementById("stage-tech");
const stageDesc = document.getElementById("stage-desc");
const stageDetail = document.getElementById("stage-detail");
const progressFill = document.getElementById("progress-fill");
const btnHelp = document.getElementById("btn-help");
const btnTheme = document.getElementById("btn-theme");
const autoMode = document.getElementById("auto-mode");
const helpModal = document.getElementById("help-modal");
const closeHelp = document.getElementById("close-help");
const viewport = document.getElementById("viewport");
const canvas = document.getElementById("world-canvas");
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");
const zoomResetBtn = document.getElementById("zoom-reset");

let world;
let currentStage = 0;
let journeyStarted = false;
let autoTimer = null;

function buildTimeline() {
  timelineTrack.innerHTML = "";
  STAGES.forEach((stage, i) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "timeline-card";
    card.dataset.stage = String(i);
    card.setAttribute("aria-label", `مرحله ${stage.persianNum}: ${stage.title}`);
    card.innerHTML = `
      <div class="card-preview ${stage.previewClass}">
        <span class="card-icon" aria-hidden="true">${stage.icon}</span>
      </div>
      <div class="card-num">${stage.persianNum}</div>
      <div class="card-title">${stage.title}</div>
      <div class="card-tech">${stage.tech}</div>
    `;
    card.addEventListener("click", () => goToStage(i));
    timelineTrack.appendChild(card);
  });
}

function updateUI() {
  const stage = STAGES[currentStage];
  stageNum.textContent = `${stage.persianNum} از ۱۰`;
  stageTitle.textContent = stage.title;
  stageTech.textContent = stage.tech;
  stageDesc.textContent = stage.desc;
  stageDetail.innerHTML = stage.detail;
  progressFill.style.width = `${((currentStage + 1) / 10) * 100}%`;

  document.querySelectorAll(".timeline-card").forEach((card, i) => {
    card.classList.toggle("is-active", i === currentStage);
    card.classList.toggle("is-done", i < currentStage);
  });

  const activeCard = timelineTrack.querySelector(`[data-stage="${currentStage}"]`);
  activeCard?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

  world?.setActiveStage(currentStage);
  world?.setCarryVisible(!!stage.carry);
  world?.focusStage(currentStage, true);
}

function replayStage() {
  world?.focusStage(currentStage, true);
  const dep = world?.departments[currentStage];
  if (dep) {
    dep.scale.setScalar(1);
    requestAnimationFrame(() => dep.scale.setScalar(1.02));
  }
}

function goToStage(index, skipWalk = false) {
  if (index < 0 || index >= STAGES.length) return;
  if (index === currentStage) {
    replayStage();
    return;
  }
  if (!journeyStarted && index > 0) journeyStarted = true;

  const prev = currentStage;
  currentStage = index;
  updateUI();

  if (!skipWalk && world) {
    world.walkToStage(prev, index, () => {});
  } else {
    world?.placeCharacterAt(index);
  }

  resetAutoTimer();
}

function nextStage() {
  if (currentStage < STAGES.length - 1) goToStage(currentStage + 1);
}

function prevStage() {
  if (currentStage > 0) goToStage(currentStage - 1);
}

function resetAutoTimer() {
  clearInterval(autoTimer);
  if (!autoMode.checked) return;
  autoTimer = setInterval(() => {
    if (currentStage >= STAGES.length - 1) {
      goToStage(0, true);
      setTimeout(() => goToStage(1), 500);
      return;
    }
    nextStage();
  }, 8000);
}

function init() {
  buildTimeline();
  world = new PostOfficeWorld(canvas);
  world.init();
  journeyStarted = true;
  updateUI();

  const ro = new ResizeObserver(() => world.resize());
  ro.observe(viewport);

  btnHelp.addEventListener("click", () => helpModal.showModal());
  closeHelp.addEventListener("click", () => helpModal.close());
  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) helpModal.close();
  });

  btnTheme.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    document.documentElement.setAttribute("data-theme", isLight ? "dark" : "light");
    btnTheme.querySelector(".theme-icon").textContent = isLight ? "🌙" : "☀️";
    if (world?.scene) {
      world.scene.background.set(isLight ? 0xe8e6e1 : 0x121820);
    }
  });

  autoMode.addEventListener("change", resetAutoTimer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") nextStage();
    if (e.key === "ArrowRight") prevStage();
    if (e.key === " ") {
      e.preventDefault();
      replayStage();
    }
  });

  zoomInBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    world?.zoomBy(0.88);
  });
  zoomOutBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    world?.zoomBy(1.14);
  });
  zoomResetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    world?.resetView(currentStage);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
