#!/usr/bin/env bun run
import { mdToConsole } from "src/utils/mdToConsole"

console.log(mdToConsole(`**Hey**, _ho_, how are you?\n\n# H1 text\n\n## H2 text`))
console.log(mdToConsole('\n```js\nconst foobar = "hi";\n```'));
