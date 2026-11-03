import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'disposable-email-domains/disposable-email-domains';
const BRANCH = 'main';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'lib', 'email', 'disposable-domains.json');
const META = join(ROOT, 'src', 'lib', 'email', 'disposable-domains.meta.json');

async function githubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'plantinum-showcase-update-domains',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${url}`);
  }
  return response.json();
}

async function main() {
  const commit = await githubJson(
    `https://api.github.com/repos/${REPO}/commits/${BRANCH}`,
  );
  const sha = commit.sha;
  if (!sha) throw new Error('Could not resolve the latest commit');

  const rawUrl = `https://raw.githubusercontent.com/${REPO}/${sha}/disposable_email_blocklist.conf`;
  const response = await fetch(rawUrl);
  if (!response.ok) {
    throw new Error(`Could not download the blocklist: ${response.status}`);
  }

  const raw = await response.text();
  const domains = [
    ...new Set(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase())
        .filter(
          (line) =>
            line.length > 0 &&
            !line.startsWith('#') &&
            !line.includes('@') &&
            /^[a-z0-9.-]+$/.test(line),
        ),
    ),
  ].sort();

  if (domains.length < 1000) {
    throw new Error(`Refusing to write a suspiciously small list (${domains.length})`);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(domains, null, 2)}\n`);
  writeFileSync(
    META,
    `${JSON.stringify(
      {
        source: `https://github.com/${REPO}`,
        commit: sha,
        generatedAt: new Date().toISOString(),
        count: domains.length,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    `Wrote ${domains.length} domains from ${REPO}@${sha.slice(0, 12)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
