#!/usr/bin/env node
import { writeError } from "@/cli/output";
import { runAsk } from "@/cli/commands/ask";
import { runRequestAccess, runReviewRequests } from "@/cli/commands/access";
import { runBatchConvert, runConvert } from "@/cli/commands/convert";
import { runFavorite, runUnfavorite } from "@/cli/commands/favorite";
import { runBatchPublish, runPublish } from "@/cli/commands/publish";
import { runDownload, runSearch } from "@/cli/commands/search";
import { runStatus } from "@/cli/commands/status";
import { runUpload } from "@/cli/commands/upload";
import type { OutputMode } from "@/cli/output";

function parseMode(args: string[]): OutputMode {
  return args.includes("--json") ? "json" : "human";
}

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith("--") && arg !== "--json") {
      flags[arg.slice(2)] = args[i + 1] ?? "";
      i += 1;
    }
  }
  return flags;
}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;
  const mode = parseMode(rest);
  const positional = rest.filter((arg) => arg !== "--json");

  switch (command) {
    case "ask":
      await runAsk(positional.join(" "), mode);
      break;
    case "favorite":
      await runFavorite(positional[0], mode);
      break;
    case "unfavorite":
      await runUnfavorite(positional[0], mode);
      break;
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
    case "upload":
      await runUpload(positional[0], mode);
      break;
    case "request-access": {
      const flags = parseFlags(rest);
      await runRequestAccess({ name: flags.name, email: flags.email, affiliation: flags.affiliation, reason: flags.reason }, mode);
      break;
    }
    case "review-requests":
      await runReviewRequests(mode);
      break;
    default:
      writeError(`Unknown command: ${command ?? "(none)"}`);
      process.exitCode = 1;
  }
}

main(process.argv.slice(2));
