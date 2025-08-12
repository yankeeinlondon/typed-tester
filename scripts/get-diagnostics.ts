#!/usr/bin/env bun run
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gotcha, isOk } from "@yankeeinlondon/gotcha"
import {
    DiagnosticCodeLookup,
    TypescriptDiagnostic,
    MicrosoftDiagnosticLookup,
    TypescriptTvUrl,
    DiagnosticMessageLookup
} from "~/types/diagnostics"
import { asString, hasKeys, If, isNumberLike, IsValidIndex, Mutable, NumberLike } from "inferred-types";
import { InvalidDiagnosticCode, InvalidDiagnosticMessage, WriteFailure } from "~/errors";
import { isError } from "@yankeeinlondon/kind-error";
import { exit } from "node:process";
import { Project } from "ts-morph";
import chalk from "chalk";

const URL = "https://raw.githubusercontent.com/Microsoft/TypeScript/refs/heads/main/src/compiler/diagnosticMessages.json" as const;
const SOURCE_FILE = "./src/utils/diagnosticLookup.ts" as const;



/**
 * Microsoft provides the definitive reference but it's _keys_ are
 * the error description and we typically want to lookup from the
 * error code not the description.
 * 
 * Both may end being useful but we need to start will pulling down
 * what Microsoft is providing.
 */
async function getInvertedLookup(): Promise<MicrosoftDiagnosticLookup | Error> {

    const data = await gotcha(URL, { timeout: 5000 });
    if (isOk(data)) {
        const raw = await data.body.text();
        const parsed = JSON.parse(raw) as MicrosoftDiagnosticLookup;

        return parsed;
    } else {
        return data;
    }

}

/**
 * converts the lookup keys from the error message to the error code.
 */
function convert(lookup: MicrosoftDiagnosticLookup): DiagnosticCodeLookup {
    let output: DiagnosticCodeLookup = {};
    for (const k of Object.keys(lookup)) {
        const val = lookup[k];
        output[asString(val.code)] = {
            code: val.code,
            category: val.category,
            message: k,
            link: `https://typescript.tv/errors/#ts${val.code}` as TypescriptTvUrl
        }
    }
    return output;
}

function enhance(lookup: MicrosoftDiagnosticLookup): DiagnosticMessageLookup {
    let enhanced: DiagnosticMessageLookup = {};

    for (const k of Object.keys(lookup)) {
        const val = lookup[k];
        enhanced[k] = {
            category: val.category,
            code: val.code,
            message: k,
            link: `https://typescript.tv/errors/#ts${val.code}`
        }
    }
    return enhanced;
}



// dummy symbols
const DIAGNOSTIC_MESSAGE_LOOKUP = null as unknown as DiagnosticMessageLookup;
const DIAGNOSTIC_CODE_LOOKUP = null as unknown as DiagnosticCodeLookup;

/**
 * **diagnosticLookup**`(ref)`
 * 
 * Provides a lookup of a Typescript error code _or_ a Typescript error message to a fully formed
 * `TypescriptDiagnostic`.
 */
export function diagnosticLookup<T extends NumberLike | string>(ref: T): T extends keyof typeof DIAGNOSTIC_CODE_LOOKUP
    ? TypescriptDiagnostic & Mutable<(typeof DIAGNOSTIC_CODE_LOOKUP)[T]>
    : T extends keyof typeof DIAGNOSTIC_MESSAGE_LOOKUP
    ? TypescriptDiagnostic & Mutable<(typeof DIAGNOSTIC_MESSAGE_LOOKUP)[T]>
    : Error
    {
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


async function main(): Promise<void> {
    console.log();
    console.log(chalk.bold`Updating Diagnostic Lookups`);
    console.log(chalk.bold`---------------------------`);
    console.log();
    const rawLookup = await getInvertedLookup();

    if (isOk(rawLookup)) {
        console.log(`✔ received latest JSON lookup data from Microsoft`);
        const codeLookup = convert(rawLookup);
        console.log(`✔ created a code based lookup`);
        const messageLookup = enhance(rawLookup);
        console.log(`✔ created an enhanced message based lookup`);

        // Extract the complete function declaration with types and comments using ts-morph
        const project = new Project();
        const sourceFile = project.addSourceFileAtPath(resolve(import.meta.dirname, "./get-diagnostics.ts"));
        const functionDeclaration = sourceFile.getFunction("diagnosticLookup");

        if (!functionDeclaration) {
            throw new Error("Could not find diagnosticLookup function in source file");
        }

        // Get the full text of the function including JSDoc comments
        const functionText = functionDeclaration.getFullText();

        const fileContent = [
            `import { isNumberLike, hasKeys, asString } from "inferred-types";`,
            `import type { NumberLike, Mutable } from "inferred-types";`,
            `import type { TypescriptDiagnostic, DiagnosticMessageLookup, DiagnosticCodeLookup } from "~/types/diagnostics";`,
            `import { InvalidDiagnosticCode, InvalidDiagnosticMessage } from "~/errors";`,
            ``,
            `// #region MESSAGE_LOOKUPS`,
            `const DIAGNOSTIC_MESSAGE_LOOKUP = ${JSON.stringify(messageLookup)} as const satisfies DiagnosticMessageLookup;`,
            `// #endregion MESSAGE_LOOKUPS`,
            ``,
            `// #region CODE_LOOKUPS`,
            `const DIAGNOSTIC_CODE_LOOKUP = ${JSON.stringify(codeLookup)} as const satisfies DiagnosticCodeLookup;`,
            `// #endregion CODE_LOOKUPS`,
            ``,
            `${functionText}`
        ]

        // ready to write
        try {
            writeFileSync(SOURCE_FILE, fileContent.join("\n"), { encoding: "utf-8" });
            console.log();
            console.log(`✔ source file '${SOURCE_FILE}' has been updated!`);
            console.log();
            exit(0);
        } catch (e) {
            console.log(WriteFailure(`Unable to write to the file: ${SOURCE_FILE}: ${isError(e) ? e.message : String(e)}`));
            console.log();

            exit(1);
        }
    } else {
        console.log(`❌ unable to retrieve the latest JSON from Microsoft!`);
        console.log();
        exit(1);
    }
}

await main();
