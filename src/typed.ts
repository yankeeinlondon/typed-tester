// CLI SCRIPT
import { test_command } from "./commands/test";
import { AsOption, create_cli, isCommand } from "./create_cli";
import { show_help } from "./help";

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
      }
    }
  }
}
