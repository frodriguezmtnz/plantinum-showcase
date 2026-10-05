import "dotenv/config";
import { ensureSnapshots } from "../src/lib/history";

/**
 * One-off / repeatable freeze of every closed month that still lacks a
 * MonthlyResult snapshot. Safe to run anytime — it is idempotent.
 */
async function main() {
  const created = await ensureSnapshots();
  console.log(`Snapshot backfill complete: ${created} result rows written.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
