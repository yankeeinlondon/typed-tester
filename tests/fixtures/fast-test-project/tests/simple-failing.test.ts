import type { Expect, Equal } from "@type-challenges/utils";
import type { UserInterface, IsString } from "../src/complex-types";

// Type tests that should intentionally fail for testing failure scenarios
describe("Type tests that should fail", () => {
  it("should fail when comparing string to number", () => {
    // This should fail because string is not equal to number
    type TestStringIsNumber = Expect<Equal<string, number>>;
  });

  it("should fail when interface structure is wrong", () => {
    // This should fail because UserInterface has required fields, not optional
    type TestWrongInterface = Expect<Equal<
      UserInterface,
      { id?: string; name?: string; email?: string; age?: number }
    >>;
  });

  it("should fail when conditional type expectation is wrong", () => {
    // This should fail because IsString<number> returns false, not true
    type TestWrongConditional = Expect<Equal<IsString<number>, true>>;
  });
});