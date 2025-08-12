import chalk from "chalk";
import { getAllSymbolsInProject, projectUsing } from "src/ast";
import { AsOption } from "src/cli";
import { msg } from "src/utils";


export const deps_command = async (opt: AsOption<"deps">) => {
  const start = performance.now();

  const [project, _configFile] = projectUsing(opt.config 
    ? [ opt.config ] 
    : [`src/tsconfig.json`, `tsconfig.json`]
  );

  const symbols = getAllSymbolsInProject(project);

  if (opt.json) {
    const jsonOutput = {
      symbols: symbols.slice(0, 50).map(s => ({
        name: s.name,
        kind: s.kind,
        fqn: s.fqn
      })),
      total: symbols.length,
      duration: performance.now() - start
    };
    console.log(JSON.stringify(jsonOutput, null, 2));
  } else {
    msg(opt)(`- ${symbols.length} symbols found`)
    for (const s of symbols.slice(0,50)) {
      console.log(`- ${s.name} [${s.kind}] => ${s.fqn}`);
      
    }

    const duration = performance.now() - start;
    if(!opt.quiet) {
      msg(opt)("")
      msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`)
    }
  }
}
