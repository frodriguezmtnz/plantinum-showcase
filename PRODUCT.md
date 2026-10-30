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
- **Following is one-way and public** (added 2026-10): trophy hunters can follow each other from a profile, see follower/following lists, and get an in-app notice when someone starts following them.
- **The follow graph now shapes discovery** (added 2026-10): Explore has an "All trophy hunters / Following" source and the Hall of Fame has a "Global / My circle" scope, so following changes what you see without creating private bubbles. There is still no private-profile mode, block/mute, or activity notifications for followed uploads — those are deliberately later iterations.
- **Notifications can be pruned** (added 2026-10): a notice can be deleted individually and all **read** notices can be cleared at once. Unread notices stay, and the moderation queue at `/admin/reports` is never touched (notifications are just the bell's copy).
- **Passwords are strong by policy** (added 2026-10): registration and password changes require 15–128 characters with a lowercase, an uppercase, a number and a symbol. Settings shows a live checklist, match check and a show/hide toggle; the server enforces the same rules.
- **Profiles are tabbed** (added 2026-10): Gallery (default), Stats and About. About carries an optional 160-char bio, an optional PlayStation profile link (only `psnprofiles.com` / `playstation.com`, opened with `rel="nofollow"`), and the join month. The owner sees an "Edit profile" shortcut.
- **`/settings` manages identity and account** (added 2026-10): avatar upload with a square crop step (stored in B2 as `avatars/<userId>.avif`, rendered via `/api/avatars/[userId]`; legacy short ids work too), username change limited to **once every 12 months** with the old handle **reserved forever** (`/u/<old>` no longer resolves, and nobody else can take it), bio and **one or more PSN profile links** picked by provider + nickname (PSNProfiles, PlayStation, PSNTrophyLeaders, PocketPSN, Exophase, TrueTrophies, PlayStationTrophies.org; one per provider, URLs built server-side; the old single `psnProfileUrl` is kept only as a fallback until saved), read-only email, password change, and an informational plan card. **Billing is still not live**: nothing can be purchased, cancelled or refunded until Stripe is wired. Deleting an account is irreversible: plates and unreferenced stored images go away and frozen monthly rows stop linking to them.
- **Avatars are screened by the same AI** (added 2026-10) using an avatar-specific prompt. `UNSAFE` is always rejected; a `REVIEW` verdict or a classifier outage keeps the upload but warns the owner (fail-open decision). Bios are plain text: `< >` and `javascript:` are rejected on write and legacy values are sanitized on read. Profiles also show a **Follows you** badge and a **Share** action (native share sheet or copied link).
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
