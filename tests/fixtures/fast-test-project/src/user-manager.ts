/**
 * User management utilities for fixture testing
 */

import type { UserInterface, UserType } from "./complex-types";

// Additional types for testing
export interface UserService {
  createUser(data: Partial<UserInterface>): Promise<UserInterface>;
  updateUser(id: string, data: Partial<UserInterface>): Promise<UserInterface>;
  deleteUser(id: string): Promise<boolean>;
  getUser(id: string): Promise<UserInterface | null>;
}

export interface UserQuery {
  name?: string;
  email?: string;
  minAge?: number;
  maxAge?: number;
}

export type UserRole = "admin" | "user" | "guest";

export interface UserWithRole extends UserInterface {
  role: UserRole;
  permissions: string[];
}

// User management class
export class UserServiceImpl implements UserService {
  private users: Map<string, UserInterface> = new Map();

  async createUser(data: Partial<UserInterface>): Promise<UserInterface> {
    const user: UserInterface = {
      id: data.id || this.generateId(),
      name: data.name || "Unknown",
      email: data.email || "unknown@example.com",
      age: data.age || 0
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<UserInterface>): Promise<UserInterface> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User with id ${id} not found`);
    }
    const updated = { ...existing, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUser(id: string): Promise<UserInterface | null> {
    return this.users.get(id) || null;
  }

  async findUsers(query: UserQuery): Promise<UserInterface[]> {
    const results: UserInterface[] = [];
    for (const user of this.users.values()) {
      if (this.matchesQuery(user, query)) {
        results.push(user);
      }
    }
    return results;
  }

  private matchesQuery(user: UserInterface, query: UserQuery): boolean {
    if (query.name && !user.name.includes(query.name)) {
      return false;
    }
    if (query.email && !user.email.includes(query.email)) {
      return false;
    }
    if (query.minAge !== undefined && user.age < query.minAge) {
      return false;
    }
    if (query.maxAge !== undefined && user.age > query.maxAge) {
      return false;
    }
    return true;
  }

  private generateId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// User validation utilities
export function validateUserData(data: Partial<UserInterface>): string[] {
  const errors: string[] = [];

  if (data.email && !isValidEmail(data.email)) {
    errors.push("Invalid email format");
  }

  if (data.age !== undefined && (data.age < 0 || data.age > 150)) {
    errors.push("Invalid age range");
  }

  if (data.name && data.name.trim().length === 0) {
    errors.push("Name cannot be empty");
  }

  return errors;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getUserDisplayName(user: UserInterface): string {
  return `${user.name} <${user.email}>`;
}

export function isAdult(user: UserInterface): boolean {
  return user.age >= 18;
}
