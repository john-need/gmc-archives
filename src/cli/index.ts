#!/usr/bin/env node
import { writeError } from "@/cli/output";
import { runBatchConvert, runConvert } from "@/cli/commands/convert";
import { runBatchPublish, runPublish } from "@/cli/commands/publish";
import { runDownload, runSearch } from "@/cli/commands/search";
import { runStatus } from "@/cli/commands/status";
import type { OutputMode } from "@/cli/output";

function parseMode(args: string[]): OutputMode {
  return args.includes("--json") ? "json" : "human";
}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;
  const mode = parseMode(rest);
  const positional = rest.filter((arg) => arg !== "--json");

  switch (command) {
    case "convert":
      await runConvert(positional[0], mode);
      break;
    case "batch-convert":
      await runBatchConvert(positional, mode);
      break;
    case "publish":
      await runPublish(positional[0], mode);
      break;
    case "batch-publish":
      await runBatchPublish(positional, mode);
      break;
    case "search":
      await runSearch(positional[0], mode);
      break;
    case "download":
      await runDownload(positional[0], positional[1]);
      break;
    case "status":
      await runStatus(positional[0], mode);
      break;
    default:
      writeError(`Unknown command: ${command ?? "(none)"}`);
      process.exitCode = 1;
  }
}

main(process.argv.slice(2));
