import { describe, expect, it } from "vitest";
import {
    Expect,
    Test,
} from "inferred-types/types";
import { fileLink, CONSOLE_LINK_CLOSURE, CONSOLE_LINK_DELIMITER, CONSOLE_LINK_PREAMBLE } from "~/utils";
import { AssertEqual, narrow } from "inferred-types";
import { join } from "pathe";
import { cwd } from "process";

describe("fileLink(text,link)", () => {

    
    it("an undefined path results in non-clickable text being returned", () => {
        const t1 = fileLink("test");

        expect(t1).toBe("test");
    
        type cases = [
            Expect<AssertEqual<typeof t1, "test">>
        ];
    });
    

    it("relative path is converted to absolute path", () => {
        const leadingSlash = "/src/ast/files.ts";
        const dotPath = "./src/ast/files.ts";

        const t1 = fileLink("test", leadingSlash);
        const t2 = fileLink("test", dotPath);

        const fullPath = join(cwd(), leadingSlash);
        const e1 = narrow(`${CONSOLE_LINK_PREAMBLE}file://${fullPath}${CONSOLE_LINK_DELIMITER}test${CONSOLE_LINK_CLOSURE}`);
        const e2 = narrow(`${CONSOLE_LINK_PREAMBLE}file://${fullPath}${CONSOLE_LINK_DELIMITER}test${CONSOLE_LINK_CLOSURE}`);

        expect(t1).toBe(e1);
        expect(t2).toBe(e2);

        type cases = [
            Expect<AssertEqual<typeof t1, typeof e1>>,
            Expect<AssertEqual<typeof t2, typeof e2>>,
        ];
    });


    
    it("absolute path is kept 'as is'", () => {
        const leadingSlash = join(cwd(), "/src/ast/files.ts");
        const dotPath = join(cwd(), "./src/ast/files.ts");

        const t1 = fileLink("test", leadingSlash);
        const t2 = fileLink("test", dotPath);

        const e1 = narrow(`${CONSOLE_LINK_PREAMBLE}file://${leadingSlash}${CONSOLE_LINK_DELIMITER}test${CONSOLE_LINK_CLOSURE}`);
        const e2 = narrow(`${CONSOLE_LINK_PREAMBLE}file://${dotPath}${CONSOLE_LINK_DELIMITER}test${CONSOLE_LINK_CLOSURE}`);

        expect(t1).toBe(e1);
        expect(t2).toBe(e2);

        type cases = [
            Expect<AssertEqual<typeof t1, typeof e1>>,
            Expect<AssertEqual<typeof t2, typeof e2>>,
        ];
    });
    

});
