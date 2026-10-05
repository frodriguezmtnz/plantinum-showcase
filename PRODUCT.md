# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

PlayStation trophy hunters worldwide (PS3 / PS4 / PS5). They capture proof of their platinum trophies and want a place to show them off, get recognized by peers, and discover which games the community is completing. The site is English-only by deliberate choice for international reach.

Secondary audience: visitors deciding whether to join — they browse the gallery and Hall of Fame before creating an account.

## Product Purpose

A community showcase where players upload screenshots of their platinum trophies, the community votes on favorites, and the top platinums each month are celebrated in a Hall of Fame. Success = returning users who vote and compete month after month, not one-time visits.

## Positioning

The monthly cycle is the mechanism: votes reset into a fresh race each calendar month and the Hall of Fame crowns the winners, so there is a reason to come back every month. Spoiler protection (screenshots can blur story-revealing trophies) and duplicate detection (image hash per user) address this community's specific etiquette, not generic gallery features.

## Operating Context

Trophy culture: players screenshot the platinum toast / trophy list as proof, discuss rarity informally, and care about story spoilers. Screenshots are real captures (variable aspect ratios, often dark game UIs). Platform values in code and filters: PS3, PS4, PS5.

## Capabilities and Constraints

- Stack already decided by the codebase: Next.js 16 App Router, Tailwind v4 + shadcn/ui, Prisma + PostgreSQL (Neon), Cloudflare/B2-style S3 object storage for images, NextAuth v5 (credentials today; Google OAuth button exists but disabled, "coming soon").
- **Language: English only.** Spanish strings still exist in some components; they must be translated, and `html lang`/metadata must match. (Committed constraint, part of this work.)
- Comments are owner-only today; **third-party public comments are out of scope** (decided, not postponed).
- Closed months are snapshotted into `MonthlyResult` when the next month's first vote lands (or via `pnpm snapshots`), and surface in **Explore** as the monthly race panel (this-month totals, countdown, current or last-closed podium). The home is an **evergreen showcase** (all-time most-voted) and never names a month. The Hall of Fame page itself still ranks the current month only.
- Product is local-only, not launched; deployment target is Vercel ("Fase 2").
- Known pending constraints recorded in BACKLOG.md: upload progress indicator, vote rate limiting, magic-bytes image validation, forgot-password flow, OG images for shares.

## Brand Commitments

- Name: **Platinum Showcase** (repo typo "plantinum" is not part of the brand).
- `docs/blueprint.md` style guide is an early draft and **not binding**; the incumbent look (dark PlayStation-adjacent navy, blue primary, Inter/Outfit) is the current visual truth and is itself revisable.
- No PlayStation-owned logos or trademarks may be reproduced as if official; it is a fan community product.

## Evidence on Hand

- Real seed content exists only in the local database (`dev.db` / Neon dev data) for development.
- **No launched user base, no testimonials, no usage counts, no press, no case studies exist. Future design and copy must never fabricate them.**
- Feature truth source: `docs/blueprint.md` (features section), `prisma/schema.prisma`, `BACKLOG.md`.

## Product Principles

1. The trophy screenshot is the hero; the interface frames it and never competes with it.
2. Every month is a fresh race — celebrate the cycle, give a reason to return.
3. Community etiquette is a feature: spoilers stay protected, duplicates stay caught.
4. Claims stay honest: no invented social proof until real users exist.
5. Fast to browse, fast to post: capturing the moment is as important as viewing it.
