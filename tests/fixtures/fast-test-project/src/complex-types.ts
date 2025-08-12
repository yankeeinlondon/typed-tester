/**
 * Complex type definitions for comprehensive CLI testing
 */

// Basic types for testing symbols command
export interface UserInterface {
  id: string;
  name: string;
  email: string;
  age: number;
}

export type UserType = {
  userId: string;
  profile: UserInterface;
  permissions: string[];
};

// Function types for testing
export function createUser(data: Partial<UserInterface>): UserInterface {
  return {
    id: data.id || 'default-id',
    name: data.name || 'Unknown',
    email: data.email || 'unknown@example.com',
    age: data.age || 0
  };
}

export function validateUser(user: UserInterface): boolean {
  return user.id.length > 0 && user.email.includes('@');
}

// Class for testing
export class UserManager {
  private users: UserInterface[] = [];

  addUser(user: UserInterface): void {
    this.users.push(user);
  }

  getUser(id: string): UserInterface | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserCount(): number {
    return this.users.length;
  }
}

// Generic types
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(item: T): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Utility types
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Conditional types
export type IsString<T> = T extends string ? true : false;
export type ExtractArrayType<T> = T extends (infer U)[] ? U : never;

// Advanced mapped types
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P];
};

// Template literal types
export type EventName<T extends string> = `on${Capitalize<T>}`;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type ApiEndpoint<T extends string> = `/api/${T}`;

// Recursive types
export interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

export interface MenuItem {
  id: string;
  label: string;
  children?: MenuItem[];
}

// Function overloads for testing
export function processData(data: string): string;
export function processData(data: number): number;
export function processData(data: boolean): boolean;
export function processData(data: string | number | boolean): string | number | boolean {
  return data;
}

// Namespace for testing
export namespace ApiTypes {
  export interface Request {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
  }
  
  export interface Response<T = any> {
    status: number;
    data: T;
    headers: Record<string, string>;
  }
  
  export type Handler<T = any> = (req: Request) => Promise<Response<T>>;
}

// Module augmentation example
declare global {
  interface Window {
    customProperty: string;
  }
}

// Export all for easy testing
export const COMPLEX_TYPES_EXPORTS = {
  UserInterface,
  UserType,
  createUser,
  validateUser,
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
  processData,
  ApiTypes
} as const;