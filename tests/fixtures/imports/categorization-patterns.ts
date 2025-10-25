// File with various categorization patterns

// External dependencies
import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual } from "inferred-types/types";
import chalk from "chalk";

// Barrel import (namespace) - peer location
import * as utils from "./utils";

// Named import - peer location
import { helper1, helper2 } from "./helpers";

// Default import - peer location
import MyClass from "./MyClass";

// Hybrid import (default + named) - peer location
import Logger, { type LogLevel, log } from "./logger";

// Alias import (using ~/ path alias)
import { config } from "~/config";

// Parent import (../ one level up)
import { BaseClass } from "../base/BaseClass";

// Child import (./ one level down)
import { ChildComponent } from "./components/Child";

// Deep child import (multiple levels down)
import { DeepUtil } from "./utils/helpers/deep/util";

// Type-only import
import type { Interface1, Interface2 } from "./types";

// Usage to prevent unused import warnings
describe("test", () => {
  it("should work", () => {
    const u = utils;
    const h = helper1;
    const m = new MyClass();
    const l = new Logger();
    const c = config;
    const b = new BaseClass();
    expect(true).toBe(true);
  });
});
