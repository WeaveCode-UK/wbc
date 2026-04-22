// ACH-006 confiabilidade-resiliencia: CLI de replay do outbox DLQ.
//
// Uso:
//   pnpm tsx scripts/dlq-replay.ts list [--limit=50]
//   pnpm tsx scripts/dlq-replay.ts replay --id=<uuid>
//
// A branch --all é deliberadamente ausente: replay em massa deve ser
// decisão manual. Se precisar, chame replay id-por-id em loop shell
// depois de confirmar a causa raiz.

import { PrismaOutboxRepository } from "@wbc/db";

interface Args {
  command: "list" | "replay";
  id?: string;
  limit?: number;
}

function parseArgs(argv: string[]): Args {
  const [command, ...rest] = argv;
  if (command !== "list" && command !== "replay") {
    throw new Error(`Unknown command: ${command}. Use 'list' or 'replay'.`);
  }
  const args: Args = { command };
  for (const token of rest) {
    if (token.startsWith("--id=")) args.id = token.slice("--id=".length);
    if (token.startsWith("--limit=")) {
      const n = Number.parseInt(token.slice("--limit=".length), 10);
      if (Number.isFinite(n) && n > 0) args.limit = n;
    }
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const repo = new PrismaOutboxRepository();

  if (args.command === "list") {
    const items = await repo.listDLQ(args.limit ?? 50);
    for (const item of items) {
      console.log(
        `${item.id}\t${item.type}\t${item.tenantId}\tattempts=${item.attempts}\tcreatedAt=${item.createdAt.toISOString()}`,
      );
    }
    console.log(`# total: ${items.length}`);
    return;
  }

  if (!args.id) {
    throw new Error("replay requires --id=<uuid>");
  }
  const ok = await repo.replayFromDLQ(args.id);
  if (!ok) {
    console.error(`Not found in DLQ: ${args.id}`);
    process.exit(1);
  }
  console.log(`Replayed: ${args.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
