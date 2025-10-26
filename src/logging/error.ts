import chalk from "chalk";
import { fileLink, rel } from "../utils";
import { get } from "stack-trace";

export function error(msg: string, context?: Record<string, unknown>) {
    const trace = get().slice(1).map((i) => {
        const fileName = i.getFileName();
        const lineNumber = i.getLineNumber();
        const relPath = rel(fileName);
        const filePathWithLine = `${fileName}:${lineNumber}`;
        return `${i.getFunctionName()}::line ${lineNumber} in ${fileLink(relPath, filePathWithLine)}`;
    });

    if (context) {
        console.error(`\n${chalk.bgRed(" ERROR: ")} ${msg}`, context, `\n${trace.join("\n")}`);
    }
    else {
        console.error(`\n${chalk.bgRed(" ERROR: ")} ${msg}`, `\n${trace.join("\n")}`);
    }
    console.error();
    process.exit(1);
}
