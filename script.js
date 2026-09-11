(() => {
  "use strict";

  const STORAGE_KEY = "todo-list.tasks.v1";

  /** @type {{id:string, text:string, done:boolean}[]} */
  let tasks = [];
  let currentFilter = "all"; // all | active | completed

  // ---- DOM references ----
  const form = document.getElementById("addForm");
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");
  const card = document.querySelector(".card");
  const statsText = document.getElementById("statsText");
  const progressFill = document.getElementById("progressFill");
  const clearBtn = document.getElementById("clearBtn");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const dateLine = document.getElementById("dateLine");

  // ---- Persistence ----
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
      tasks = [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // ---- Helpers ----
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function setDateLine() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dateLine.textContent = formatter.format(now);
  }

  // ---- Rendering ----
  function getFilteredTasks() {
    if (currentFilter === "active") return tasks.filter((t) => !t.done);
    if (currentFilter === "completed") return tasks.filter((t) => t.done);
    return tasks;
  }

  function render() {
    list.innerHTML = "";
    const visible = getFilteredTasks();

    visible.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task" + (task.done ? " is-done" : "");
      li.dataset.id = task.id;

      li.innerHTML = `
        <button class="task__checkbox" aria-label="تحديد كمكتملة" type="button">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="task__text"></span>
        <button class="task__delete" aria-label="حذف المهمة" type="button">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>
      `;

      li.querySelector(".task__text").textContent = task.text;
      list.appendChild(li);
    });

    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;

    card.classList.toggle("is-empty", total === 0);

    if (total === 0) {
      statsText.textContent = "لا توجد مهام بعد";
      progressFill.style.width = "0%";
    } else {
      statsText.textContent = `${done} من ${total} مهمة مكتملة`;
      progressFill.style.width = `${Math.round((done / total) * 100)}%`;
    }

    clearBtn.disabled = done === 0;
  }

  // ---- Actions ----
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    tasks.unshift({ id: uid(), text: trimmed, done: false });
    saveTasks();
    render();

    // تركيز حركي بسيط على أول عنصر بعد الإضافة
    const firstItem = list.querySelector(".task");
    if (firstItem) {
      firstItem.style.animation = "none";
      // إعادة تشغيل الأنيميشن
      void firstItem.offsetWidth;
      firstItem.style.animation = "";
    }
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = !task.done;
    saveTasks();
    render();
  }

  function removeTask(id, liElement) {
    if (!liElement) {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
      return;
    }

    liElement.classList.add("is-removing");
    liElement.addEventListener(
      "animationend",
      () => {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        render();
      },
      { once: true }
    );
  }

  function clearCompleted() {
    const completedItems = [...list.querySelectorAll(".task.is-done")];

    if (completedItems.length === 0) return;

    let remaining = completedItems.length;
    completedItems.forEach((li) => {
      li.classList.add("is-removing");
      li.addEventListener(
        "animationend",
        () => {
          remaining -= 1;
          if (remaining === 0) {
            tasks = tasks.filter((t) => !t.done);
            saveTasks();
            render();
          }
        },
        { once: true }
      );
    });
  }

  // ---- Event listeners ----
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask(input.value);
    input.value = "";
    input.focus();
  });

  list.addEventListener("click", (e) => {
    const li = e.target.closest(".task");
    if (!li) return;
    const id = li.dataset.id;

    if (e.target.closest(".task__checkbox")) {
      toggleTask(id);
    } else if (e.target.closest(".task__delete")) {
      removeTask(id, li);
    }
  });

  clearBtn.addEventListener("click", clearCompleted);

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // ---- Init ----
  loadTasks();
  setDateLine();
  render();
})();
