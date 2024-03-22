import chalk from "chalk";
import { rel } from "src/utils";
import { get } from 'stack-trace';


export const error = (msg: string, context?: Record<string, unknown>) => {
  const trace = get().slice(1).map(i => `${i.getFunctionName()}::line ${i.getLineNumber()} in ${rel(i.getFileName())}`);

  if (context) {
    console.error("\n" + chalk.bgRed(" ERROR: ") + " " + msg, context, `\n${trace.join("\n")}`);
  } else {
    console.error("\n" + chalk.bgRed(" ERROR: ") + " " + msg, `\n${trace.join("\n")}`);
  }
  console.error();
  process.exit(1);
}
