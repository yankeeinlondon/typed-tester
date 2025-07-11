import chalk from "chalk";
import { AsOption } from "src/cli";
import { projectUsing } from "src/ast"
import { msg } from "src/utils";

export const MAX_SYMBOLS = 10;

/** COMMAND */
export const symbols_command = async (opt: AsOption<"symbols">) => {
  const start = performance.now();

  if (opt.filter) {
    msg(opt)(chalk.bold(`Symbols (filter: ${chalk.dim(opt.filter)})`));
    msg(opt)(`----------------------------------------------------------`);
  }  else {
    msg(opt)(chalk.bold(`Symbols`));
    msg(opt)(`----------------------------------------------------------`);
  }
    
  const [project, configFile] = projectUsing(opt.config 
    ? [ opt.config ] 
    : [`src/tsconfig.json`, `tsconfig.json`]
  );
  
  const sourceFiles = project.getSourceFiles();

  msg(opt)(`- project found ${chalk.bold(sourceFiles.length)} source files [${chalk.dim(configFile)}]`);
  
  // TODO: Implement direct symbol analysis without cache
  msg(opt)(`- ${chalk.yellow("Symbol analysis temporarily disabled during cache removal")}`);
  msg(opt)(`- This command will be restored with direct symbol analysis`);

  const duration = performance.now() - start;
  if(!opt.quiet) {
    msg(opt)("")
    msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`)
  }
}