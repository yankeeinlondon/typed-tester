import type { Expect, Equal } from "@type-challenges/utils";
import type { TestInterface } from "../src/example";
import { describe, it } from "vitest"

describe("Passing Tests", () => {
  it("should pass basic type check", () => {
    type TestCase = TestInterface;
    type Result = Expect<Equal<TestCase, { name: string; value: number }>>;
  });

  it("should pass string type check", () => {
    type TestCase = string;
    type Result = Expect<Equal<TestCase, string>>;
  });
});
