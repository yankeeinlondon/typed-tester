import { Equal, Expect } from "@type-challenges/utils";
import { describe, expect, it } from "vitest";
import { getCache } from "../../../src/cache";

// Note: while type tests clearly fail visible inspection, they pass from Vitest
// standpoint so always be sure to run `tsc --noEmit` over your test files to 
// gain validation that no new type vulnerabilities have cropped up.

describe("This test does not rely on the type imports it has", () => {

  it("first test", () => {
    expect(1).toEqual(1);
    
    type cases = [
      Expect<Equal<1,1>>
    ];
    const cases: cases = [ true ];
  });

});
