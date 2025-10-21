import { describe, it, expect } from "vitest";
import { wordWrap } from "~/utils/wordWrap";

describe("wordWrap()", () => {
    describe("basic wrapping", () => {
        it("should return empty array for empty string", () => {
            expect(wordWrap("", 10, 20)).toEqual([]);
        });

        it("should return empty array for whitespace-only string", () => {
            expect(wordWrap("   ", 10, 20)).toEqual([]);
        });

        it("should not wrap text that fits within startWrap", () => {
            const result = wordWrap("hello", 10, 20);
            expect(result).toEqual(["hello"]);
        });

        it("should not wrap text that fits exactly at startWrap", () => {
            const result = wordWrap("hello", 5, 20);
            expect(result).toEqual(["hello"]);
        });
    });

    describe("soft wrapping at startWrap", () => {
        it("should wrap at word boundary when text exceeds startWrap", () => {
            // "hello world" exceeds startWrap of 8
            const result = wordWrap("hello world", 8, 20);
            expect(result).toEqual(["hello", "world"]);
        });

        it("should wrap at nearest word boundary before startWrap", () => {
            // "the quick brown fox" with startWrap=10
            // Should wrap at "quick" (10 chars: "the quick ")
            const result = wordWrap("the quick brown fox", 10, 30);
            expect(result).toEqual(["the quick", "brown fox"]);
        });

        it("should keep word on same line if it fits before forceWrap", () => {
            // "hello wonderful" with startWrap=8, forceWrap=20
            // "wonderful" is 9 chars, fits within forceWrap
            const result = wordWrap("hello wonderful", 8, 20);
            expect(result).toEqual(["hello", "wonderful"]);
        });

        it("should handle multiple wraps in long text", () => {
            const text = "this is a very long sentence that needs multiple wraps";
            const result = wordWrap(text, 15, 25);
            // Should wrap at word boundaries near 15 chars
            expect(result.length).toBeGreaterThan(2);
            result.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(25);
            });
        });
    });

    describe("hard wrapping at forceWrap", () => {
        it("should force wrap at forceWrap even mid-word", () => {
            // "verylongwordthatcannotfit" with startWrap=5, forceWrap=10
            const result = wordWrap("verylongwordthatcannotfit", 5, 10);
            expect(result.length).toBeGreaterThan(1);
            result.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(10);
            });
        });

        it("should force wrap when no word boundary exists before forceWrap", () => {
            const result = wordWrap("supercalifragilisticexpialidocious", 10, 15);
            expect(result.length).toBeGreaterThan(1);
            result.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(15);
            });
        });
    });

    describe("explicit newlines", () => {
        it("should preserve explicit newlines", () => {
            const result = wordWrap("hello\nworld", 20, 30);
            expect(result).toEqual(["hello", "world"]);
        });

        it("should handle multiple explicit newlines", () => {
            const result = wordWrap("line1\nline2\nline3", 20, 30);
            expect(result).toEqual(["line1", "line2", "line3"]);
        });

        it("should wrap long lines with explicit newlines", () => {
            const result = wordWrap("hello world\nthis is a longer line", 10, 20);
            expect(result.length).toBeGreaterThan(2);
            expect(result[0]).toBe("hello");
            expect(result[1]).toBe("world");
        });

        it("should preserve empty lines from explicit newlines", () => {
            const result = wordWrap("hello\n\nworld", 20, 30);
            expect(result).toEqual(["hello", "", "world"]);
        });
    });

    describe("ANSI code handling", () => {
        it("should handle text with ANSI color codes", () => {
            // Red "hello world" - the codes shouldn't count toward width
            const text = "\x1b[31mhello world\x1b[0m";
            const result = wordWrap(text, 8, 20);
            // Should wrap based on visible text "hello world" (11 chars)
            expect(result.length).toBeGreaterThan(1);
        });

        it("should handle text with multiple ANSI codes", () => {
            const text = "\x1b[31mhello\x1b[0m \x1b[34mworld\x1b[0m";
            const result = wordWrap(text, 8, 20);
            // Should wrap based on visible text "hello world"
            expect(result.length).toBeGreaterThan(1);
        });

        it("should handle bold formatting", () => {
            const text = "\x1b[1mbold text here\x1b[0m";
            const result = wordWrap(text, 8, 20);
            expect(result.length).toBeGreaterThan(1);
        });
    });

    describe("edge cases", () => {
        it("should handle single character", () => {
            expect(wordWrap("a", 5, 10)).toEqual(["a"]);
        });

        it("should handle single word longer than startWrap but shorter than forceWrap", () => {
            const result = wordWrap("longword", 5, 15);
            expect(result).toEqual(["longword"]);
        });

        it("should handle text with only spaces", () => {
            expect(wordWrap("     ", 5, 10)).toEqual([]);
        });

        it("should handle text with leading/trailing spaces", () => {
            const result = wordWrap("  hello world  ", 8, 20);
            expect(result.length).toBeGreaterThan(0);
        });

        it("should handle very small wrap values", () => {
            const result = wordWrap("hello", 2, 5);
            expect(result.length).toBeGreaterThan(0);
            result.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(5);
            });
        });

        it("should handle identical startWrap and forceWrap", () => {
            const result = wordWrap("hello world", 10, 10);
            expect(result.length).toBeGreaterThan(0);
            result.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(10);
            });
        });
    });

    describe("realistic scenarios", () => {
        it("should wrap typical description text for terminal output", () => {
            const description = "This function takes a string and returns a formatted version suitable for display in the terminal.";
            const result = wordWrap(description, 50, 60);

            expect(result.length).toBeGreaterThan(1);
            result.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(60);
            });
        });

        it("should handle code snippets with proper wrapping", () => {
            const code = "function myFunction(param1: string, param2: number): boolean { return true; }";
            const result = wordWrap(code, 40, 50);

            result.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(50);
            });
        });

        it("should handle mixed content with newlines and long words", () => {
            const text = "First line with some content\nSecondLineWithAVeryLongWordThatNeedsWrapping\nThird line normal";
            const result = wordWrap(text, 20, 30);

            expect(result.length).toBeGreaterThan(3);
            result.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(30);
            });
        });
    });
});
