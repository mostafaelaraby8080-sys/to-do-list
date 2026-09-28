(() => {
  "use strict";

  const STORAGE_KEY = "todo-list.tasks.v1";

  /** @type {{id:string, text:string, done:boolean, createdAt:number}[]} */
  let tasks = [];
  let currentFilter = "all";

  const form = document.getElementById("addForm");
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");
  const card = document.querySelector(".card");
  const statsText = document.getElementById("statsText");
  const progressFill = document.getElementById("progressFill");
  const progressBar = document.getElementById("progressBar");
  const clearBtn = document.getElementById("clearBtn");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const dateLine = document.getElementById("dateLine");
  const emptyText = document.getElementById("emptyText");
  const metricTotal = document.getElementById("metricTotal");
  const metricActive = document.getElementById("metricActive");
  const metricDone = document.getElementById("metricDone");

  const emptyCopy = {
    all: "لا توجد مهام بعد. أضف أول مهمة لتبدأ يومك.",
    active: "لا توجد مهام قيد التنفيذ. عمل رائع!",
    completed: "لم تكتمل أي مهمة بعد.",
  };

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      tasks = Array.isArray(parsed)
        ? parsed.map((task) => ({
            id: String(task.id),
            text: String(task.text || ""),
            done: Boolean(task.done),
            createdAt: Number(task.createdAt) || Date.now(),
          }))
        : [];
    } catch (e) {
      tasks = [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function setDateLine() {
    const formatter = new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dateLine.textContent = formatter.format(new Date());
  }

  function formatTime(ts) {
    return new Intl.DateTimeFormat("ar-EG", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  }

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
        <span class="task__grip" aria-label="سحب لإعادة الترتيب" title="اسحب لإعادة الترتيب">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <circle cx="5" cy="3.5" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="3.5" r="1.2" fill="currentColor"/>
            <circle cx="5" cy="8" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="8" r="1.2" fill="currentColor"/>
            <circle cx="5" cy="12.5" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="12.5" r="1.2" fill="currentColor"/>
          </svg>
        </span>
        <button class="task__checkbox" aria-label="${task.done ? "إلغاء إكمال المهمة" : "تحديد كمكتملة"}" type="button">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="task__body">
          <span class="task__text"></span>
          <span class="task__meta"></span>
        </div>
        <button class="task__delete" aria-label="حذف المهمة" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>
      `;

      li.querySelector(".task__text").textContent = task.text;
      li.querySelector(".task__meta").textContent = `أُضيفت الساعة ${formatTime(task.createdAt)}`;
      list.appendChild(li);
    });

    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const active = total - done;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    metricTotal.textContent = String(total);
    metricActive.textContent = String(active);
    metricDone.textContent = String(done);

    document.querySelector('[data-count="all"]').textContent = String(total);
    document.querySelector('[data-count="active"]').textContent = String(active);
    document.querySelector('[data-count="completed"]').textContent = String(done);

    const listEmpty = visible.length === 0;
    card.classList.toggle("is-empty", listEmpty);
    emptyText.textContent = emptyCopy[currentFilter];
    document.getElementById("emptyState").hidden = !listEmpty;

    if (total === 0) {
      statsText.textContent = "ابدأ بإضافة أول مهمة";
    } else if (percent === 100) {
      statsText.textContent = "أُنجزت كل المهام";
    } else {
      statsText.textContent = `${percent}% مكتمل · ${active} متبقية`;
    }

    progressFill.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", String(percent));
    clearBtn.disabled = done === 0;
  }

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    tasks.unshift({
      id: uid(),
      text: trimmed,
      done: false,
      createdAt: Date.now(),
    });
    saveTasks();
    render();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = !task.done;
    saveTasks();
    render();
  }

  function updateTaskText(id, text) {
    const task = tasks.find((t) => t.id === id);
    const trimmed = text.trim();
    if (!task || !trimmed) {
      render();
      return;
    }
    task.text = trimmed;
    saveTasks();
    render();
  }

  function startEdit(li) {
    const id = li.dataset.id;
    const task = tasks.find((t) => t.id === id);
    if (!task || li.querySelector(".task__edit")) return;

    const body = li.querySelector(".task__body");
    const current = task.text;
    body.innerHTML = `<input class="task__edit" type="text" maxlength="120" aria-label="تعديل المهمة">`;
    const field = body.querySelector(".task__edit");
    field.value = current;
    field.focus();
    field.select();

    const commit = () => updateTaskText(id, field.value);
    field.addEventListener("blur", commit, { once: true });
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        field.blur();
      }
      if (e.key === "Escape") {
        field.value = current;
        field.blur();
      }
    });
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
    if (completedItems.length === 0) {
      tasks = tasks.filter((t) => !t.done);
      saveTasks();
      render();
      return;
    }

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

  list.addEventListener("dblclick", (e) => {
    const text = e.target.closest(".task__text");
    if (!text) return;
    startEdit(text.closest(".task"));
  });

  function persistOrderFromDom() {
    const visibleIds = [...list.querySelectorAll(".task")].map((el) => el.dataset.id);
    const visibleSet = new Set(visibleIds);
    let i = 0;
    tasks = tasks.map((task) => {
      if (!visibleSet.has(task.id)) return task;
      const moved = tasks.find((item) => item.id === visibleIds[i]);
      i += 1;
      return moved;
    });
    saveTasks();
  }

  list.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const li = e.target.closest(".task");
    if (!li || e.target.closest("button, input") || li.querySelector(".task__edit")) return;

    const startY = e.clientY;
    let didMove = false;

    const onMove = (ev) => {
      if (Math.abs(ev.clientY - startY) < 6 && !didMove) return;
      if (!didMove) {
        didMove = true;
        li.classList.add("is-dragging");
        list.classList.add("is-sorting");
        li.setPointerCapture(ev.pointerId);
      }

      const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".task");
      if (!over || over === li || !list.contains(over)) return;
      const rect = over.getBoundingClientRect();
      if (ev.clientY > rect.top + rect.height / 2) over.after(li);
      else over.before(li);
    };

    const onUp = () => {
      list.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!didMove) return;
      li.classList.remove("is-dragging");
      list.classList.remove("is-sorting");
      persistOrderFromDom();
    };

    list.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });

  clearBtn.addEventListener("click", clearCompleted);

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  loadTasks();
  setDateLine();
  render();
})();
