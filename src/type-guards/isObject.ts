export function isObject<T>(value: T): value is T & { [key: string | symbol]: unknown } {
  return typeof value === "object" && value !== null && Array.isArray(value) === false;
}

