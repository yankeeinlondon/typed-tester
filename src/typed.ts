// CLI SCRIPT
import { test_command } from "./commands/test";
import {  create_cli } from "./cli/create_cli";
import { show_help } from "./help";
import { AsOption } from "./cli/cli-types";
import { symbols_command } from "./commands/symbols";
import { isCommand } from "./type-guards/isCommand";

const [cmd, cli] = create_cli();

if (!cmd) {
  show_help();
  if(cli.help) {
    process.exit(0);
  } else {
    process.exit(1);
  }
} else {
  if (cli.help) {
    show_help(cmd);
    process.exit(0);
  } else {
    if (isCommand(cmd)) {
      switch(cmd) {
        case "test":
          await test_command(cli as AsOption<"test">)
          break;
        case "symbols":
          await symbols_command(cli as AsOption<"symbols">)
      }
    }
  }
}
