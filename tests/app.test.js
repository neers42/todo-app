import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, loadApp, readStoredTodos, seedTodos } from "./helpers.js";

beforeEach(async () => {
  localStorage.clear();
  await loadApp();
});

function addTodoViaForm(text, due = "") {
  document.getElementById("todo-input").value = text;
  document.getElementById("todo-due").value = due;
  fireEvent(document.getElementById("todo-form"), "submit");
}

function items() {
  return Array.from(document.querySelectorAll(".todo-item"));
}

describe("initial state", () => {
  it("shows the empty state and no summary when there are no todos", () => {
    expect(document.getElementById("empty-state").hidden).toBe(false);
    expect(document.getElementById("summary").textContent).toBe("");
    expect(items()).toHaveLength(0);
  });

  it("restores todos previously saved in localStorage", async () => {
    seedTodos([
      { id: "1", text: "既存タスク", due: null, completed: false, createdAt: 1 },
    ]);
    await loadApp();

    expect(items()).toHaveLength(1);
    expect(items()[0].querySelector(".todo-text").textContent).toBe("既存タスク");
  });
});

describe("adding todos", () => {
  it("adds a todo on form submit and clears the input", () => {
    addTodoViaForm("牛乳を買う");

    expect(items()).toHaveLength(1);
    expect(items()[0].querySelector(".todo-text").textContent).toBe("牛乳を買う");
    expect(document.getElementById("todo-input").value).toBe("");
    expect(readStoredTodos()).toHaveLength(1);
  });

  it("ignores blank or whitespace-only input", () => {
    addTodoViaForm("   ");

    expect(items()).toHaveLength(0);
    expect(readStoredTodos()).toHaveLength(0);
  });

  it("shows a formatted due date label when a due date is set", () => {
    addTodoViaForm("レポート提出", "2026-09-03");

    const label = items()[0].querySelector(".todo-due-label");
    expect(label).not.toBeNull();
    expect(label.textContent).toBe("09/03");
    expect(label.classList.contains("overdue")).toBe(false);
  });

  it("marks a due date in the past as overdue", () => {
    addTodoViaForm("期限切れタスク", "2020-01-01");

    const label = items()[0].querySelector(".todo-due-label");
    expect(label.classList.contains("overdue")).toBe(true);
  });

  it("adds new todos to the top of the list", () => {
    addTodoViaForm("最初のタスク");
    addTodoViaForm("次のタスク");

    expect(items().map((li) => li.querySelector(".todo-text").textContent)).toEqual([
      "次のタスク",
      "最初のタスク",
    ]);
  });
});

describe("toggling completion", () => {
  it("marks a todo completed when its checkbox is checked", () => {
    addTodoViaForm("洗濯する");
    const checkbox = items()[0].querySelector(".todo-checkbox");

    checkbox.checked = true;
    fireEvent(checkbox, "change");

    expect(items()[0].classList.contains("completed")).toBe(true);
    expect(readStoredTodos()[0].completed).toBe(true);
  });

  it("updates the summary count of active todos", () => {
    addTodoViaForm("タスクA");
    addTodoViaForm("タスクB");
    const checkbox = items()[0].querySelector(".todo-checkbox");

    checkbox.checked = true;
    fireEvent(checkbox, "change");

    expect(document.getElementById("summary").textContent).toBe(
      "1件の未完了タスク（全2件）",
    );
  });
});

describe("deleting todos", () => {
  it("removes a todo from the DOM and storage", () => {
    addTodoViaForm("不要なタスク");
    const deleteBtn = items()[0].querySelector(".todo-delete");

    fireEvent(deleteBtn, "click");

    expect(items()).toHaveLength(0);
    expect(readStoredTodos()).toHaveLength(0);
  });
});

describe("editing todos", () => {
  it("commits a new text on blur after double-click", () => {
    addTodoViaForm("元のテキスト");
    const text = items()[0].querySelector(".todo-text");

    fireEvent(text, "dblclick");
    expect(text.contentEditable).toBe("true");

    text.textContent = "編集後のテキスト";
    fireEvent(text, "blur");

    expect(items()[0].querySelector(".todo-text").textContent).toBe("編集後のテキスト");
    expect(readStoredTodos()[0].text).toBe("編集後のテキスト");
  });

  it("discards the edit when Escape is pressed", () => {
    addTodoViaForm("元のテキスト");
    const text = items()[0].querySelector(".todo-text");

    fireEvent(text, "dblclick");
    text.textContent = "捨てられる編集";
    fireEvent(text, "keydown", { key: "Escape" });

    expect(items()[0].querySelector(".todo-text").textContent).toBe("元のテキスト");
    expect(readStoredTodos()[0].text).toBe("元のテキスト");
  });

  it("keeps the original text when the edit is cleared to blank", () => {
    addTodoViaForm("元のテキスト");
    const text = items()[0].querySelector(".todo-text");

    fireEvent(text, "dblclick");
    text.textContent = "   ";
    fireEvent(text, "blur");

    expect(readStoredTodos()[0].text).toBe("元のテキスト");
  });
});

describe("filtering", () => {
  beforeEach(async () => {
    seedTodos([
      { id: "1", text: "未完了タスク", due: null, completed: false, createdAt: 1 },
      { id: "2", text: "完了済みタスク", due: null, completed: true, createdAt: 2 },
    ]);
    await loadApp();
  });

  function clickFilter(filter) {
    fireEvent(document.querySelector(`.filter-btn[data-filter="${filter}"]`), "click");
  }

  it("shows only active todos under the active filter", () => {
    clickFilter("active");

    const texts = items().map((li) => li.querySelector(".todo-text").textContent);
    expect(texts).toEqual(["未完了タスク"]);
  });

  it("shows only completed todos under the completed filter", () => {
    clickFilter("completed");

    const texts = items().map((li) => li.querySelector(".todo-text").textContent);
    expect(texts).toEqual(["完了済みタスク"]);
  });

  it("shows all todos again when switching back to all", () => {
    clickFilter("completed");
    clickFilter("all");

    expect(items()).toHaveLength(2);
  });

  it("toggles the active class on the clicked filter button", () => {
    clickFilter("active");

    expect(document.querySelector('.filter-btn[data-filter="active"]').classList.contains("active")).toBe(true);
    expect(document.querySelector('.filter-btn[data-filter="all"]').classList.contains("active")).toBe(false);
  });
});

describe("clearing completed todos", () => {
  it("removes only the completed todos", async () => {
    seedTodos([
      { id: "1", text: "未完了タスク", due: null, completed: false, createdAt: 1 },
      { id: "2", text: "完了済みタスク", due: null, completed: true, createdAt: 2 },
    ]);
    await loadApp();

    fireEvent(document.getElementById("clear-completed"), "click");

    const texts = items().map((li) => li.querySelector(".todo-text").textContent);
    expect(texts).toEqual(["未完了タスク"]);
    expect(readStoredTodos()).toHaveLength(1);
  });
});
