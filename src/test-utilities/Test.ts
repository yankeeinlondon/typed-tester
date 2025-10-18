import { Expect as E } from "inferred-types/types";

/**
 * **Expect**`<Assertion>`
 * 
 * A wrapper around type assertion that provides extra type guarantees as well as 
 * better terminal reporting.
 * 
 * **Aliases:** `Test`, `IT`
 */
export type Expect = E; 

/**
 * **Test**`<Assertion>`
 * 
 * A wrapper around type assertion that provides extra type guarantees as well as 
 * better terminal reporting.
 * 
 * 
 * **Aliases:** `Expect`, `IT`
 */
export type Test = Expect;

/**
 * **IT**`<Assertion>`
 * 
 * A wrapper around type assertion that provides extra type guarantees as well as 
 * better terminal reporting.
 * 
 * 
 * **Aliases:** `Test`, `Expect`
 */
export type IT = Expect;

