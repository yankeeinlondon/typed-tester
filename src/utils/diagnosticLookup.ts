import type { Mutable, NumberLike } from "inferred-types";
import type {
    TypescriptDiagnostic
} from "~/types";
import { asString, hasKeys, isNumberLike } from "inferred-types";
import { InvalidDiagnosticCode, InvalidDiagnosticMessage } from "~/errors";

// Import JSON data files (using relative paths and import attributes for Deno/JSR compatibility)
import DIAGNOSTIC_CODE_LOOKUP from "../data/diagnostic-code-lookup.json" with { type: "json" };
import DIAGNOSTIC_MESSAGE_LOOKUP from "../data/diagnostic-message-lookup.json" with { type: "json" };

/**
 * **diagnosticLookup**`(ref)`
 *
 * Provides a lookup of a Typescript error code _or_ a Typescript error message to a fully formed
 * `TypescriptDiagnostic`.
 *
 * @param ref - A TypeScript diagnostic code (number/string) or error message (string)
 * @returns TypeScript diagnostic information with code, category, message, and link
 *
 * @example
 * ```ts
 * // Lookup by code
 * const diag = diagnosticLookup(2304);
 * // => { code: 2304, category: "Error", message: "Cannot find name '{0}'.", link: "..." }
 *
 * // Lookup by message
 * const diag2 = diagnosticLookup("Cannot find name '{0}'.");
 * // => { code: 2304, category: "Error", message: "Cannot find name '{0}'.", link: "..." }
 * ```
 */
export function diagnosticLookup<T extends NumberLike | string>(
    ref: T
): T extends keyof typeof DIAGNOSTIC_CODE_LOOKUP
    ? TypescriptDiagnostic & Mutable<(typeof DIAGNOSTIC_CODE_LOOKUP)[T]>
    : T extends keyof typeof DIAGNOSTIC_MESSAGE_LOOKUP
        ? TypescriptDiagnostic & Mutable<(typeof DIAGNOSTIC_MESSAGE_LOOKUP)[T]>
        : Error {
    if (isNumberLike(ref)) {
        const info = hasKeys(asString(ref))(DIAGNOSTIC_CODE_LOOKUP)
            ? DIAGNOSTIC_CODE_LOOKUP[asString(ref)] as TypescriptDiagnostic
            : InvalidDiagnosticCode(`the diagnostic code '${ref}' is not valid!`) as Error;
        return info as T extends keyof typeof DIAGNOSTIC_CODE_LOOKUP
            ? TypescriptDiagnostic & Mutable<(typeof DIAGNOSTIC_CODE_LOOKUP)[T]>
            : T extends keyof typeof DIAGNOSTIC_MESSAGE_LOOKUP
                ? TypescriptDiagnostic & Mutable<(typeof DIAGNOSTIC_MESSAGE_LOOKUP)[T]>
                : Error;
    }

    const info = hasKeys(asString(ref))(DIAGNOSTIC_MESSAGE_LOOKUP)
        ? DIAGNOSTIC_MESSAGE_LOOKUP[asString(ref)] as TypescriptDiagnostic
        : InvalidDiagnosticMessage(`the diagnostic message '${ref}' is not recognized!`) as Error;

    return info as T extends keyof typeof DIAGNOSTIC_CODE_LOOKUP
        ? TypescriptDiagnostic & Mutable<(typeof DIAGNOSTIC_CODE_LOOKUP)[T]>
        : T extends keyof typeof DIAGNOSTIC_MESSAGE_LOOKUP
            ? TypescriptDiagnostic & Mutable<(typeof DIAGNOSTIC_MESSAGE_LOOKUP)[T]>
            : Error;
}
