#!/usr/bin/env node

import type { AsOption } from "./cli/cli-types";
// CLI SCRIPT
import { create_cli } from "./cli/create_cli";
import {
    deps_command,
    files_command,
    source_command,
    symbols_command,
    test_command
} from "./commands";
import { show_help } from "./help";
import { isCommand } from "./type-guards/isCommand";

const [cmd, cli, positionalArgs] = create_cli();

if (!cmd) {
    show_help();
    if (cli.help) {
        process.exit(0);
    }
    else {
        process.exit(1);
    }
}
else {
    if (cli.help) {
        show_help(cmd);
        process.exit(0);
    }
    else {
        if (isCommand(cmd)) {
            switch (cmd) {
                case "test":
                    await test_command(cli as AsOption<"test">, positionalArgs);
                    break;
                case "symbols":
                    await symbols_command(cli as AsOption<"symbols">, positionalArgs);
                    break;
                case "deps":
                    await deps_command(cli as AsOption<"deps">);
                    break;
                case "source":
                    await source_command(cli as AsOption<"source">, positionalArgs);
                    break;
                case "files":
                    await files_command(cli as AsOption<"files">);
                    break;
            }
        }
    }
}
