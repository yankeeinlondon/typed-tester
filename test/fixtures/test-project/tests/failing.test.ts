import type { Expect, Equal } from "@type-challenges/utils";
import type { TestInterface } from "../src/example";

describe("Failing Tests", () => {
  it("should fail with type mismatch", () => {
    type TestCase = string;
    type Result = Expect<Equal<TestCase, number>>; // This will fail
  });

  it("should fail with interface mismatch", () => {
    type TestCase = TestInterface;
    type Result = Expect<Equal<TestCase, { name: number; value: string }>>; // This will fail
  });

  it("should fail with boolean test", () => {
    type TestCase = true;
    type Result = Expect<Equal<TestCase, false>>; // This will fail
  });
});