import * as assert from "node:assert";
import { describe, it } from "node:test";
import { resolveInitialTasks } from "../webview/resolveInitialTasks";
import type { Task } from "../types";

const task = (text: string): Task => ({
  text,
  done: false,
  isExpanded: true,
  subtasks: [],
  note: "",
  isNoteExpanded: false,
});

describe("resolveInitialTasks", () => {
  const key = "file:///projeto-a";

  it("usa servidor quando não há cache local", () => {
    const result = resolveInitialTasks([task("a")], undefined, key);
    assert.strictEqual(result.tasks.length, 1);
    assert.strictEqual(result.shouldSyncToBackend, false);
  });

  it("ignora cache de outro workspace", () => {
    const result = resolveInitialTasks(
      [task("servidor")],
      { workspaceKey: "file:///outro", tasks: [task("local"), task("extra")] },
      key,
    );
    assert.strictEqual(result.tasks[0].text, "servidor");
    assert.strictEqual(result.shouldSyncToBackend, false);
  });

  it("prefere cache local com mais tarefas e sincroniza backend", () => {
    const result = resolveInitialTasks(
      [task("servidor")],
      { workspaceKey: key, tasks: [task("local"), task("nova")] },
      key,
    );
    assert.strictEqual(result.tasks.length, 2);
    assert.strictEqual(result.shouldSyncToBackend, true);
  });

  it("prefere servidor quando tem mais tarefas que o cache", () => {
    const result = resolveInitialTasks(
      [task("a"), task("b"), task("c")],
      { workspaceKey: key, tasks: [task("velha")] },
      key,
    );
    assert.strictEqual(result.tasks.length, 3);
    assert.strictEqual(result.shouldSyncToBackend, false);
  });
});
