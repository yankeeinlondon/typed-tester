import { Equal, Expect } from "@type-challenges/utils";
import { describe, expect, it } from "vitest";
import { diagnosticLookup } from "~/utils/diagnosticLookup";

describe("diagnosticLookup()", () => {

    it("happy path", () => {
        const x = diagnosticLookup("2307");
        expect(typeof x).toBe("object");
        expect(x).toHaveProperty("code", 2307);
        expect(x).toHaveProperty("category", "Error");
        expect(x).toHaveProperty("message", "Cannot find module '{0}' or its corresponding type declarations.");
        expect(x).toHaveProperty("link", "https://typescript.tv/errors/#ts2307");

        type cases = [
            Expect<Equal<typeof x["code"], 2307>>,
            Expect<Equal<typeof x["category"], "Error">>,
            Expect<Equal<typeof x["message"], "Cannot find module '{0}' or its corresponding type declarations.">>,
            Expect<Equal<typeof x["link"], "https://typescript.tv/errors/#ts2307">>,
        ]
    });

});
