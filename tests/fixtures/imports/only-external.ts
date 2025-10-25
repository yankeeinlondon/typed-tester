// File with only external imports (no internal)

import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual } from "inferred-types/types";
import chalk from "chalk";
import path from "node:path";
import { readFileSync } from "node:fs";

describe("external-only", () => {
  it("should have only external deps", () => {
    const colored = chalk.red("test");
    const p = path.join("a", "b");
    expect(colored).toBeDefined();
    expect(p).toBe("a/b");
  });
});
