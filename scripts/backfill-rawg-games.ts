import { prisma } from '@/lib/prisma';
import { isRawgConfigured, searchGames } from '@/lib/rawg';
import { pickRawgMatch } from '@/lib/rawg-match';

/**
 * Links existing platinums to RAWG ids so "games in common" can use a stable
 * identity instead of free-text titles.
 *
 * Usage:
 *   pnpm backfill:rawg --dry-run
 *   pnpm backfill:rawg --limit=100
 *
 * Only exact normalised matches are written; ambiguous titles are reported and
 * left untouched. RAWG's free tier is finite, so requests are paced.
 */

const DELAY_MS = 300;

function argValue(name: string): string | undefined {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const rawLimit = argValue('--limit');
  const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;

  if (!isRawgConfigured()) {
    console.error(
      'RAWG_API_KEY is not set. Add it to .env (server-only) and try again.',
    );
    process.exitCode = 1;
    return;
  }
  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    console.error('--limit must be a positive integer.');
    process.exitCode = 1;
    return;
  }

  const rows = await prisma.platinum.groupBy({
    by: ['gameName'],
    where: { gameId: null },
    _count: { _all: true },
    orderBy: { gameName: 'asc' },
  });

  if (rows.length === 0) {
    console.log('Nothing to backfill: every platinum already has a gameId.');
    return;
  }

  const pending = limit ? rows.slice(0, limit) : rows;
  console.log(
    `${dryRun ? '[dry-run] ' : ''}Checking ${pending.length} of ${rows.length} distinct titles…`,
  );

  let matched = 0;
  let ambiguous = 0;
  let requests = 0;

  for (const row of pending) {
    const results = await searchGames(row.gameName);
    requests += 1;

    const match = pickRawgMatch(row.gameName, results);
    if (!match) {
      ambiguous += 1;
      console.log(`  ? ${row.gameName} (${row._count._all} plates) — no exact match`);
    } else {
      matched += 1;
      console.log(
        `  ✓ ${row.gameName} → ${match.name} [${match.id}] (${row._count._all} plates)`,
      );
      if (!dryRun) {
        await prisma.platinum.updateMany({
          where: { gameName: row.gameName, gameId: null },
          data: { gameId: match.id },
        });
      }
    }

    if (requests < pending.length) await sleep(DELAY_MS);
  }

  console.log(
    `\n${dryRun ? '[dry-run] ' : ''}Matched ${matched}, unmatched ${ambiguous}, of ${pending.length} titles.`,
  );
  if (ambiguous > 0) {
    console.log(
      'Unmatched titles keep gameId = null; fix their names or link them manually later.',
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
