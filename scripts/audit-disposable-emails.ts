import "dotenv/config";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";
import {
  disposableAuditCsv,
  findDisposableEmailAccounts,
} from "../src/lib/email/disposable-audit";

/**
 * Read-only audit of existing accounts whose email belongs to a disposable
 * domain. Prints a CSV or writes it to reports/ (gitignored).
 *
 *   pnpm audit:emails
 *   pnpm audit:emails --out reports/my-audit.csv
 *   pnpm audit:emails --stdout
 *
 * The output contains account PII: keep it out of version control, never put
 * it under public/, and delete it when you are done.
 */

function usage(): void {
  console.log(`Usage: pnpm audit:emails [--out <path>] [--stdout]

  --out <path>  Write the CSV to <path> (default: reports/disposable-emails-<date>.csv)
  --stdout      Print the CSV instead of writing a file
  --help        Show this help`);
}

function defaultOut(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `reports/disposable-emails-${date}.csv`;
}

function assertNotPublic(target: string): void {
  const publicDir = resolve(process.cwd(), "public");
  const rel = relative(publicDir, target);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) {
    throw new Error(
      "Refusing to write the audit under public/: that directory is served publicly.",
    );
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }

  const toStdout = args.includes("--stdout");
  let out = defaultOut();
  const outIndex = args.indexOf("--out");
  if (outIndex >= 0) {
    const value = args[outIndex + 1];
    if (!value) throw new Error("--out needs a path");
    out = value;
  }

  const rows = await findDisposableEmailAccounts();
  const csv = disposableAuditCsv(rows);

  if (toStdout) {
    process.stdout.write(csv);
    return;
  }

  const target = resolve(process.cwd(), out);
  assertNotPublic(target);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, csv, "utf8");

  console.warn(
    "This CSV contains account PII. Keep it out of git and delete it when you are done.",
  );
  console.log(
    rows.length === 0
      ? `No disposable-domain accounts found. Wrote the empty report to ${relative(process.cwd(), target)}.`
      : `Found ${rows.length} disposable-domain account(s). Wrote ${relative(process.cwd(), target)}.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
