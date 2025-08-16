import type { NumberLike } from "inferred-types";

export type DiagnosticCategory = "Error" | "Warning" | "Message" | "Suggestion";

export type TypescriptTvUrl = `https://typescript.tv/errors/#ts${number}`;

export interface TypescriptDiagnostic {
    category: DiagnosticCategory;
    code: number;
    message: string;
    link: TypescriptTvUrl;
}

/**
 * **DiagnosticCodeLookup**
 *
 * A lookup table who's _keys_ are Typescript diagnostic codes (converted to string literals).
 * Returns a key/value dictionary with the following properties:
 *
 * - **category**: is one of `Error`, `Warning`, `Message`, or `Suggestion`
 * - **code**: for convenience sake we mirror back the diagnostic code used in the lookup
 * - **message**: a string description for the diagnostic
 * - **link**: a URL that will point to an online description with examples from `typescript.tv`
 */
export type DiagnosticCodeLookup = Record<NumberLike, TypescriptDiagnostic>;

/**
 * **DiagnosticMessageLookup**
 *
 * A lookup table who's _keys_ are the Typescript diagnostic message. Each value is a fully
 * formed `TypescriptDiagnostic` record.
 *
 * - the shape is no different from `DiagnosticCodeLookup` but keys are different
 * - this is an _enhanced_ type from what Microsoft provides with their
 * `MicrosoftDiagnosticLookup` structure.
 */
export type DiagnosticMessageLookup = Record<string, TypescriptDiagnostic>;

/**
 * **DiagnosticMessageLookup**
 *
 * The original lookup shape which Microsoft provides as part of their online
 * [Json data](https://raw.githubusercontent.com/Microsoft/TypeScript/refs/heads/main/src/compiler/diagnosticMessages.json)
 * payload.
 *
 * - all _keys_ are the diagnostic message
 */
export type MicrosoftDiagnosticLookup = Record<string, { category: DiagnosticCategory; code: number }>;
