import chalk from "chalk";
import { getAllSymbolsInProject, projectUsing } from "src/ast";
import { initializeHasher } from "src/cache";
import { AsOption } from "src/cli";
import { msg } from "src/utils";


export const deps_command = async (opt: AsOption<"deps">) => {
  const start = performance.now();
  await initializeHasher();

  const [project, _configFile] = projectUsing(opt.config 
    ? [ opt.config ] 
    : [`src/tsconfig.json`, `tsconfig.json`]
  );

  const symbols = getAllSymbolsInProject(project);

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
