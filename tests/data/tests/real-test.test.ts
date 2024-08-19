import { Equal, Expect } from "@type-challenges/utils";
import { describe, expect, it } from "vitest";
import { good } from "../src/good"

// Note: while type tests clearly fail visible inspection, they pass from Vitest
// standpoint so always be sure to run `tsc --noEmit` over your test files to 
// gain validation that no new type vulnerabilities have cropped up.

describe("A real test", () => {

  it("should have a type error", () => {
    const foo = "hello";
    
    
    type cases = [
      Expect<Equal<typeof foo, string>>,
    ];
    const cases: cases = [
      true
    ];
  });

  it("should NOT have a type error", () => {
    const foo = "hello";
    
    
    type cases = [
      Expect<Equal<typeof foo, "hello">>,
    ];
    const cases: cases = [
      true
    ];
  });

});

describe("Another real test group", () => {

  
  it("using a good import", () => {
    
    expect(good).toBe(true);

    type cases = [
      Expect<Equal<typeof good, boolean>>
    ];

  });
  

})
