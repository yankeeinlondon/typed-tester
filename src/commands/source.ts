import chalk from "chalk";
import { AsOption } from "src/cli";
import { projectUsing } from "src/ast";
import { msg } from "src/utils";

export async function source_command(opt: AsOption<"source">) {
  const start = performance.now();

  msg(opt)(chalk.bold(`Source File Analysis`));
  msg(opt)(`-------------------------------`);

  const [project, configFile] = projectUsing(opt.config 
    ? [opt.config] 
    : [`src/tsconfig.json`, `tsconfig.json`]
  );

  const sourceFiles = project.getSourceFiles();
  msg(opt)(`- project found ${chalk.bold(sourceFiles.length)} source files [${chalk.dim(configFile)}]`);

  // TODO: Implement direct source analysis without cache
  msg(opt)(`- ${chalk.yellow("Source analysis temporarily disabled during cache removal")}`);
  msg(opt)(`- This command will be restored with direct source file analysis`);

  const duration = performance.now() - start;
  if (!opt.quiet) {
    msg(opt)("");
    msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`);
  }
}