import { describe, it, expect } from "vitest";
import type { SymbolMeta, JsDocInfo } from "~/types";
import { functionDescription } from "~/report/symbol-description/function-description";
import { typeDescription } from "~/report/symbol-description/type-description";
import { classDescription } from "~/report/symbol-description/class-description";
import { typeUtilityDescription } from "~/report/symbol-description/type-utility-description";
import { constDescription } from "~/report/symbol-description/const-description";

describe("Category-Specific Symbol Description Formatters", () => {

    describe("functionDescription()", () => {
        it("should format function with JSDoc comment", () => {
            const symbol: SymbolMeta = {
                name: "calculateSum",
                kind: "function",
                fqn: "module::123::calculateSum" as any,
                scope: "module",
                filepath: "/test/math.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: true,
                startLine: 10,
                endLine: 15,
                flags: ["Function"],
                generics: [],
                jsDocs: [{
                    comment: "Calculates the sum of two numbers",
                    tags: [
                        { tagName: "param", comment: "a first number" },
                        { tagName: "param", comment: "b second number" },
                        { tagName: "returns", comment: "the sum of a and b" }
                    ]
                }],
                refs: [],
            };

            const result = functionDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Calculates the sum");
            expect(result).toContain("(a, b)");
            expect(result.length).toBeGreaterThan(0);
        });

        it("should format function with generics", () => {
            const symbol: SymbolMeta = {
                name: "identity",
                kind: "function",
                fqn: "module::124::identity" as any,
                scope: "module",
                filepath: "/test/utils.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: true,
                startLine: 20,
                endLine: 22,
                flags: ["Function"],
                generics: [{ name: "T", type: "any" }],
                jsDocs: [{
                    comment: "Returns the input value unchanged",
                    tags: []
                }],
                refs: [],
            };

            const result = functionDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Returns the input value");
        });

        it("should handle function with no JSDoc", () => {
            const symbol: SymbolMeta = {
                name: "doSomething",
                kind: "function",
                fqn: "module::125::doSomething" as any,
                scope: "module",
                filepath: "/test/actions.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: true,
                startLine: 5,
                endLine: 10,
                flags: ["Function"],
                generics: [],
                jsDocs: [],
                refs: [],
            };

            const result = functionDescription(symbol);

            expect(result).toBeTruthy();
            // Should still return something meaningful, even without docs
            expect(result.length).toBeGreaterThan(0);
        });

        it("should handle const-function (arrow function)", () => {
            const symbol: SymbolMeta = {
                name: "add",
                kind: "const-function",
                fqn: "module::126::add" as any,
                scope: "module",
                filepath: "/test/math.ts",
                isTypeSymbol: false,
                isVariable: true,
                isFunction: true,
                startLine: 30,
                endLine: 30,
                flags: ["Variable", "Function"],
                generics: [],
                jsDocs: [{
                    comment: "Adds two numbers together",
                    tags: []
                }],
                refs: [],
            };

            const result = functionDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Adds two numbers");
        });
    });

    describe("typeDescription()", () => {
        it("should format type alias with JSDoc", () => {
            const symbol: SymbolMeta = {
                name: "UserId",
                kind: "type-defn",
                fqn: "module::200::UserId" as any,
                scope: "module",
                filepath: "/test/types.ts",
                isTypeSymbol: true,
                isVariable: false,
                isFunction: false,
                startLine: 5,
                endLine: 5,
                flags: ["TypeAlias"],
                generics: [],
                jsDocs: [{
                    comment: "A unique identifier for a user",
                    tags: []
                }],
                refs: [],
            };

            const result = typeDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("unique identifier");
        });

        it("should format interface type", () => {
            const symbol: SymbolMeta = {
                name: "User",
                kind: "type-defn",
                fqn: "module::201::User" as any,
                scope: "module",
                filepath: "/test/types.ts",
                isTypeSymbol: true,
                isVariable: false,
                isFunction: false,
                startLine: 10,
                endLine: 15,
                flags: ["Interface"],
                generics: [],
                jsDocs: [{
                    comment: "Represents a user in the system",
                    tags: [
                        { tagName: "property", comment: "id - user's unique identifier" },
                        { tagName: "property", comment: "name - user's display name" }
                    ]
                }],
                refs: [],
            };

            const result = typeDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Represents a user");
        });

        it("should handle type with generics", () => {
            const symbol: SymbolMeta = {
                name: "Result",
                kind: "type-defn",
                fqn: "module::202::Result" as any,
                scope: "module",
                filepath: "/test/types.ts",
                isTypeSymbol: true,
                isVariable: false,
                isFunction: false,
                startLine: 20,
                endLine: 22,
                flags: ["TypeAlias"],
                generics: [
                    { name: "T", type: "any" },
                    { name: "E", type: "Error" }
                ],
                jsDocs: [{
                    comment: "A result type that can be success or error",
                    tags: []
                }],
                refs: [],
            };

            const result = typeDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("result type that can be");
        });

        it("should handle type with no JSDoc", () => {
            const symbol: SymbolMeta = {
                name: "Config",
                kind: "type-defn",
                fqn: "module::203::Config" as any,
                scope: "module",
                filepath: "/test/types.ts",
                isTypeSymbol: true,
                isVariable: false,
                isFunction: false,
                startLine: 30,
                endLine: 35,
                flags: ["Interface"],
                generics: [],
                jsDocs: [],
                refs: [],
            };

            const result = typeDescription(symbol);

            expect(result).toBeTruthy();
        });
    });

    describe("classDescription()", () => {
        it("should format class with JSDoc", () => {
            const symbol: SymbolMeta = {
                name: "UserService",
                kind: "class",
                fqn: "module::300::UserService" as any,
                scope: "module",
                filepath: "/test/services.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: false,
                startLine: 10,
                endLine: 50,
                flags: ["Class"],
                generics: [],
                jsDocs: [{
                    comment: "Service for managing user operations",
                    tags: [
                        { tagName: "class", comment: "" }
                    ]
                }],
                refs: [],
            };

            const result = classDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Service for managing");
        });

        it("should format class with generics", () => {
            const symbol: SymbolMeta = {
                name: "Repository",
                kind: "class",
                fqn: "module::301::Repository" as any,
                scope: "module",
                filepath: "/test/repository.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: false,
                startLine: 5,
                endLine: 100,
                flags: ["Class"],
                generics: [{ name: "T", type: "any" }],
                jsDocs: [{
                    comment: "Generic repository for data access",
                    tags: []
                }],
                refs: [],
            };

            const result = classDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Generic repository");
        });

        it("should handle class with no JSDoc", () => {
            const symbol: SymbolMeta = {
                name: "Helper",
                kind: "class",
                fqn: "module::302::Helper" as any,
                scope: "module",
                filepath: "/test/helpers.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: false,
                startLine: 1,
                endLine: 20,
                flags: ["Class"],
                generics: [],
                jsDocs: [],
                refs: [],
            };

            const result = classDescription(symbol);

            expect(result).toBeTruthy();
        });
    });

    describe("typeUtilityDescription()", () => {
        it("should format type utility with JSDoc", () => {
            const symbol: SymbolMeta = {
                name: "DeepPartial",
                kind: "type-defn",
                fqn: "module::400::DeepPartial" as any,
                scope: "module",
                filepath: "/test/type-utils.ts",
                isTypeSymbol: true,
                isVariable: false,
                isFunction: false,
                startLine: 5,
                endLine: 10,
                flags: ["TypeAlias"],
                generics: [{ name: "T", type: "any" }],
                jsDocs: [{
                    comment: "Makes all properties in T optional recursively",
                    tags: [
                        { tagName: "typeParam", comment: "T - the type to make partially optional" }
                    ]
                }],
                refs: [],
            };

            const result = typeUtilityDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Makes all properties");
        });

        it("should format mapped type utility", () => {
            const symbol: SymbolMeta = {
                name: "Readonly",
                kind: "type-defn",
                fqn: "module::401::Readonly" as any,
                scope: "module",
                filepath: "/test/type-utils.ts",
                isTypeSymbol: true,
                isVariable: false,
                isFunction: false,
                startLine: 15,
                endLine: 15,
                flags: ["TypeAlias"],
                generics: [{ name: "T", type: "any" }],
                jsDocs: [{
                    comment: "Makes all properties readonly",
                    tags: []
                }],
                refs: [],
            };

            const result = typeUtilityDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Makes all properties readonly");
        });

        it("should handle type utility with complex generics", () => {
            const symbol: SymbolMeta = {
                name: "ExtractKeys",
                kind: "type-defn",
                fqn: "module::402::ExtractKeys" as any,
                scope: "module",
                filepath: "/test/type-utils.ts",
                isTypeSymbol: true,
                isVariable: false,
                isFunction: false,
                startLine: 20,
                endLine: 22,
                flags: ["TypeAlias"],
                generics: [
                    { name: "T", type: "object" },
                    { name: "V", type: "any" }
                ],
                jsDocs: [{
                    comment: "Extracts keys from T where the value type extends V",
                    tags: []
                }],
                refs: [],
            };

            const result = typeUtilityDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Extracts keys");
        });
    });

    describe("constDescription()", () => {
        it("should format const with JSDoc", () => {
            const symbol: SymbolMeta = {
                name: "API_BASE_URL",
                kind: "scalar",
                fqn: "module::500::API_BASE_URL" as any,
                scope: "module",
                filepath: "/test/config.ts",
                isTypeSymbol: false,
                isVariable: true,
                isFunction: false,
                startLine: 5,
                endLine: 5,
                flags: ["Variable"],
                generics: [],
                jsDocs: [{
                    comment: "The base URL for all API requests",
                    tags: []
                }],
                refs: [],
            };

            const result = constDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("base URL for all API");
        });

        it("should format const object", () => {
            const symbol: SymbolMeta = {
                name: "DEFAULT_OPTIONS",
                kind: "container",
                fqn: "module::501::DEFAULT_OPTIONS" as any,
                scope: "module",
                filepath: "/test/config.ts",
                isTypeSymbol: false,
                isVariable: true,
                isFunction: false,
                startLine: 10,
                endLine: 15,
                flags: ["Variable"],
                generics: [],
                jsDocs: [{
                    comment: "Default configuration options",
                    tags: []
                }],
                refs: [],
            };

            const result = constDescription(symbol);

            expect(result).toBeTruthy();
            expect(result).toContain("Default configuration");
        });

        it("should handle const with no JSDoc", () => {
            const symbol: SymbolMeta = {
                name: "MAX_RETRIES",
                kind: "scalar",
                fqn: "module::502::MAX_RETRIES" as any,
                scope: "module",
                filepath: "/test/config.ts",
                isTypeSymbol: false,
                isVariable: true,
                isFunction: false,
                startLine: 20,
                endLine: 20,
                flags: ["Variable"],
                generics: [],
                jsDocs: [],
                refs: [],
            };

            const result = constDescription(symbol);

            expect(result).toBeTruthy();
        });
    });

    describe("Edge Cases", () => {
        it("all formatters should handle empty JSDoc arrays gracefully", () => {
            const baseSymbol = {
                name: "TestSymbol",
                fqn: "module::999::TestSymbol" as any,
                scope: "module" as const,
                filepath: "/test/test.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: false,
                startLine: 1,
                endLine: 1,
                flags: [] as any,
                generics: [],
                jsDocs: [],
                refs: [],
            };

            expect(functionDescription({ ...baseSymbol, kind: "function" })).toBeTruthy();
            expect(typeDescription({ ...baseSymbol, kind: "type-defn", isTypeSymbol: true })).toBeTruthy();
            expect(classDescription({ ...baseSymbol, kind: "class" })).toBeTruthy();
            expect(typeUtilityDescription({ ...baseSymbol, kind: "type-defn", isTypeSymbol: true })).toBeTruthy();
            expect(constDescription({ ...baseSymbol, kind: "scalar", isVariable: true })).toBeTruthy();
        });

        it("all formatters should handle JSDoc with empty comment", () => {
            const baseSymbol = {
                name: "TestSymbol",
                fqn: "module::999::TestSymbol" as any,
                scope: "module" as const,
                filepath: "/test/test.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: false,
                startLine: 1,
                endLine: 1,
                flags: [] as any,
                generics: [],
                jsDocs: [{ comment: "", tags: [] }],
                refs: [],
            };

            expect(functionDescription({ ...baseSymbol, kind: "function" })).toBeTruthy();
            expect(typeDescription({ ...baseSymbol, kind: "type-defn", isTypeSymbol: true })).toBeTruthy();
            expect(classDescription({ ...baseSymbol, kind: "class" })).toBeTruthy();
            expect(typeUtilityDescription({ ...baseSymbol, kind: "type-defn", isTypeSymbol: true })).toBeTruthy();
            expect(constDescription({ ...baseSymbol, kind: "scalar", isVariable: true })).toBeTruthy();
        });

        it("all formatters should return strings (not undefined or null)", () => {
            const baseSymbol = {
                name: "TestSymbol",
                fqn: "module::999::TestSymbol" as any,
                scope: "module" as const,
                filepath: "/test/test.ts",
                isTypeSymbol: false,
                isVariable: false,
                isFunction: false,
                startLine: 1,
                endLine: 1,
                flags: [] as any,
                generics: [],
                jsDocs: [],
                refs: [],
            };

            expect(typeof functionDescription({ ...baseSymbol, kind: "function" })).toBe("string");
            expect(typeof typeDescription({ ...baseSymbol, kind: "type-defn", isTypeSymbol: true })).toBe("string");
            expect(typeof classDescription({ ...baseSymbol, kind: "class" })).toBe("string");
            expect(typeof typeUtilityDescription({ ...baseSymbol, kind: "type-defn", isTypeSymbol: true })).toBe("string");
            expect(typeof constDescription({ ...baseSymbol, kind: "scalar", isVariable: true })).toBe("string");
        });
    });
});
