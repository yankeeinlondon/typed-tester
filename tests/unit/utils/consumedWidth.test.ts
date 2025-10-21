import { describe, it, expect } from "vitest";
import { consumedWidth } from "~/utils/consumedWidth";

describe("consumedWidth()", () => {
    describe("plain text", () => {
        it("should return 0 for empty string", () => {
            expect(consumedWidth("")).toBe(0);
        });

        it("should return correct width for simple ASCII text", () => {
            expect(consumedWidth("hello")).toBe(5);
            expect(consumedWidth("hello world")).toBe(11);
        });

        it("should handle single character", () => {
            expect(consumedWidth("a")).toBe(1);
        });

        it("should handle spaces", () => {
            expect(consumedWidth("   ")).toBe(3);
        });

        it("should handle numbers and symbols", () => {
            expect(consumedWidth("123")).toBe(3);
            expect(consumedWidth("!@#$%")).toBe(5);
        });
    });

    describe("ANSI escape codes", () => {
        it("should ignore ANSI color codes", () => {
            // Red text
            expect(consumedWidth("\x1b[31mhello\x1b[0m")).toBe(5);
        });

        it("should ignore bold formatting", () => {
            // Bold text
            expect(consumedWidth("\x1b[1mbold\x1b[0m")).toBe(4);
        });

        it("should ignore multiple ANSI codes", () => {
            // Red and bold
            expect(consumedWidth("\x1b[31m\x1b[1mhello\x1b[0m")).toBe(5);
        });

        it("should handle text with mixed ANSI codes", () => {
            // "hello world" with "hello" in red and "world" in blue
            expect(consumedWidth("\x1b[31mhello\x1b[0m \x1b[34mworld\x1b[0m")).toBe(11);
        });

        it("should handle SGR codes with multiple parameters", () => {
            // Combined codes like \x1b[1;31m (bold + red)
            expect(consumedWidth("\x1b[1;31mtext\x1b[0m")).toBe(4);
        });
    });

    describe("OSC 8 hyperlinks", () => {
        it("should ignore OSC 8 hyperlink codes", () => {
            // OSC 8 hyperlink: \x1b]8;;URL\x1b\\text\x1b]8;;\x1b\\
            const link = "\x1b]8;;https://example.com\x1b\\click here\x1b]8;;\x1b\\";
            expect(consumedWidth(link)).toBe(10); // "click here" = 10
        });

        it("should handle text with multiple hyperlinks", () => {
            const text = "\x1b]8;;https://a.com\x1b\\link1\x1b]8;;\x1b\\ and \x1b]8;;https://b.com\x1b\\link2\x1b]8;;\x1b\\";
            expect(consumedWidth(text)).toBe(15); // "link1 and link2" = 15
        });

        it("should handle hyperlinks with ANSI colors", () => {
            const text = "\x1b[34m\x1b]8;;https://example.com\x1b\\blue link\x1b]8;;\x1b\\\x1b[0m";
            expect(consumedWidth(text)).toBe(9); // "blue link" = 9
        });
    });

    describe("wide characters (emoji)", () => {
        it("should count emoji as 2 columns", () => {
            expect(consumedWidth("😀")).toBe(2);
            expect(consumedWidth("👍")).toBe(2);
        });

        it("should handle text with emoji", () => {
            expect(consumedWidth("hello 😀 world")).toBe(14); // 11 chars + 2 for emoji
        });

        it("should handle multiple emoji", () => {
            expect(consumedWidth("😀😀😀")).toBe(6); // 3 emoji * 2 columns each
        });

        it("should handle emoji with ANSI codes", () => {
            expect(consumedWidth("\x1b[31m😀\x1b[0m")).toBe(2);
        });
    });

    describe("wide characters (CJK)", () => {
        it("should count Chinese characters as 2 columns", () => {
            expect(consumedWidth("你好")).toBe(4); // 2 chars * 2 columns
        });

        it("should count Japanese characters as 2 columns", () => {
            expect(consumedWidth("こんにちは")).toBe(10); // 5 chars * 2 columns
        });

        it("should count Korean characters as 2 columns", () => {
            expect(consumedWidth("안녕")).toBe(4); // 2 chars * 2 columns
        });

        it("should handle mixed ASCII and CJK", () => {
            expect(consumedWidth("hello 你好")).toBe(10); // 5 + 1 + 4
        });

        it("should handle CJK with ANSI codes", () => {
            expect(consumedWidth("\x1b[31m你好\x1b[0m")).toBe(4);
        });
    });

    describe("combining characters", () => {
        it("should handle combining diacritical marks", () => {
            // e + combining acute accent = é
            const eWithAcute = "e\u0301";
            expect(consumedWidth(eWithAcute)).toBe(1);
        });

        it("should handle multiple combining characters", () => {
            // a + combining grave + combining tilde
            const aWithMarks = "a\u0300\u0303";
            expect(consumedWidth(aWithMarks)).toBe(1);
        });
    });

    describe("zero-width characters", () => {
        it("should handle zero-width space", () => {
            expect(consumedWidth("hello\u200bworld")).toBe(10); // zero-width space doesn't add width
        });

        it("should handle zero-width joiner", () => {
            expect(consumedWidth("hello\u200dworld")).toBe(10);
        });

        it("should handle zero-width non-joiner", () => {
            expect(consumedWidth("hello\u200cworld")).toBe(10);
        });
    });

    describe("complex mixed scenarios", () => {
        it("should handle ANSI + emoji + wide chars + plain text", () => {
            const text = "\x1b[31mHello\x1b[0m 你好 😀 world";
            // "Hello" (5) + " " (1) + "你好" (4) + " " (1) + emoji (2) + " world" (6) = 19
            expect(consumedWidth(text)).toBe(19);
        });

        it("should handle hyperlinks with emoji", () => {
            const text = "\x1b]8;;https://example.com\x1b\\😀 click\x1b]8;;\x1b\\";
            expect(consumedWidth(text)).toBe(8); // emoji (2) + " click" (6)
        });

        it("should handle all features together", () => {
            // Red bold text with CJK, emoji, hyperlink
            const text = "\x1b[1;31m你好\x1b[0m \x1b]8;;https://example.com\x1b\\😀\x1b]8;;\x1b\\ world";
            // "你好" (4) + " " (1) + emoji (2) + " world" (6) = 13
            expect(consumedWidth(text)).toBe(13);
        });
    });

    describe("edge cases", () => {
        it("should handle very long text", () => {
            const longText = "a".repeat(1000);
            expect(consumedWidth(longText)).toBe(1000);
        });

        it("should handle text that is only ANSI codes", () => {
            expect(consumedWidth("\x1b[31m\x1b[0m")).toBe(0);
        });

        it("should handle text that is only OSC 8 codes", () => {
            expect(consumedWidth("\x1b]8;;https://example.com\x1b\\\x1b]8;;\x1b\\")).toBe(0);
        });

        it("should handle newlines (return max line width)", () => {
            expect(consumedWidth("hello\nworld")).toBe(5); // max of two 5-char lines
            expect(consumedWidth("hi\nlonger line")).toBe(11); // "longer line" is longest
            expect(consumedWidth("short\nmedium\nvery long line")).toBe(14); // "very long line" is longest
        });

        it("should handle tabs (advance to tab stop)", () => {
            expect(consumedWidth("a\tb")).toBe(9); // 'a' at 0, tab advances to 8, 'b' at 8
            expect(consumedWidth("ab\tc")).toBe(9); // 'ab' at 0-1, tab advances to 8, 'c' at 8
            expect(consumedWidth("hello\tworld")).toBe(13); // 'hello' at 0-4, tab advances to 8, 'world' at 8-12
            expect(consumedWidth("12345678\tx")).toBe(17); // at column 8, tab advances to 16, 'x' at 16
        });
    });
});
