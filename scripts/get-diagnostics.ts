#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gotcha, isOk } from "@yankeeinlondon/gotcha"
import type {
    DiagnosticCodeLookup,
    MicrosoftDiagnosticLookup,
    DiagnosticMessageLookup
} from "~/types"
import { asString } from "inferred-types";
import { exit } from "node:process";
import chalk from "chalk";

const URL = "https://raw.githubusercontent.com/Microsoft/TypeScript/refs/heads/main/src/compiler/diagnosticMessages.json" as const;
const CODE_LOOKUP_FILE = "./src/data/diagnostic-code-lookup.json" as const;
const MESSAGE_LOOKUP_FILE = "./src/data/diagnostic-message-lookup.json" as const;

/**
 * Microsoft provides the definitive reference but its _keys_ are
 * the error description and we typically want to lookup from the
 * error code not the description.
 *
 * Both may end being useful but we need to start with pulling down
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
 * Converts the lookup keys from the error message to the error code.
 */
function convert(lookup: MicrosoftDiagnosticLookup): DiagnosticCodeLookup {
    const output: DiagnosticCodeLookup = {};
    for (const k of Object.keys(lookup)) {
        const val = lookup[k];
        output[asString(val.code)] = {
            code: val.code,
            category: val.category,
            message: k,
            link: `https://typescript.tv/errors/#ts${val.code}`
        }
    }
    return output;
}

/**
 * Enhances the Microsoft lookup with additional metadata.
 */
function enhance(lookup: MicrosoftDiagnosticLookup): DiagnosticMessageLookup {
    const enhanced: DiagnosticMessageLookup = {};

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

async function main(): Promise<void> {
    console.log();
    console.log(chalk.bold`Updating Diagnostic Lookups`);
    console.log(chalk.bold`---------------------------`);
    console.log();

    const rawLookup = await getInvertedLookup();

    if (isOk(rawLookup)) {
        console.log(`✔ received latest JSON lookup data from Microsoft`);

        const codeLookup = convert(rawLookup);
        console.log(`✔ created a code-based lookup`);

        const messageLookup = enhance(rawLookup);
        console.log(`✔ created an enhanced message-based lookup`);

        // Write JSON files
        try {
            writeFileSync(
                CODE_LOOKUP_FILE,
                JSON.stringify(codeLookup, null, 2),
                { encoding: "utf-8" }
            );
            console.log(`✔ wrote code lookup to ${chalk.blue(CODE_LOOKUP_FILE)}`);

            writeFileSync(
                MESSAGE_LOOKUP_FILE,
                JSON.stringify(messageLookup, null, 2),
                { encoding: "utf-8" }
            );
            console.log(`✔ wrote message lookup to ${chalk.blue(MESSAGE_LOOKUP_FILE)}`);

            console.log();
            console.log(chalk.green.bold(`✓ Successfully updated diagnostic lookups!`));
            console.log();
            exit(0);
        } catch (e) {
            console.error(chalk.red(`✗ Failed to write files: ${e}`));
            console.log();
            exit(1);
        }
    } else {
        console.log(chalk.red(`✗ unable to retrieve the latest JSON from Microsoft!`));
        console.log();
        exit(1);
    }
}

await main();
