/**
 * FlowTask — Premium To-Do Application
 * Vanilla JS | localStorage persistence
 */

(function () {
  "use strict";

  /* ============================================================
     CONFIG & CONSTANTS
     ============================================================ */
  const STORAGE_KEY = "flowtask_data";
  const XP_PER_TASK = 25;
  const XP_PRIORITY_BONUS = { low: 0, medium: 5, high: 15, urgent: 25 };
  const XP_PER_LEVEL = 200;
  const POMO_WORK = 25 * 60;
  const POMO_BREAK = 5 * 60;

  const ACHIEVEMENTS_DEF = [
    { id: "first_task", title: "First Step", desc: "Complete your first task", icon: "🎯" },
    { id: "streak_7", title: "7-Day Streak", desc: "Maintain a 7-day streak", icon: "🔥" },
    { id: "productivity_master", title: "Productivity Master", desc: "Score 80+ in a day", icon: "⭐" },
    { id: "focus_champion", title: "Focus Champion", desc: "Complete 5 pomodoro sessions", icon: "🧠" },
    { id: "early_bird", title: "Early Bird", desc: "Complete a task before 9am", icon: "🌅" },
    { id: "task_destroyer", title: "Task Destroyer", desc: "Complete 50 tasks total", icon: "💥" },
    { id: "daily_all", title: "Daily Champion", desc: "Complete all tasks due today", icon: "🏆" },
  ];

  const MOTIVATIONS = {
    morning: ["Fresh start — capture your first win.", "Small steps create big momentum."],
    afternoon: ["You're in the flow. Keep going!", "One focused task at a time."],
    evening: ["Finish strong today.", "Tomorrow-you will thank you."],
    streak: ["Your streak is on fire! 🔥", "Consistency beats intensity."],
    highScore: ["Productivity superstar mode activated.", "You're crushing it today!"],
    low: ["Every journey starts with one task.", "Progress over perfection."],
  };

  /* ============================================================
     STATE
     ============================================================ */
  let state = loadState();
  let currentView = "dashboard";
  let currentProjectFilter = null;
  let editingTaskId = null;
  let dragTaskId = null;
  let calendarMonth = new Date();
  let snoozeTaskId = null;

  let pomo = {
    secondsLeft: POMO_WORK,
    running: false,
    isBreak: false,
    interval: null,
    sessionsToday: 0,
  };

  /* ============================================================
     STORAGE
     ============================================================ */
  function defaultState() {
    return {
      tasks: [],
      projects: [
        { id: "inbox", name: "Inbox", color: "#7c3aed" },
        { id: "work", name: "Work", color: "#3b82f6" },
        { id: "personal", name: "Personal", color: "#10b981" },
      ],
      theme: "light",
      gamification: {
        xp: 0,
        level: 1,
        achievements: [],
        streak: { daily: 0, lastDate: null, weekly: 0, lastWeek: null, focus: 0 },
        stats: {
          totalCompleted: 0,
          dailyScores: {},
          focusMinutes: 0,
          pomodorosToday: 0,
          lastPomoDate: null,
        },
      },
      preferences: { lastView: "dashboard" },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed, gamification: { ...defaultState().gamification, ...parsed.gamification } };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* ============================================================
     SMART PARSER — natural language dates
     ============================================================ */
  const SmartParser = {
    parse(text) {
      let title = text.trim();
      let dueDate = null;
      let reminderAt = null;
      let recurring = null;
      const now = new Date();
      const lower = title.toLowerCase();

      // Recurring: every monday, daily, weekly, monthly
      if (/every\s+monday/i.test(title)) {
        recurring = { type: "custom", weekdays: [1] };
        title = title.replace(/every\s+monday/gi, "").trim();
      } else if (/every\s+tuesday/i.test(title)) {
        recurring = { type: "custom", weekdays: [2] };
        title = title.replace(/every\s+tuesday/gi, "").trim();
      } else if (/every\s+wednesday/i.test(title)) {
        recurring = { type: "custom", weekdays: [3] };
        title = title.replace(/every\s+wednesday/gi, "").trim();
      } else if (/every\s+thursday/i.test(title)) {
        recurring = { type: "custom", weekdays: [4] };
        title = title.replace(/every\s+thursday/gi, "").trim();
      } else if (/every\s+friday/i.test(title)) {
        recurring = { type: "custom", weekdays: [5] };
        title = title.replace(/every\s+friday/gi, "").trim();
      } else if (/every\s+day|daily/i.test(lower)) {
        recurring = { type: "daily" };
        title = title.replace(/every\s+day|daily/gi, "").trim();
      } else if (/every\s+week|weekly/i.test(lower)) {
        recurring = { type: "weekly" };
        title = title.replace(/every\s+week|weekly/gi, "").trim();
      } else if (/every\s+month|monthly/i.test(lower)) {
        recurring = { type: "monthly" };
        title = title.replace(/every\s+month|monthly/gi, "").trim();
      }

      // Time: at 5pm, at 9am
      const timeMatch = title.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ampm = (timeMatch[3] || "").toLowerCase();
        if (ampm === "pm" && h < 12) h += 12;
        if (ampm === "am" && h === 12) h = 0;
        if (!dueDate) dueDate = new Date(now);
        dueDate.setHours(h, m, 0, 0);
        reminderAt = new Date(dueDate);
        title = title.replace(timeMatch[0], "").trim();
      }

      // Dates
      if (/\btomorrow\b/i.test(title)) {
        dueDate = addDays(now, 1);
        title = title.replace(/\btomorrow\b/gi, "").trim();
      } else if (/\bnext\s+week\b/i.test(title)) {
        dueDate = addDays(now, 7);
        title = title.replace(/\bnext\s+week\b/gi, "").trim();
      } else if (/\btoday\b/i.test(title)) {
        dueDate = startOfDay(now);
        title = title.replace(/\btoday\b/gi, "").trim();
      }

      if (dueDate && !reminderAt) {
        dueDate.setHours(23, 59, 0, 0);
      }

      return {
        title: title.replace(/\s+/g, " ").trim() || "Untitled task",
        dueDate: dueDate ? dueDate.toISOString() : null,
        reminderAt: reminderAt ? reminderAt.toISOString() : null,
        recurring,
      };
    },
  };

  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return startOfDay(r);
  }

  function startOfDay(d) {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatDateTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  /* ============================================================
     TASK CRUD
     ============================================================ */
  function createTask(data) {
    const order = state.tasks.length;
    const task = {
      id: uid(),
      title: data.title,
      notes: data.notes || "",
      completed: false,
      completedAt: null,
      priority: data.priority || "medium",
      projectId: data.projectId || "inbox",
      tags: data.tags || [],
      subtasks: data.subtasks || [],
      dueDate: data.dueDate || null,
      reminderAt: data.reminderAt || null,
      recurring: data.recurring || null,
      energy: data.energy || "",
      important: !!data.important,
      order,
      createdAt: new Date().toISOString(),
    };
    state.tasks.push(task);
    saveState();
    scheduleReminder(task);
    return task;
  }

  function updateTask(id, updates) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    Object.assign(t, updates);
    saveState();
    scheduleReminder(t);
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveState();
  }

  function completeTask(id, completed = true) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;

    if (completed && !t.completed) {
      t.completed = true;
      t.completedAt = new Date().toISOString();
      Gamification.onTaskComplete(t);
      handleRecurring(t);
      launchConfetti();
    } else if (!completed && t.completed) {
      t.completed = false;
      t.completedAt = null;
    }
    saveState();
    render();
  }

  function handleRecurring(task) {
    if (!task.recurring) return;
    const next = { ...task, id: uid(), completed: false, completedAt: null, order: state.tasks.length };
    const due = task.dueDate ? new Date(task.dueDate) : new Date();
    if (task.recurring.type === "daily") due.setDate(due.getDate() + 1);
    else if (task.recurring.type === "weekly") due.setDate(due.getDate() + 7);
    else if (task.recurring.type === "monthly") due.setMonth(due.getMonth() + 1);
    else if (task.recurring.type === "custom" && task.recurring.weekdays?.length) {
      due.setDate(due.getDate() + 1);
      while (!task.recurring.weekdays.includes(due.getDay())) {
        due.setDate(due.getDate() + 1);
      }
    }
    next.dueDate = due.toISOString();
    state.tasks.push(next);
  }

  function quickAdd(text) {
    if (!text.trim()) return;
    const parsed = SmartParser.parse(text);
    let priority = "medium";
    if (/\burgent\b/i.test(text)) priority = "urgent";
    else if (/\bhigh\b/i.test(text)) priority = "high";
    else if (/\blow\b/i.test(text)) priority = "low";

    let energy = "";
    if (/\bdeep\s*focus\b/i.test(text)) energy = "deep";
    else if (/\bquick\s*win\b/i.test(text)) energy = "quick";
    else if (/\blow\s*energy\b/i.test(text)) energy = "low";
    else if (/\bcreative\b/i.test(text)) energy = "creative";
    else if (/\badmin\b/i.test(text)) energy = "admin";

    createTask({
      title: parsed.title,
      dueDate: parsed.dueDate,
      reminderAt: parsed.reminderAt,
      recurring: parsed.recurring,
      priority,
      energy,
      projectId: currentProjectFilter || "inbox",
    });
    render();
  }

  /* ============================================================
     FILTERS & VIEWS
     ============================================================ */
  function getFilteredTasks() {
    const now = new Date();
    const today = startOfDay(now);
    let list = [...state.tasks];

    const search = ($("#search-input")?.value || "").toLowerCase();
    const priorityFilter = $("#filter-priority")?.value || "";
    const energyFilter = $("#filter-energy")?.value || "";

    if (search) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.notes.toLowerCase().includes(search) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }
    if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter);
    if (energyFilter) list = list.filter((t) => t.energy === energyFilter);
    if (currentProjectFilter) list = list.filter((t) => t.projectId === currentProjectFilter);

    switch (currentView) {
      case "today":
        list = list.filter((t) => !t.completed && t.dueDate && isSameDay(new Date(t.dueDate), today));
        break;
      case "upcoming":
        list = list.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) > today);
        break;
      case "completed":
        list = list.filter((t) => t.completed);
        break;
      case "important":
        list = list.filter((t) => !t.completed && t.important);
        break;
      case "overdue":
        list = list.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < today);
        break;
      case "all":
        list = list.filter((t) => !t.completed);
        break;
      default:
        if (["dashboard", "calendar", "focus", "review", "projects"].includes(currentView)) {
          list = list.filter((t) => !t.completed);
        }
    }

    list.sort((a, b) => a.order - b.order);
    return list;
  }

  /* ============================================================
     GAMIFICATION
     ============================================================ */
  const Gamification = {
    addXP(amount) {
      const g = state.gamification;
      const prevLevel = g.level;
      g.xp += amount;
      while (g.xp >= XP_PER_LEVEL * g.level) {
        g.xp -= XP_PER_LEVEL * g.level;
        g.level += 1;
      }
      if (g.level > prevLevel) showLevelUp(g.level);
      updateStreak();
      updateDailyScore();
      saveState();
      renderGamificationUI();
    },

    onTaskComplete(task) {
      const g = state.gamification;
      g.stats.totalCompleted += 1;
      let xp = XP_PER_TASK + (XP_PRIORITY_BONUS[task.priority] || 0);
      this.addXP(xp);
      this.checkAchievements(task);
    },

    checkAchievements(task) {
      const g = state.gamification;
      const unlocked = g.achievements;
      const unlock = (id) => {
        if (!unlocked.includes(id)) {
          unlocked.push(id);
          const def = ACHIEVEMENTS_DEF.find((a) => a.id === id);
          if (def) showAchievement(def);
        }
      };

      if (g.stats.totalCompleted >= 1) unlock("first_task");
      if (g.stats.totalCompleted >= 50) unlock("task_destroyer");
      if (g.streak.daily >= 7) unlock("streak_7");
      if (g.stats.pomodorosToday >= 5) unlock("focus_champion");
      const hour = new Date().getHours();
      if (hour < 9) unlock("early_bird");

      const todayTasks = state.tasks.filter(
        (t) => t.dueDate && isSameDay(new Date(t.dueDate), new Date()) && !t.completed
      );
      const todayDone = state.tasks.filter(
        (t) => t.completed && t.completedAt && isSameDay(new Date(t.completedAt), new Date())
      );
      if (todayTasks.length === 0 && todayDone.length > 0) unlock("daily_all");

      const todayKey = todayKeyStr();
      if ((g.stats.dailyScores[todayKey] || 0) >= 80) unlock("productivity_master");
    },
  };

  function updateStreak() {
    const g = state.gamification;
    const today = todayKeyStr();
    if (g.streak.lastDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    if (g.streak.lastDate === yKey) g.streak.daily += 1;
    else g.streak.daily = 1;
    g.streak.lastDate = today;
  }

  function updateDailyScore() {
    const g = state.gamification;
    const key = todayKeyStr();
    const completedToday = state.tasks.filter(
      (t) => t.completed && t.completedAt && isSameDay(new Date(t.completedAt), new Date())
    ).length;
    const dueToday = state.tasks.filter(
      (t) => t.dueDate && isSameDay(new Date(t.dueDate), new Date())
    ).length;
    const score = dueToday > 0 ? Math.min(100, Math.round((completedToday / dueToday) * 100)) : completedToday * 10;
    g.stats.dailyScores[key] = Math.min(100, (g.stats.dailyScores[key] || 0) + score * 0.3 + 10);
  }

  function getProductivityScore() {
    const key = todayKeyStr();
    return Math.round(state.gamification.stats.dailyScores[key] || 0);
  }

  function todayKeyStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function showAchievement(def) {
    const toast = $("#achievement-toast");
    $("#achievement-title").textContent = def.title;
    $("#achievement-desc").textContent = def.desc;
    toast.querySelector(".achievement-icon").textContent = def.icon;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 4000);
  }

  function closeLevelUp() {
    $("#levelup-overlay").hidden = true;
  }

  function showLevelUp(level) {
    const overlay = $("#levelup-overlay");
    $("#levelup-number").textContent = "Level " + level;
    overlay.hidden = false;
    launchConfetti();
  }

  function launchConfetti() {
    const canvas = $("#confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      r: Math.random() * 6 + 4,
      c: ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"][Math.floor(Math.random() * 5)],
      vy: Math.random() * 4 + 2,
      vx: Math.random() * 2 - 1,
    }));
    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      frame++;
      if (frame < 90) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
  }

  /* ============================================================
     REMINDERS & NOTIFICATIONS
     ============================================================ */
  const reminderTimers = new Map();

  function scheduleReminder(task) {
    if (reminderTimers.has(task.id)) {
      clearTimeout(reminderTimers.get(task.id));
      reminderTimers.delete(task.id);
    }
    if (!task.reminderAt || task.completed) return;
    const ms = new Date(task.reminderAt).getTime() - Date.now();
    if (ms <= 0) return;
    const timer = setTimeout(() => showNotification(task), ms);
    reminderTimers.set(task.id, timer);
  }

  function showNotification(task) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      const n = new Notification("FlowTask Reminder", {
        body: task.title,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
      });
      n.onclick = () => {
        openTaskModal(task.id);
        window.focus();
      };
    }
    snoozeTaskId = task.id;
    $("#snooze-modal").hidden = false;
  }

  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  function initReminders() {
    state.tasks.forEach(scheduleReminder);
  }

  /* ============================================================
     POMODORO
     ============================================================ */
  function updatePomoUI() {
    const m = Math.floor(pomo.secondsLeft / 60);
    const s = pomo.secondsLeft % 60;
    $("#pomodoro-time").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const total = pomo.isBreak ? POMO_BREAK : POMO_WORK;
    const progress = ((total - pomo.secondsLeft) / total) * 100;
    $("#pomodoro-ring").style.setProperty("--pomo-progress", progress + "%");
    $("#pomo-mode-label").textContent = pomo.isBreak ? "Break time" : "Work session";
    $("#pomo-sessions").textContent = pomo.sessionsToday;
  }

  function startPomo() {
    if (pomo.running) return;
    pomo.running = true;
    $("#pomo-start").hidden = true;
    $("#pomo-pause").hidden = false;
    pomo.interval = setInterval(() => {
      pomo.secondsLeft--;
      updatePomoUI();
      if (pomo.secondsLeft <= 0) {
        clearInterval(pomo.interval);
        pomo.running = false;
        if (!pomo.isBreak) {
          pomo.sessionsToday++;
          state.gamification.stats.pomodorosToday++;
          state.gamification.stats.focusMinutes += 25;
          state.gamification.stats.lastPomoDate = todayKeyStr();
          Gamification.addXP(30);
          Gamification.checkAchievements({});
          pomo.isBreak = true;
          pomo.secondsLeft = POMO_BREAK;
          $("#pomo-start").hidden = false;
          $("#pomo-pause").hidden = true;
        } else {
          pomo.isBreak = false;
          pomo.secondsLeft = POMO_WORK;
        }
        saveState();
        updatePomoUI();
        renderDashboard();
      }
    }, 1000);
  }

  function pausePomo() {
    clearInterval(pomo.interval);
    pomo.running = false;
    $("#pomo-start").hidden = false;
    $("#pomo-pause").hidden = true;
  }

  function resetPomo() {
    pausePomo();
    pomo.isBreak = false;
    pomo.secondsLeft = POMO_WORK;
    updatePomoUI();
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function $(sel) {
    return document.querySelector(sel);
  }

  function render() {
    renderGamificationUI();
    renderMotivation();
    renderSidebarProjects();
    renderViewPanels();
    renderTaskList();
    renderDashboard();
    renderCalendar();
    renderFocusSelect();
    renderWeeklyReview();
    renderAchievements();
    if (currentView === "projects") renderProjects();
    applyTheme();
  }

  function renderGamificationUI() {
    const g = state.gamification;
    $("#user-level").textContent = g.level;
    $("#user-xp-text").textContent = g.xp + " XP";
    const pct = (g.xp / (XP_PER_LEVEL * g.level)) * 100;
    $("#xp-bar-fill").style.width = pct + "%";
    $("#daily-streak").textContent = g.streak.daily;
    $("#productivity-score").textContent = getProductivityScore();
  }

  function renderMotivation() {
    const g = state.gamification;
    const hour = new Date().getHours();
    let pool = hour < 12 ? MOTIVATIONS.morning : hour < 17 ? MOTIVATIONS.afternoon : MOTIVATIONS.evening;
    if (g.streak.daily >= 3) pool = MOTIVATIONS.streak;
    if (getProductivityScore() >= 60) pool = MOTIVATIONS.highScore;
  if (getFilteredTasks().length === 0 && currentView !== "dashboard") pool = MOTIVATIONS.low;
    $("#motivation-text").textContent = pool[Math.floor(Math.random() * pool.length)];
  }

  function renderSidebarProjects() {
    const ul = $("#project-list");
    ul.innerHTML = state.projects
      .map(
        (p) => `
      <li>
        <button type="button" data-project="${p.id}" class="${currentProjectFilter === p.id ? "active" : ""}">
          <span class="project-dot" style="background:${p.color}"></span>
          ${escapeHtml(p.name)}
        </button>
      </li>`
      )
      .join("");
    ul.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentProjectFilter = currentProjectFilter === btn.dataset.project ? null : btn.dataset.project;
        if (currentView === "projects") setView("all");
        render();
      });
    });
  }

  const VIEW_TITLES = {
    dashboard: "Dashboard",
    today: "Today",
    upcoming: "Upcoming",
    important: "Important",
    overdue: "Overdue",
    completed: "Completed",
    projects: "Projects",
    all: "All Tasks",
    calendar: "Calendar",
    focus: "Focus Mode",
    review: "Weekly Review",
  };

  function setView(view) {
    currentView = view;
    state.preferences.lastView = view;
    saveState();
    document.querySelectorAll(".nav-item").forEach((n) => {
      n.classList.toggle("active", n.dataset.view === view);
    });
    $("#view-title").textContent = VIEW_TITLES[view] || "Tasks";
    render();
    closeSidebar();
  }

  function renderViewPanels() {
    const taskViews = ["today", "upcoming", "important", "overdue", "completed", "all"];
    $("#panel-dashboard").hidden = currentView !== "dashboard";
    $("#panel-tasks").hidden = !taskViews.includes(currentView);
    $("#panel-projects").hidden = currentView !== "projects";
    $("#panel-calendar").hidden = currentView !== "calendar";
    $("#panel-focus").hidden = currentView !== "focus";
    $("#panel-review").hidden = currentView !== "review";

    const overdue = state.tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < startOfDay(new Date())
    );
    $("#overdue-banner").hidden = currentView !== "overdue" || overdue.length === 0;
  }

  function renderTaskList() {
    const list = $("#task-list");
    const tasks = getFilteredTasks();
    const empty = $("#empty-state");
    const panel = $("#panel-tasks");

    if (panel.hidden) return;

    if (tasks.length === 0) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    list.innerHTML = tasks
      .map((task) => {
        const subDone = task.subtasks.filter((s) => s.done).length;
        const subTotal = task.subtasks.length;
        const subPct = subTotal ? (subDone / subTotal) * 100 : 0;
        return `
        <li class="task-card ${task.completed ? "completed" : ""}" draggable="true" data-id="${task.id}">
          <div class="task-check ${task.completed ? "checked" : ""}" data-action="toggle" data-id="${task.id}" role="checkbox" aria-checked="${task.completed}">
            <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="task-body">
            <div class="task-title" data-action="edit" data-id="${task.id}">${escapeHtml(task.title)}</div>
            <div class="task-meta">
              <span class="priority-pill priority-${task.priority}">${task.priority}</span>
              ${task.important ? '<span class="tag">⭐ important</span>' : ""}
              ${task.dueDate ? `<span class="tag">📅 ${formatDate(task.dueDate)}</span>` : ""}
              ${task.energy ? `<span class="energy-pill">${task.energy}</span>` : ""}
              ${task.tags.map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}
              ${task.recurring ? `<span class="tag">🔁 ${task.recurring.type}</span>` : ""}
            </div>
            ${
              subTotal
                ? `<div class="subtasks-preview">${subDone}/${subTotal} subtasks<div class="subtask-bar"><div class="subtask-bar-fill" style="width:${subPct}%"></div></div></div>`
                : ""
            }
            ${task.notes ? `<p class="subtasks-preview">${escapeHtml(task.notes.slice(0, 80))}${task.notes.length > 80 ? "…" : ""}</p>` : ""}
          </div>
          <div class="task-actions">
            <button data-action="edit" data-id="${task.id}" title="Edit">✏️</button>
            <button data-action="delete" data-id="${task.id}" title="Delete">🗑️</button>
          </div>
        </li>`;
      })
      .join("");

    bindTaskEvents(list);
  }

  function bindTaskEvents(list) {
    list.querySelectorAll("[data-action='toggle']").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        const t = state.tasks.find((x) => x.id === id);
        completeTask(id, !t.completed);
      });
    });
    list.querySelectorAll("[data-action='edit']").forEach((el) => {
      el.addEventListener("click", () => openTaskModal(el.dataset.id));
    });
    list.querySelectorAll("[data-action='delete']").forEach((el) => {
      el.addEventListener("click", () => {
        if (confirm("Delete this task?")) {
          deleteTask(el.dataset.id);
          render();
        }
      });
    });

    list.querySelectorAll(".task-card").forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        dragTaskId = card.dataset.id;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        dragTaskId = null;
      });
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        card.classList.add("drag-over");
      });
      card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        const targetId = card.dataset.id;
        if (!dragTaskId || dragTaskId === targetId) return;
        reorderTasks(dragTaskId, targetId);
      });
    });
  }

  function reorderTasks(dragId, targetId) {
    const tasks = state.tasks.filter((t) => !t.completed || currentView === "completed");
    const from = tasks.findIndex((t) => t.id === dragId);
    const to = tasks.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = tasks.splice(from, 1);
    tasks.splice(to, 0, moved);
    tasks.forEach((t, i) => {
      const full = state.tasks.find((x) => x.id === t.id);
      if (full) full.order = i;
    });
    saveState();
    renderTaskList();
  }

  function renderDashboard() {
    const today = startOfDay(new Date());
    const completedToday = state.tasks.filter(
      (t) => t.completed && t.completedAt && isSameDay(new Date(t.completedAt), today)
    );
    const dueToday = state.tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), today) && !t.completed);
    $("#stat-completed-today").textContent = completedToday.length;
    $("#stat-remaining-today").textContent = dueToday.length;
    $("#stat-focus-time").textContent = state.gamification.stats.focusMinutes + "m";
    $("#stat-daily-score").textContent = getProductivityScore();

    const upcoming = state.tasks
      .filter((t) => !t.completed && t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
    $("#dashboard-upcoming").innerHTML =
      upcoming.length === 0
        ? "<li>No upcoming tasks</li>"
        : upcoming.map((t) => `<li>${escapeHtml(t.title)} — ${formatDate(t.dueDate)}</li>`).join("");

    const remaining = state.tasks.filter((t) => !t.completed).length;
    $("#daily-review-text").textContent = `You completed ${completedToday.length} tasks today with ${remaining} still open. Focus score: ${getProductivityScore()}/100. Keep building momentum!`;
  }

  function renderAchievements() {
    const unlocked = state.gamification.achievements;
    $("#achievement-badges").innerHTML = ACHIEVEMENTS_DEF.map((a) => {
      const has = unlocked.includes(a.id);
      return `<span class="badge ${has ? "" : "locked"}" title="${escapeHtml(a.desc)}">${a.icon} ${a.title}</span>`;
    }).join("");
  }

  function renderProjects() {
    const grid = $("#projects-grid");
    grid.innerHTML = state.projects
      .map((p) => {
        const count = state.tasks.filter((t) => t.projectId === p.id && !t.completed).length;
        return `
        <div class="project-card glass-card" data-project="${p.id}">
          <span class="project-dot" style="background:${p.color};width:12px;height:12px;display:inline-block;border-radius:50%;margin-bottom:8px;"></span>
          <h3>${escapeHtml(p.name)}</h3>
          <p>${count} active tasks</p>
        </div>`;
      })
      .join("");
    grid.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("click", () => {
        currentProjectFilter = card.dataset.project;
        setView("all");
      });
    });
  }

  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    $("#cal-month-label").textContent = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const grid = $("#calendar-grid");
    grid.innerHTML = "";

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayTasks = state.tasks.filter(
        (t) => t.dueDate && t.dueDate.slice(0, 10) === iso && !t.completed
      );
      const cell = document.createElement("div");
      cell.className = "cal-day" + (d.getMonth() !== month ? " other-month" : "") + (isSameDay(d, new Date()) ? " today" : "");
      cell.dataset.date = iso;
      cell.innerHTML = `<div class="cal-day-num">${d.getDate()}</div>${dayTasks
        .slice(0, 2)
        .map((t) => `<div class="cal-task-dot" draggable="true" data-task-id="${t.id}">${escapeHtml(t.title.slice(0, 12))}</div>`)
        .join("")}`;
      cell.addEventListener("dragover", (e) => {
        e.preventDefault();
        cell.classList.add("drag-over");
      });
      cell.addEventListener("dragleave", () => cell.classList.remove("drag-over"));
      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        cell.classList.remove("drag-over");
        if (dragTaskId) {
          updateTask(dragTaskId, { dueDate: new Date(iso + "T12:00:00").toISOString() });
          render();
        }
      });
      grid.appendChild(cell);
    }

    // Weekly planner
    const wp = $("#weekly-planner");
    wp.innerHTML = "";
    const weekStart = startOfDay(new Date());
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      const iso = day.toISOString().slice(0, 10);
      const tasks = state.tasks.filter((t) => t.dueDate?.slice(0, 10) === iso && !t.completed);
      const col = document.createElement("div");
      col.className = "week-col";
      col.innerHTML = `<h4>${day.toLocaleDateString(undefined, { weekday: "short" })}</h4>${tasks.map((t) => `<div>${escapeHtml(t.title.slice(0, 14))}</div>`).join("") || "—"}`;
      wp.appendChild(col);
    }

    grid.querySelectorAll(".cal-task-dot").forEach((dot) => {
      dot.addEventListener("dragstart", (e) => {
        dragTaskId = dot.dataset.taskId;
        e.stopPropagation();
      });
    });
  }

  function renderFocusSelect() {
    const sel = $("#focus-task-select");
    const open = state.tasks.filter((t) => !t.completed);
    sel.innerHTML = '<option value="">Select a task…</option>' + open.map((t) => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join("");
    sel.onchange = () => {
      const t = state.tasks.find((x) => x.id === sel.value);
      $("#focus-task-title").textContent = t ? t.title : "Pick a task to begin";
    };
  }

  function renderWeeklyReview() {
    const g = state.gamification;
    $("#review-streak").textContent = g.streak.daily;
    $("#review-weekly-streak").textContent = g.streak.weekly;

    const scores = g.stats.dailyScores;
    const keys = Object.keys(scores).sort().slice(-7);
    let bestDay = "—";
    let max = 0;
    keys.forEach((k) => {
      if (scores[k] > max) {
        max = scores[k];
        bestDay = new Date(k).toLocaleDateString(undefined, { weekday: "long" });
      }
    });
    $("#review-best-day").textContent = bestDay;

    const canvas = $("#chart-weekly");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const vals = keys.map((k) => scores[k] || 0);
    const maxV = Math.max(...vals, 1);
    const barW = w / (vals.length + 1);
    vals.forEach((v, i) => {
      const barH = (v / maxV) * (h - 30);
      const x = (i + 0.5) * barW;
      const grad = ctx.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, "#7c3aed");
      grad.addColorStop(1, "#3b82f6");
      ctx.fillStyle = grad;
      ctx.fillRect(x, h - barH - 20, barW * 0.6, barH);
    });

    const completedWeek = state.tasks.filter((t) => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length;

    $("#review-insights").innerHTML = `
      <li>${completedWeek} tasks completed this week</li>
      <li>Average daily score: ${keys.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0}</li>
      <li>${state.tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length} overdue tasks need attention</li>
      <li>Total XP earned: ${g.xp + (g.level - 1) * XP_PER_LEVEL}</li>
    `;
  }

  /* ============================================================
     MODAL
     ============================================================ */
  function openTaskModal(id) {
    editingTaskId = id || null;
    const modal = $("#task-modal");
    const form = $("#task-form");
    $("#task-project").innerHTML = state.projects.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

    if (id) {
      const t = state.tasks.find((x) => x.id === id);
      if (!t) return;
      $("#modal-title").textContent = "Edit task";
      $("#task-id").value = t.id;
      $("#task-title").value = t.title;
      $("#task-notes").value = t.notes;
      $("#task-priority").value = t.priority;
      $("#task-project").value = t.projectId;
      $("#task-due").value = t.dueDate ? t.dueDate.slice(0, 10) : "";
      $("#task-reminder").value = t.reminderAt ? t.reminderAt.slice(0, 16) : "";
      $("#task-energy").value = t.energy || "";
      $("#task-recurring").value = t.recurring?.type || "";
      $("#task-important").checked = t.important;
      $("#task-tags").value = t.tags.join(", ");
      renderSubtaskEditor(t.subtasks);
      $("#btn-delete-task").hidden = false;
    } else {
      $("#modal-title").textContent = "New task";
      form.reset();
      $("#task-id").value = "";
      renderSubtaskEditor([]);
      $("#btn-delete-task").hidden = true;
    }
    modal.hidden = false;
  }

  function closeTaskModal() {
    $("#task-modal").hidden = true;
    editingTaskId = null;
  }

  function renderSubtaskEditor(subtasks) {
    const ul = $("#subtask-list");
    ul.innerHTML = subtasks
      .map(
        (s, i) => `
      <li>
        <input type="checkbox" ${s.done ? "checked" : ""} data-sub-idx="${i}" class="sub-done" />
        <input type="text" value="${escapeHtml(s.text)}" data-sub-idx="${i}" class="sub-text" />
        <button type="button" data-sub-remove="${i}">×</button>
      </li>`
      )
      .join("");
    ul.querySelectorAll("[data-sub-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        subtasks.splice(parseInt(btn.dataset.subRemove, 10), 1);
        renderSubtaskEditor(subtasks);
      });
    });
    ul._subtasks = subtasks;
  }

  function getSubtasksFromEditor() {
    const ul = $("#subtask-list");
    const subs = ul._subtasks || [];
    ul.querySelectorAll("li").forEach((li, i) => {
      const text = li.querySelector(".sub-text")?.value || "";
      const done = li.querySelector(".sub-done")?.checked || false;
      if (subs[i]) {
        subs[i].text = text;
        subs[i].done = done;
      }
    });
    return subs.filter((s) => s.text.trim());
  }

  /* ============================================================
     THEME
     ============================================================ */
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
  }

  function toggleTheme() {
    state.theme = state.theme === "light" ? "dark" : "light";
    saveState();
    applyTheme();
  }

  function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#sidebar-backdrop").hidden = true;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  /* ============================================================
     EVENT BINDINGS
     ============================================================ */
  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.dataset.view));
    });

    $("#fab-quick-add").addEventListener("click", () => {
      openTaskModal();
    });

    $("#levelup-overlay").addEventListener("click", closeLevelUp);
    $("#levelup-card").addEventListener("click", (e) => e.stopPropagation());

    $("#theme-toggle").addEventListener("click", toggleTheme);

    $("#menu-toggle").addEventListener("click", () => {
      $("#sidebar").classList.add("open");
      $("#sidebar-backdrop").hidden = false;
    });

    $("#sidebar-backdrop").addEventListener("click", closeSidebar);

    $("#search-input").addEventListener("input", renderTaskList);
    $("#filter-priority").addEventListener("change", renderTaskList);
    $("#filter-energy").addEventListener("change", renderTaskList);

    $("#btn-reschedule-overdue").addEventListener("click", () => {
      const today = new Date().toISOString();
      state.tasks.forEach((t) => {
        if (!t.completed && t.dueDate && new Date(t.dueDate) < startOfDay(new Date())) {
          t.dueDate = today;
        }
      });
      saveState();
      render();
    });

    $("#btn-add-project").addEventListener("click", () => {
      const name = prompt("Project name:");
      if (!name) return;
      state.projects.push({ id: uid(), name, color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0") });
      saveState();
      render();
    });

    document.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", closeTaskModal);
    });

    $("#task-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const tags = $("#task-tags").value.split(",").map((t) => t.trim()).filter(Boolean);
      const recurringType = $("#task-recurring").value;
      const data = {
        title: $("#task-title").value,
        notes: $("#task-notes").value,
        priority: $("#task-priority").value,
        projectId: $("#task-project").value,
        dueDate: $("#task-due").value ? new Date($("#task-due").value + "T23:59:00").toISOString() : null,
        reminderAt: $("#task-reminder").value ? new Date($("#task-reminder").value).toISOString() : null,
        energy: $("#task-energy").value,
        important: $("#task-important").checked,
        tags,
        subtasks: getSubtasksFromEditor().map((s) => ({ id: s.id || uid(), text: s.text, done: s.done })),
        recurring: recurringType ? { type: recurringType, weekdays: recurringType === "custom" ? [1] : [] } : null,
      };
      const id = $("#task-id").value;
      if (!id) {
        const parsed = SmartParser.parse(data.title);
        data.title = parsed.title;
        if (!data.dueDate && parsed.dueDate) data.dueDate = parsed.dueDate;
        if (!data.reminderAt && parsed.reminderAt) data.reminderAt = parsed.reminderAt;
        if (!data.recurring && parsed.recurring) data.recurring = parsed.recurring;
      }
      if (id) updateTask(id, data);
      else createTask(data);
      closeTaskModal();
      render();
    });

    $("#btn-delete-task").addEventListener("click", () => {
      if (editingTaskId && confirm("Delete task?")) {
        deleteTask(editingTaskId);
        closeTaskModal();
        render();
      }
    });

    $("#btn-add-subtask").addEventListener("click", () => {
      const ul = $("#subtask-list");
      const subs = ul._subtasks || [];
      subs.push({ id: uid(), text: "", done: false });
      renderSubtaskEditor(subs);
    });

    $("#cal-prev").addEventListener("click", () => {
      calendarMonth.setMonth(calendarMonth.getMonth() - 1);
      renderCalendar();
    });
    $("#cal-next").addEventListener("click", () => {
      calendarMonth.setMonth(calendarMonth.getMonth() + 1);
      renderCalendar();
    });
    $("#cal-today").addEventListener("click", () => {
      calendarMonth = new Date();
      renderCalendar();
    });

    $("#pomo-start").addEventListener("click", startPomo);
    $("#pomo-pause").addEventListener("click", pausePomo);
    $("#pomo-reset").addEventListener("click", resetPomo);

    document.querySelectorAll("[data-close-snooze]").forEach((el) => {
      el.addEventListener("click", () => { $("#snooze-modal").hidden = true; });
    });

    document.querySelectorAll("[data-snooze]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mins = parseInt(btn.dataset.snooze, 10);
        const t = state.tasks.find((x) => x.id === snoozeTaskId);
        if (t) {
          const d = new Date();
          d.setMinutes(d.getMinutes() + mins);
          updateTask(t.id, { reminderAt: d.toISOString() });
        }
        $("#snooze-modal").hidden = true;
        render();
      });
    });

    // Reset pomodoro daily
    const g = state.gamification;
    if (g.stats.lastPomoDate !== todayKeyStr()) {
      g.stats.pomodorosToday = 0;
      pomo.sessionsToday = 0;
      saveState();
    } else {
      pomo.sessionsToday = g.stats.pomodorosToday;
    }
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    applyTheme();
    bindEvents();
    initReminders();
    requestNotificationPermission();
    updatePomoUI();
    setView(state.preferences?.lastView || "dashboard");
    renderProjects();

    // Sample tasks on first visit
    if (state.tasks.length === 0) {
      createTask({ title: "Welcome to FlowTask! 🎉", priority: "medium", projectId: "inbox", important: true });
      createTask({ title: "Try: Review project proposal tomorrow at 5pm", priority: "high", dueDate: addDays(new Date(), 1).toISOString() });
      render();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
