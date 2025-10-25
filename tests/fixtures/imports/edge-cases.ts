// File with edge case import patterns

// Side-effect import (no bindings)
import "./polyfills";

// Empty import statement (side-effect)
import "reflect-metadata";

// Dynamic import (should be handled or ignored appropriately)
// Note: This is an expression, not a declaration
const dynamicModule = () => import("./dynamic-module");

// Re-export (not an import)
export { renamedExport } from "./re-exports";

// Type-only default import
import type DefaultType from "./default-type";

// Namespace type import
import type * as Types from "./all-types";

// Very long import with many named bindings
import {
  symbol1,
  symbol2,
  symbol3,
  symbol4,
  symbol5,
  symbol6,
  symbol7,
  symbol8,
  symbol9,
  symbol10
} from "./many-exports";

// Mixed type and value in complex pattern
import {
  type TypeA,
  type TypeB,
  valueA,
  valueB,
  type TypeC,
  valueC
} from "./mixed-complex";

const _unused = dynamicModule;
