import type { Expect, AssertEqual, AssertExtends } from "inferred-types";
import type {
  UserInterface,
  UserType,
  Result,
  Repository,
  RequiredFields,
  OptionalFields,
  ReadonlyDeep,
  EventName,
  HttpMethod,
  ApiEndpoint,
  TreeNode,
  MenuItem,
  ApiTypes
} from "../src/complex-types";

// Comprehensive type tests covering all complex type utilities
describe("Comprehensive type tests", () => {
  it("should validate Result type with success case", () => {
    type SuccessResult = Result<string>;
    type TestSuccess = Expect<AssertEqual<
      SuccessResult,
      | { success: true; data: string }
      | { success: false; error: Error }
    >>;
  });

  it("should validate Repository interface with generic types", () => {
    type UserRepo = Repository<UserInterface>;
    type Expected = {
      findById(id: string): Promise<UserInterface | null>;
      save(item: UserInterface): Promise<UserInterface>;
      delete(id: string): Promise<boolean>;
    }


    type cases = [
        Expect<AssertExtends<UserRepo, Expected>>,
    ];
  });

  it("should validate RequiredFields utility", () => {
    type PartialUser = Partial<UserInterface>;
    type UserWithRequiredId = RequiredFields<PartialUser, "id">;
    type TestRequired = UserWithRequiredId extends { id: string } ? true : false;
    type TestRequiredValid = Expect<AssertEqual<TestRequired, true>>;
  });

  it("should validate OptionalFields utility", () => {
    type UserWithOptionalEmail = OptionalFields<UserInterface, "email">;
    type TestOptional = UserWithOptionalEmail extends { email?: string } ? true : false;
    type TestOptionalValid = Expect<AssertEqual<TestOptional, true>>;
  });

  it("should validate ReadonlyDeep for nested objects", () => {
    type DeepUser = {
      info: {
        profile: UserInterface;
      };
    };
    type ReadonlyUser = ReadonlyDeep<DeepUser>;
    type TestReadonly = ReadonlyUser extends {
      readonly info: {
        readonly profile: Readonly<UserInterface>;
      };
    } ? true : false;
    type TestReadonlyValid = Expect<AssertEqual<TestReadonly, true>>;
  });

  it("should validate EventName template literal type", () => {
    type ClickEvent = EventName<"click">;
    type TestEvent = Expect<AssertEqual<ClickEvent, "onClick">>;
  });

  it("should validate ApiEndpoint template literal type", () => {
    type UsersEndpoint = ApiEndpoint<"users">;
    type TestEndpoint = Expect<AssertEqual<UsersEndpoint, "/api/users">>;
  });

  it("should validate TreeNode recursive type", () => {
    type StringTree = TreeNode<string>;
    type TestTree = StringTree extends {
      value: string;
      children: StringTree[];
    } ? true : false;
    type TestTreeValid = Expect<AssertEqual<TestTree, true>>;
  });

  it("should validate MenuItem recursive type with optional children", () => {
    type TestMenuItem = MenuItem extends {
      id: string;
      label: string;
      children?: MenuItem[];
    } ? true : false;
    type TestMenuValid = Expect<AssertEqual<TestMenuItem, true>>;
  });

  it("should validate ApiTypes namespace types", () => {
    type TestRequest = ApiTypes.Request extends {
      method: HttpMethod;
      url: string;
      headers: Record<string, string>;
    } ? true : false;
    type TestRequestValid = Expect<AssertEqual<TestRequest, true>>;

    type TestResponse = ApiTypes.Response<UserInterface> extends {
      status: number;
      data: UserInterface;
      headers: Record<string, string>;
    } ? true : false;
    type TestResponseValid = Expect<AssertEqual<TestResponse, true>>;
  });

  it("should validate HttpMethod union type", () => {
    type TestGet = HttpMethod extends "GET" | "POST" | "PUT" | "DELETE" ? true : false;
    type TestHttpMethod = Expect<AssertEqual<TestGet, true>>;
  });

  it("should validate UserType structure", () => {
    type TestUserType = Expect<AssertEqual<
      UserType,
      {
        userId: string;
        profile: UserInterface;
        permissions: string[];
      }
    >>;
  });
});
