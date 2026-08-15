(() => {
  const STORAGE_KEY = "todo-app.todos";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const dueInput = document.getElementById("todo-due");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");
  const summary = document.getElementById("summary");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const clearCompletedBtn = document.getElementById("clear-completed");

  let todos = loadTodos();
  let currentFilter = "all";

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function isOverdue(todo) {
    if (!todo.due || todo.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(todo.due) < today;
  }

  function formatDue(dateStr) {
    const [y, m, d] = dateStr.split("-");
    return `${m}/${d}`;
  }

  function getFiltered() {
    if (currentFilter === "active") return todos.filter((t) => !t.completed);
    if (currentFilter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }

  function render() {
    list.innerHTML = "";
    const filtered = getFiltered();

    emptyState.hidden = filtered.length !== 0;

    filtered.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.completed ? " completed" : "");
      li.dataset.id = todo.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.completed;
      checkbox.addEventListener("change", () => toggleTodo(todo.id));

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;
      text.addEventListener("dblclick", () => startEdit(text, todo.id));

      li.appendChild(checkbox);
      li.appendChild(text);

      if (todo.due) {
        const dueLabel = document.createElement("span");
        dueLabel.className = "todo-due-label" + (isOverdue(todo) ? " overdue" : "");
        dueLabel.textContent = formatDue(todo.due);
        li.appendChild(dueLabel);
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "todo-delete";
      deleteBtn.textContent = "✕";
      deleteBtn.setAttribute("aria-label", "削除");
      deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

      li.appendChild(deleteBtn);
      list.appendChild(li);
    });

    const activeCount = todos.filter((t) => !t.completed).length;
    summary.textContent = todos.length
      ? `${activeCount}件の未完了タスク（全${todos.length}件）`
      : "";
  }

  function startEdit(span, id) {
    span.contentEditable = "true";
    span.focus();
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const commit = () => {
      span.contentEditable = "false";
      const newText = span.textContent.trim();
      if (newText) {
        editTodo(id, newText);
      } else {
        render();
      }
    };

    span.addEventListener("blur", commit, { once: true });
    span.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        span.blur();
      } else if (e.key === "Escape") {
        span.textContent = todos.find((t) => t.id === id).text;
        span.blur();
      }
    });
  }

  function addTodo(text, due) {
    todos.unshift({
      id: uid(),
      text,
      due: due || null,
      completed: false,
      createdAt: Date.now(),
    });
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (todo) todo.completed = !todo.completed;
    saveTodos();
    render();
  }

  function editTodo(id, newText) {
    const todo = todos.find((t) => t.id === id);
    if (todo) todo.text = newText;
    saveTodos();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.completed);
    saveTodos();
    render();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTodo(text, dueInput.value);
    input.value = "";
    dueInput.value = "";
    input.focus();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);

  render();
})();
