import chalk from "chalk";


export const prettyPath = (filepath: string, limit: number = 99) => {
  const parts = filepath.split(/[\/\\]/);
  const last = chalk.bold(parts.pop());
  const leadUp = parts.length < limit 
    ? parts.map(i => chalk.dim(i)).join("/")
    : chalk.dim.gray("...") + parts.slice(parts.length-limit).map(i => chalk.dim(i)).join("/")

  return `${leadUp}/${last}`
}


export const prettyMultiLinePath = (filepath: string, limit: number = 999) => {
  const parts = filepath.split(/[\/\\]/);
  const last = chalk.blue.bold(parts.pop());
  const entryLine = parts.join("/");
  const entry = entryLine.length > limit
    ? `...${entryLine
      .slice(-1 * (limit - 4))
      .split(/[\/\\]/)
      .join("/")}`
    : entryLine

  return `${chalk.dim(entry)}/\n${last}`
}
