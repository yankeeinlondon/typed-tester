import { Equal, Expect } from "@type-challenges/utils";
import { describe, it } from "vitest";

// Note: while type tests clearly fail visible inspection, they pass from Vitest
// standpoint so always be sure to run `tsc --noEmit` over your test files to 
// gain validation that no new type vulnerabilities have cropped up.

describe("Name", () => {

  it("first test", () => {
    const foo = "hello";
    
    
    type cases = [
      Expect<Equal<typeof foo, string>>,
    ];
    const cases: cases = [
      true
    ];
  });

});
