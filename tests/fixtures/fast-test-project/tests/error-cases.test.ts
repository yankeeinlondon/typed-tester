import type { Expect, Equal } from "@type-challenges/utils";
import type {
  UserInterface,
  UserType,
  IsString,
  ExtractArrayType,
  RequiredFields,
  OptionalFields
} from "../src/complex-types";

// Type tests that should intentionally fail to test error handling
describe("Error cases - type tests with intentional failures", () => {
  it("should fail when UserInterface has wrong property types", () => {
    // This should fail - age is number, not string
    type TestWrongType = Expect<Equal<
      UserInterface,
      { id: string; name: string; email: string; age: string }
    >>;
  });

  it("should fail when UserType structure is incorrect", () => {
    // This should fail - profile type is wrong
    type TestWrongUserType = Expect<Equal<
      UserType,
      {
        userId: number; // Should be string
        profile: string; // Should be UserInterface
        permissions: string[];
      }
    >>;
  });

  it("should fail when IsString conditional returns wrong result", () => {
    // This should fail - IsString<boolean> returns false, not true
    type TestWrongConditional = Expect<Equal<IsString<boolean>, true>>;
  });

  it("should fail when ExtractArrayType is used on non-array", () => {
    // This should fail - ExtractArrayType on string returns never, not string
    type TestWrongExtraction = Expect<Equal<ExtractArrayType<string>, string>>;
  });

  it("should fail with incorrect RequiredFields usage", () => {
    // This should fail - RequiredFields should make specified fields required
    type PartialUser = Partial<UserInterface>;
    type TestWrongRequired = Expect<Equal<
      RequiredFields<PartialUser, "id">,
      Partial<UserInterface> // Should have id as required, not all optional
    >>;
  });

  it("should fail with incorrect OptionalFields usage", () => {
    // This should fail - OptionalFields should make specified fields optional
    type TestWrongOptional = Expect<Equal<
      OptionalFields<UserInterface, "email">,
      UserInterface // Should have email as optional
    >>;
  });

  it("should fail when comparing incompatible union types", () => {
    // This should fail - these are different union types
    type TestWrongUnion = Expect<Equal<
      "GET" | "POST",
      "PUT" | "DELETE"
    >>;
  });

  it("should fail when comparing different generic instantiations", () => {
    // This should fail - Result<string> is not equal to Result<number>
    type TestWrongGeneric = Expect<Equal<
      import("../src/complex-types").Result<string>,
      import("../src/complex-types").Result<number>
    >>;
  });
});
