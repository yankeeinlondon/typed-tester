import type { Expect, Equal } from "@type-challenges/utils";
import type {
  UserInterface,
  UserType,
  UserManager,
  Result,
  Repository,
  RequiredFields,
  OptionalFields,
  IsString,
  ExtractArrayType,
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
    type TestSuccess = Expect<Equal<
      SuccessResult,
      | { success: true; data: string }
      | { success: false; error: Error }
    >>;
  });

  it("should validate Repository interface with generic types", () => {
    type UserRepo = Repository<UserInterface>;
    type TestRepo = UserRepo extends {
      findById(id: string): Promise<UserInterface | null>;
      save(item: UserInterface): Promise<UserInterface>;
      delete(id: string): Promise<boolean>;
    } ? true : false;
    type TestRepoValid = Expect<Equal<TestRepo, true>>;
  });

  it("should validate RequiredFields utility", () => {
    type PartialUser = Partial<UserInterface>;
    type UserWithRequiredId = RequiredFields<PartialUser, "id">;
    type TestRequired = UserWithRequiredId extends { id: string } ? true : false;
    type TestRequiredValid = Expect<Equal<TestRequired, true>>;
  });

  it("should validate OptionalFields utility", () => {
    type UserWithOptionalEmail = OptionalFields<UserInterface, "email">;
    type TestOptional = UserWithOptionalEmail extends { email?: string } ? true : false;
    type TestOptionalValid = Expect<Equal<TestOptional, true>>;
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
    type TestReadonlyValid = Expect<Equal<TestReadonly, true>>;
  });

  it("should validate EventName template literal type", () => {
    type ClickEvent = EventName<"click">;
    type TestEvent = Expect<Equal<ClickEvent, "onClick">>;
  });

  it("should validate ApiEndpoint template literal type", () => {
    type UsersEndpoint = ApiEndpoint<"users">;
    type TestEndpoint = Expect<Equal<UsersEndpoint, "/api/users">>;
  });

  it("should validate TreeNode recursive type", () => {
    type StringTree = TreeNode<string>;
    type TestTree = StringTree extends {
      value: string;
      children: StringTree[];
    } ? true : false;
    type TestTreeValid = Expect<Equal<TestTree, true>>;
  });

  it("should validate MenuItem recursive type with optional children", () => {
    type TestMenuItem = MenuItem extends {
      id: string;
      label: string;
      children?: MenuItem[];
    } ? true : false;
    type TestMenuValid = Expect<Equal<TestMenuItem, true>>;
  });

  it("should validate ApiTypes namespace types", () => {
    type TestRequest = ApiTypes.Request extends {
      method: HttpMethod;
      url: string;
      headers: Record<string, string>;
    } ? true : false;
    type TestRequestValid = Expect<Equal<TestRequest, true>>;

    type TestResponse = ApiTypes.Response<UserInterface> extends {
      status: number;
      data: UserInterface;
      headers: Record<string, string>;
    } ? true : false;
    type TestResponseValid = Expect<Equal<TestResponse, true>>;
  });

  it("should validate HttpMethod union type", () => {
    type TestGet = HttpMethod extends "GET" | "POST" | "PUT" | "DELETE" ? true : false;
    type TestHttpMethod = Expect<Equal<TestGet, true>>;
  });

  it("should validate UserType structure", () => {
    type TestUserType = Expect<Equal<
      UserType,
      {
        userId: string;
        profile: UserInterface;
        permissions: string[];
      }
    >>;
  });
});
