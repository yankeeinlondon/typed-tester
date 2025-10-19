#!/usr/bin/env bun run

// https://github.com/steveukx/git-js
import { argv, exit } from "node:process";
import {} from "simple-git";

type Flags = {
    dryRun?: boolean;
}

/** 
 * Creates markdown output which reports on 
 * the state of the repo at the beginning of 
 * a phase of work.
 * 
 * Return Markdown:
 * 
 * - last local commit: hash
 * - last remote commit: hash
 * - dirty files: an array of fully qualified file paths (from repo root)
 * which had not yet been committed
 * 
 * - if `dry-run` flag is NOT set then:
 *      - create a snapshot of the files which are dirty
 *      - snapshot name should be named: `{{planName}}-phase{{phaseNumber}}-initial`
 *      - keep the dirty files as part of the repo state
 */
function createStartPositionReport(
    planName: string, 
    phaseNumber: `${number}`,
    flags: Flags
) {
    
    // TODO

}


// expects parameters to be passed in
const [planName, phaseNumber, ...rest ] = argv.slice(2);
const flags = rest.some(i => i === "--dry-run")
    ? { dryRun: true }
    : {};

if (!planName || !phaseNumber) {
    console.log("invalid syntax: 'start-position.ts' expects planName and phaseNumber to be passed in as parameters!");

    exit(1)
}

createStartPositionReport(planName, phaseNumber as `${number}`, flags);
