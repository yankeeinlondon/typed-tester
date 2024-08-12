import Watcher from "watcher";
import { ValidationOptions } from "./typeValidation";
import { dirname, join, relative } from "pathe";
import { getCache, getDependencies, getDependency, hasDependency, removeFromCache } from "./cache/cache";
import chalk from "chalk";
import { FileDiagnostics, getFileDiagnostics } from "./commands/testing/getFileDiagnostics";
import { coreFileChange } from "./reporting/coreFileChange";
import { AsOption } from "./cli/create_cli";

const rel = (file: string) => relative(process.cwd(), file);

const state = (input: FileDiagnostics, opts: ValidationOptions) => {
  const warnings = input.diagnostics
    ?.filter(i => opts.warn.includes(String(i.code)) )
    .length || 0;
  const errors = input.diagnostics
    ?.filter(i => !opts.warn.includes(String(i.code)) )
    .length || 0;

  const err_msg = errors >0 ? `${chalk.red("errors: ")}${chalk.redBright(errors)}` : "";
  const warn_msg = warnings > 0 
    ? `chalk.yellow("warnings: ")${chalk.yellowBright(warnings)}`
    : "";
  const success = warnings === 0 && errors === 0;
  const success_msg = success ? chalk.greenBright("success") : ""
  const diagReport: string[] = [];
  for (const item of input?.diagnostics?.filter(i => !opts.warn.includes(String(i.code)) ) || []) {
    diagReport.push( item.msg);
  }
  const errReport = errors === 0
  ? ""
  : `\n  ${diagReport.join("\n  ")}`;

  const msg = `[ ${[err_msg, warn_msg, success_msg].filter(i => i !== "").join(", ")} ]${errReport}`;
  
  return {
    warnings,
    errors,
    msg,
    success,
    errReport
  }
}

export const watch = (files: string[], opts: AsOption<"test">) => {
  let cache = getCache();
  // const core_dir = join(process.cwd(), folder);
  // const watcher_core = new Watcher(core_dir);

  const deps = getDependencies();
  const deps_dirs = Array.from(new Set<string>(Object.keys(deps).map(i => dirname(i))));
  const deps_dirs_rel = deps_dirs.map(i => rel(i));

  const watcher_deps = new Watcher(deps_dirs);


  let coreIsReady = false;
  setTimeout(() => {
    if (!coreIsReady) {
      coreIsReady = true;
      if(!opts.quiet) {
        console.log(`- core watcher is ready [ in ${chalk.blue(rel(core_dir))} directory ]`);
      }
    }
  }, 1000);
  let depsIsReady = false;
  setTimeout(() => {
    if (!depsIsReady) {
      depsIsReady = true;
      if(!opts.quiet) {
        console.log(`- dependency watcher is ready [ ${chalk.dim("files:")} ${chalk.bold(Object.keys(deps).length)}, ${chalk.dim("watch:")} ${chalk.bold(JSON.stringify(deps_dirs_rel))} ]`);
      }
    }
  }, 1500);

  watcher_core.on("all", (event, targetPath, targetPathNext) => {

    switch(event) {
      case "change":
        coreFileChange(targetPath, opts);
        return;

      case "rename":
        console.log(`- the file ${chalk.blue(targetPath)} was ${chalk.italic("renamed")} to ${chalk.blue(targetPathNext)}`);
        files = [...files.filter(i => i !== targetPath), targetPathNext as string];
        return;

      case "unlink":
        console.log(`- the file ${chalk.blue(rel(targetPath))} was ${chalk.italic("removed")}`);
        cache = removeFromCache(targetPath);
        return;

      case "add":
        if(coreIsReady) {
          console.log(`- the file ${chalk.blue(rel(targetPath))} was ${chalk.italic("added")}`);
          const d = getFileDiagnostics(targetPath, { ...opts, force: true, quiet: true });
          const now = state(d, opts);
          console.log(`- ${chalk.blue(rel(targetPath))} updated ${now.msg}`);
        }
        return;

      case "ready":
        if (!coreIsReady) {
          coreIsReady = true;
          console.log(`- core watcher is ready ${targetPath}!`);
        }
        return;
    }  
  });

  watcher_deps.on("all", (event, targetPath, _targetPathNext) => {

    switch(event) {
      case "change":
        if(hasDependency(targetPath)) {
          const dep = getDependency(targetPath);
          if(!opts.quiet) {
            console.log(`- the dependency file ${chalk.blue(rel(targetPath))} was changed; impacting: ${chalk.dim(JSON.stringify(Array.from(dep.dependents).map(i => rel(i))))}`);
            for (const item of dep.dependents) {
              coreFileChange(item, opts, true);
            }
          }
        }
        return;
      case "unlink": 
        if(hasDependency(targetPath)) {
          const dep = getDependency(targetPath);
          console.log(chalk.dim(`- the dependency file ${chalk.blue(rel(targetPath))} was removed! Impacting: ${JSON.stringify(Array.from(dep.dependents).map(i => rel(i)))}`));
          for (const item of dep.dependents) {
            coreFileChange(item, opts, true);
          }
        }
    }


  })


}
