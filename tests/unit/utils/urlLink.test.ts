import { describe, it, expect } from "vitest";
import { Expect } from "inferred-types/types";
import { AssertEqual, narrow } from "inferred-types";
import { urlLink, CONSOLE_LINK_PREAMBLE, CONSOLE_LINK_DELIMITER, CONSOLE_LINK_CLOSURE } from "~/utils";

describe("urlLink(text, [url])", () => {

    describe("with url parameter provided", () => {
        it("should create link with https:// when url doesn't have protocol", () => {
            const result = urlLink("Click here", "example.com");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com${CONSOLE_LINK_DELIMITER}Click here${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should preserve https:// when url already has it", () => {
            const result = urlLink("Visit site", "https://example.com");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com${CONSOLE_LINK_DELIMITER}Visit site${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should handle url with path", () => {
            const result = urlLink("Documentation", "example.com/docs/guide");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com/docs/guide${CONSOLE_LINK_DELIMITER}Documentation${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should handle url with query parameters", () => {
            const result = urlLink("Search", "example.com/search?q=test");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com/search?q=test${CONSOLE_LINK_DELIMITER}Search${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should handle url with fragment", () => {
            const result = urlLink("Section", "example.com#section");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com#section${CONSOLE_LINK_DELIMITER}Section${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });
    });

    describe("without url parameter (text used as url)", () => {
        it("should use text as url when no url provided", () => {
            const result = urlLink("example.com");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com${CONSOLE_LINK_DELIMITER}example.com${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should add https:// to text when used as url", () => {
            const result = urlLink("github.com/user/repo");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://github.com/user/repo${CONSOLE_LINK_DELIMITER}github.com/user/repo${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should preserve https:// in text when used as url", () => {
            const result = urlLink("https://example.com");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com${CONSOLE_LINK_DELIMITER}https://example.com${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });
    });

    describe("edge cases", () => {
        it("should handle empty text with url", () => {
            const result = urlLink("", "example.com");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com${CONSOLE_LINK_DELIMITER}${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should handle urls with port numbers", () => {
            const result = urlLink("Local", "localhost:3000");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://localhost:3000${CONSOLE_LINK_DELIMITER}Local${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should handle urls with subdomain", () => {
            const result = urlLink("API", "api.example.com");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://api.example.com${CONSOLE_LINK_DELIMITER}API${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should handle urls with deep paths", () => {
            const result = urlLink("Guide", "docs.example.com/v2/api/reference/methods");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://docs.example.com/v2/api/reference/methods${CONSOLE_LINK_DELIMITER}Guide${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });

        it("should handle complex query strings", () => {
            const result = urlLink("Results", "example.com/search?q=test&sort=date&limit=10");
            const expected = narrow(`${CONSOLE_LINK_PREAMBLE}https://example.com/search?q=test&sort=date&limit=10${CONSOLE_LINK_DELIMITER}Results${CONSOLE_LINK_CLOSURE}`);

            expect(result).toBe(expected);

            type cases = [
                Expect<AssertEqual<typeof result, typeof expected>>
            ];
        });
    });

});
