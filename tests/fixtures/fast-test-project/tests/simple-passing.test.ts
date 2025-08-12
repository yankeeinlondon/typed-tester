import type { Expect, Equal } from "@type-challenges/utils";
import type { 
  UserInterface, 
  UserType, 
  IsString,
  ExtractArrayType
} from "../src/complex-types";

// Type tests that should pass - using describe/it blocks for typed-tester CLI
describe("Type tests that should pass", () => {
  it("should validate basic interface structure", () => {
    type TestBasicInterface = Expect<Equal<
      UserInterface,
      { id: string; name: string; email: string; age: number }
    >>;
  });

  it("should validate complex user type", () => {
    type TestUserType = Expect<Equal<
      UserType,
      {
        userId: string;
        profile: UserInterface;
        permissions: string[];
      }
    >>;
  });

  it("should validate string type checking", () => {
    type TestIsStringWithString = Expect<Equal<IsString<string>, true>>;
    type TestIsStringWithNumber = Expect<Equal<IsString<number>, false>>;
  });

  it("should validate array type extraction", () => {
    type TestArrayExtraction = Expect<Equal<ExtractArrayType<string[]>, string>>;
  });
});