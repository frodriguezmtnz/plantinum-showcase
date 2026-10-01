---
name: Platinum Showcase
description: The Console Browse Screen — a white graph-paper field lit by PlayStation duotone, where black chrome, magenta selection, and green live numbers run a monthly race.
colors:
  paper: "hsl(0 0% 99%)"
  cloud: "hsl(210 60% 98%)"
  frost: "hsl(210 60% 99%)"
  ink: "hsl(212 38% 16%)"
  ink-void: "hsl(0 0% 10%)"
  ink-secondary: "hsl(211 22% 36%)"
  ink-deep: "hsl(211 40% 20%)"
  sky-white: "hsl(0 0% 98%)"
  ps-pink: "hsl(322 100% 44%)"
  ps-green: "hsl(147 100% 32%)"
  live: "hsl(147 100% 24%)"
  ice: "hsl(322 100% 52%)"
  ice-soft: "hsl(322 90% 82%)"
  bloom-glow: "hsl(322 100% 65%)"
  grid-line: "hsl(210 18% 70%)"
  ink-shadow: "hsl(207 60% 28%)"
  cloud-mat: "hsl(206 45% 94%)"
  haze: "hsl(205 48% 91%)"
  ice-mist: "hsl(203 72% 88%)"
  hairline: "hsl(206 30% 82%)"
  cloud-edge: "hsl(207 36% 84%)"
  scrollbar-ink: "hsl(207 30% 58%)"
  scrollbar-ink-deep: "hsl(207 32% 44%)"
  alert-red: "hsl(4 100% 45%)"
  dusk-amber: "hsl(38 88% 42%)"
  dusk-amber-bright: "hsl(38 88% 45%)"
  sunrise-cream: "hsl(44 92% 90%)"
  champion-ink: "hsl(30 72% 32%)"
  runner-silver: "hsl(211 30% 55%)"
  ember-bronze: "hsl(24 55% 45%)"
  ember-ink: "hsl(24 60% 34%)"
  chart-1: "hsl(203 72% 44%)"
  chart-2: "hsl(28 88% 52%)"
  chart-3: "hsl(168 44% 38%)"
  chart-4: "hsl(44 88% 52%)"
  chart-5: "hsl(248 36% 58%)"
  glow-pink: "hsl(322 100% 44% / 0.06)"
  glow-green: "hsl(147 100% 32% / 0.05)"
  selection-wash: "hsl(322 100% 44% / 0.22)"
  night-ground: "hsl(212 38% 10%)"
  night-panel: "hsl(212 34% 13%)"
  night-veil: "hsl(212 30% 18%)"
  night-edge: "hsl(212 25% 26%)"
  night-muted: "hsl(211 22% 70%)"
  night-live: "hsl(147 70% 55%)"
  night-ice: "hsl(322 100% 58%)"
typography:
  display:
    fontFamily: "Mulish, sans-serif"
    fontSize: "2.25rem → 3.75rem (text-4xl md:text-6xl)"
    fontWeight: 300
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Mulish, sans-serif"
    fontSize: "2.25rem → 3rem (text-4xl md:text-5xl)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  subhead:
    fontFamily: "Mulish, sans-serif"
    fontSize: "1.5rem → 2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Mulish, sans-serif"
    fontSize: "1rem → 1.5rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Mulish, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Mulish, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  nav:
    fontFamily: "Mulish, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "Mulish, sans-serif"
    fontSize: "0.75rem → 0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  micro-caps:
    fontFamily: "Mulish, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.22em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  chip: "10px"
  xl: "14px"
  panel: "16px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  row-gap: "20px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink-void}"
    textColor: "{colors.sky-white}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.ink-void}"
  button-outline:
    backgroundColor: "hsl(0 0% 100% / 0.65)"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "hsl(0 0% 100% / 0.85)"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.pill}"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.alert-red}"
    textColor: "{colors.sky-white}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 20px"
  chip-rank:
    backgroundColor: "hsl(0 0% 100% / 0.85)"
    textColor: "{colors.ink-void}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  chip-platform:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    padding: "2px 10px"
  card-panel:
    backgroundColor: "hsl(210 60% 99% / 0.92)"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
  panel-chrome:
    backgroundColor: "hsl(210 60% 99% / 0.74)"
    rounded: "{rounded.panel}"
  plate-tile:
    backgroundColor: "{colors.cloud-mat}"
    rounded: "{rounded.xl}"
    width: "256px → 288px"
  nav-pill-active:
    backgroundColor: "hsl(0 0% 100% / 0.85)"
    textColor: "{colors.ink-void}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 16px"
---

# Design System: Platinum Showcase

## Overview

**Creative North Star: "The Console Browse Screen"**

The site is the community's own console browse screen: a white graph-paper field you scroll across, frosted system panels for chrome, and plates that bloom when selection rests on them. It refuses the dark-gallery hero completely — the world is bright, quiet paper, and the trophy screenshots carry all the visual weight. Its energy comes from a PlayStation duotone: square-magenta marks every selection, triangle-green marks everything alive (votes, countdowns), and the chrome itself is ink-black. The race clock lives in the data (days-left copy), not in the sky.

Materials are the identity. Two frosts — a 74% translucent `.panel` for chrome (header, footer, section shells) and a 92% `.panel-solid` for content you read (month strip, cards) — sit over a full-bleed console field — flat white paper (`hsl(0 0% 99%)`) with a graph grid (`--grid-line` 1px lines on a 30px lattice) that a CSS mask fades out by ~42vh, lit by two whisper-soft duotone glows: magenta `hsl(322 100% 44% / 0.06)` top-left, green `hsl(147 100% 32% / 0.05)` bottom-right. Ink text on paper replaces the old dark chrome entirely. Selection has exactly one language: the bloom — a 3px `hsl(322 100% 65% / 0.8)` magenta ring plus an ink-tinted lift shadow, with the tile rising 10px at 1.04 scale — and unlike a hover-only system, a browse screen always holds a resting selection, moved by arrow keys.

**Key Characteristics:**
- Light world: cloud grounds (`hsl(210 60% 98%)`), ink text (`hsl(212 38% 16%)`), frost panels; no dark chrome anywhere.
- The field never changes with the calendar: it is one fixed paper-and-grid world; `src/lib/race.ts` supplies only `daysLeft` and `monthLabel` for copy.
- One selection language: the bloom (`--bloom`), shared by hover, focus-visible, and the resting `[data-selected]` plate.
- Mulish is the only family; `--font-headline` aliases `--font-body`. The voice is weight and tracking, not a second face.
- Tracked micro-caps (11px, 0.22em) survive only as data labels — month name, PLATFORM, rank/status, countdown, footer column heads — never as kickers above headings.
- All real motion is action-triggered, once-only, or scroll-borne: a console-boot intro that plays one time (with the month strip's vote count ticking up), bloom-on-select, and a uniform 500ms card mount fade with deliberately no per-card stagger. Below the hero, the home is a sticky card deck (`.stack-deck`/`.stack-card`): each card pins 0.75rem below the previous (pure CSS `position: sticky` + `--stack-i`) and the next lands on top like a dealt hand — the stack is the scroll animation, so there are no JS reveals. The home race row drifts as a seamless 50s marquee that pauses for hover/focus/off-screen and stops permanently when the visitor takes control (keyboard, wheel, touch); reduced-motion and automated captures (`?motion=off`) get the static, scrollable row. The field itself is static.
- English-only, honest numbers, and never a PlayStation logo or glyph — line marks are generic (Lucide) or self-drawn (`PlatinumTrophyIcon`).

## Colors

The palette is paper-derived: white and frost neutrals as ground, near-black ink for text and action, PlayStation square-magenta for selection, PlayStation triangle-green for live numbers, and a warm amber/ember family reserved for podium metal.

### Primary
- **Ink Black** (`hsl(0 0% 10%)`, `--primary`): CTA fills (Upload, Sign In, Submit), links, active nav-pill text, rank-chip digits, the submit-plate dashed slot, text caret. The working black of the interface, echoing the PS1 shell.
- **Square Magenta** (`hsl(322 100% 44%`, `--ps-pink` / `--ring`): the selection signal everywhere — focus outline (2px + 2px offset), text-selection tint (0.22), button focus ring, the resting-selection halo. Never a decorative fill.
- **Bloom Glow** (`hsl(322 100% 65%)` at 0.8): the 3px halo ring inside `--bloom`. It only ever means "this plate is the one you're on".
- **Sky White** (`hsl(0 0% 98%)`, `--primary-foreground`): text on ink-black fills.

### Secondary
- **Dusk Amber** (`hsl(38 88% 42%)` and bright sibling `hsl(38 88% 45%)`): the crown family — Hall of Fame award icon, champion ring (0.65 alpha) and avatar border (0.8 alpha). Chrome gold exists only at the podium; the race clock's amber lives in the field itself, not on surfaces.
- **Circle Red** (`hsl(4 100% 45%)`, `--destructive`): the vote heart and destructive actions only. Nothing else wears red.
- **Triangle Green** (`hsl(147 100% 32%)`, `--ps-green` / `.text-live`): only live counts and states — vote totals, "polls close in…", podium vote figures. Green means "this number is moving". Small text uses the darker `--live` step (`hsl(147 100% 24%)`) to clear WCAG AA on paper; Night keeps the luminous `hsl(147 70% 55%)` pair.

### Tertiary (podium metals)
- **Sunrise Gold family** (`hsl(44 92% 90%)` ground at 0.8, `hsl(30 72% 32%)` / `hsl(30 72% 30%)` ink): 1st place. Champion is the only rank wearing `--champion-aura` (`shadow-champion`).
- **Console Silver** (`hsl(211 30% 55%)` ring at 0.5, `hsl(211 45% 32%)` ink, cloud-mat ground): 2nd place.
- **Ember Bronze** (`hsl(24 55% 45%)` ring at 0.5, `hsl(24 60% 34%)` ink, `hsl(28 65% 93%)` ground): 3rd place.

### Neutral
- **Cloud** (`hsl(210 60% 98%)`, `--background`): the declared ground; in practice the body is transparent over the graph-paper field, and `--background` fills dialogs/sheets.
- **Frost** (`hsl(210 60% 99%)`): material alpha, never a flat fill — 0.74 (`.panel` chrome) and 0.92 (`.panel-solid` content), both `blur(18px) saturate(1.3)`.
- **Ink** (`hsl(212 38% 16%)`, `--foreground`): all primary text; also the modal scrim at 0.55 with a light backdrop blur, and the spoiler veil at 0.86.
- **Ink Secondary** (`hsl(211 22% 36%)`, `--muted-foreground`): secondary text and the `.field-mark` color.
- **Deep Ink** (`hsl(211 40% 20%)`, `--secondary-foreground`): text on frost-filled buttons and pills.
- **Cloud Mat** (`hsl(206 45% 94%)`, podium fills): the letterbox mat behind contained screenshots and 2nd-place ground.
- **Haze** (`hsl(205 48% 91%)`, `--secondary`) and **Ice Mist** (`hsl(203 72% 88%)`, `--accent`): quiet fills for chips/selected-list states.
- **Hairline** (`hsl(206 30% 82%)`, `--border` / `--input`): default 1px border and dashed-slot fallbacks.
- **Cloud Edge** (`hsl(207 36% 84%)`): the `.panel-solid` border — the frost sheet's own seam.
- **Scrollbar Ink** (`hsl(207 30% 58%)`, hover `hsl(207 32% 44%)`): browser chrome stays in-world (thin, transparent track, 10px radius thumb).
- **Ink Shadow** (`hsl(207 60% 28%)`): the only drop-shadow tint in the world — `--lift` at 0.4, `--bloom`'s drop at 0.45, panel drop in `hsl(209 60% 22%)` at 0.4. Shadows here are blue-inked, never black.

### Race Phase Fields (`src/lib/race.ts`)
- **Glow Pink** (`hsl(322 100% 44% / 0.06)`): the fixed top-left wash of the field — the square's light, never a fill.
- **Glow Green** (`hsl(147 100% 32% / 0.05)`): the fixed bottom-right wash — the triangle's light.
- The field is phase-independent: the race clock reaches the copy (days-left line), not the sky. `viewport.themeColor` is `#ffffff`.

### Named Rules
**The Duotone Discipline Rule.** Magenta only ever means selection; green only ever means a live count or state. A third saturated accent is never introduced, and neither color is ever used as a decorative fill.

**The Night Console.** The same world after lights-out, switched by a header button that cycles light -> dark -> system (next-themes, class on `<html>`, default system). It is not a second design: every token flips to its night twin — ground `hsl(212 38% 10%)` (`night-ground`), dark frost `hsl(212 34% 13%)` (`night-panel`), veils `hsl(212 30% 18%)`, edges `hsl(212 25% 26%)`, muted text `hsl(211 22% 70%)` — and the chrome inverts (CTAs become sky-white with ink text via the swapped `--primary` pair). The duotone holds its meaning: magenta still selects (`--ice` lifts to `hsl(322 100% 58%)`), green still lives and brightens to `hsl(147 70% 55%)` to keep its contrast on the dark ground. Pills that sit on screenshots (rank chips) stay physically white in both themes (`.photo-chip`: white 0.85 ground, ink-void text).
**The No-Marks Rule.** No PlayStation logos, glyphs, or trademarked shapes are ever reproduced. Marks are generic line icons or the self-drawn `PlatinumTrophyIcon`. It is a fan community product and says so plainly.
**The One Selection Rule.** Hover, focus, and resting selection all render the identical `--bloom` treatment. If a screen shows two blooms, one is wrong — the active (hovered/focused) plate always wins: while the pointer or keyboard works inside the row, the resting `[data-selected]` plate steps back to its `--lift` so only the active one blooms.

## Typography

**Display/Body Font:** Mulish (weights 300/400/600/700/800), the single family — `--font-headline` is an alias of `--font-body` in the theme layer.
**Label/Mono Font:** none distinct; Mulish with `tabular-nums` (`.tabular`) for every count.

**Character:** the browse screen's voice is weight and tracking, not typefaces. A light 300 hero sounds like a console welcome; 700s run the pages; 11px/0.22em micro-caps read as system data labels.

### Hierarchy
- **Display** (300, 2.25→3.75rem, leading 1.08, tracking tight): the home hero line only ("Show your platinum to the world."), inside an overflow-masked block for the boot reveal.
- **Headline** (700, 2.25→3rem, tracking tight): page titles (Explore, Hall of Fame), text-balance.
- **Subhead** (700, 1.5→2.25rem): section titles inside frost shells (Latest platinums, CTA, podium ranks, Rest of the Top 10).
- **Title** (600, 1→1.5rem): game names on cards, detail-panel headings.
- **Body** (400, 1rem, 1.6) / **Small** (400/600, 0.875rem): descriptions, card meta.
- **Nav** (600, 15px): header pills, `rounded-full px-4 h-10`.
- **Label / micro-caps** (600–700, 11px–12px): `.field-mark` is 11px / 700 / 0.22em / uppercase / `hsl(211 22% 36%)`; badges and rank chips are 12px bold.

### Named Rules
**The One Family Rule.** Mulish only. A second face is never introduced for "display" effect.
**The Tracked Caps Are Data Rule.** Letter-spaced uppercase exists only as data labels: month name, PLATFORM/Achieved-on keys, rank chips' context, countdown line, spoiler status, footer column heads, keyboard hint. Never a kicker above a heading.
**The Vote Is a Number Rule.** Every count (votes, plates, days left, rank) renders with `tabular-nums`; numbers must not jitter as they tick.

## Layout

- Container: full width, `max-width: 1400px` (`--container-2xl`), `padding-inline: 2rem`.
- Home first viewport: `min-height: calc(100dvh - 4rem)`; month strip floats at top, centered title/subtitle block, the race row as the hero, and the hint micro-caps beneath it from `sm` up (touch screens get no keyboard hint). The field is the page; the race row is the hero. When the current month is thin the row fills to eight with the community's all-time most-voted, spoiler-free plates (real votes from earlier months, their chip reading `★ N` instead of a rank); a month with no votes at all gets a caption ("No votes in {month} yet — showing the community's most-voted plates"). The podium stays strictly monthly — this month's top 3, or the frozen "Last month's podium" from the `MonthlyResult` snapshot when the fresh board is too thin — and the month strip still reports the current month's real zeros. Spoiler-protected plates never occupy the row (locked tiles are a tease on a browse screen).
- Race row: `.race-row` (`px-8 sm:px-24 pb-16 pt-6`) hosting a `.race-track` flex of 256px plates (288px at `sm`, 20px `mr-5` gutters), duplicated once for the seamless 50s marquee; both edges dissolve into the field through an alpha mask (transparent -> solid at 4%/96%), and no scrollbar ever shows (`scrollbar-width: none`) — the row stays wheel/touch/arrow scrollable; the duplicate set is `aria-hidden`, untabbable, and `display:none` once static. Auto-play: `overflow-x-hidden`; after take-over (`data-static`): `overflow-x-auto` + `snap-x snap-proximity` (duplicates hidden). The submit-plate slot always ends each half. Spoiler-protected plates never occupy the home row; rank chips keep true standing.
- Below the hero, the home is a `.stack-deck` of four `.stack-card` frost shells (explainer + real stats, this month's podium with real top-3 and links, latest platinums masonry, the submit CTA): each card `position: sticky` at `top: calc(--stack-top + --stack-i * --stack-paso)` with `--stack-paso: 1.25rem` (0.75rem on mobile), `gap: 3rem` (1.75rem on mobile) and deck bottom padding for real travel, a one-screen `max-height` cap + `overflow: hidden` so the cascade can never bury content, a solid top border, and `--card` shadow, so the next card deals over the previous as you scroll. The tall latest-plates card fades into its capped edge with a `.stack-fade` bottom gradient; the explainer's monthly stats sit in a compact one-row panel so the card fits. Other below-fold pages keep frost shells (`panel` / `panel-solid`, `rounded-2xl`, p-6 → p-10) with `scroll-mt-24` anchors; vertical rhythm in Tailwind steps (gap-6/gap-8, pb-16/pb-20, `section` = 64px).
- Gallery: CSS multi-columns masonry — 1 / 2 (sm) / 3 (lg) / 4 (xl), gap 24px, cards keep their natural aspect ratio.
- Detail page: full site container (max 1400px); 3/5 image + 2/5 solid-frost info panel at `md` (`grid-cols-5`), so the screenshot dominates and the panel breathes.
- Hall of Fame: podium is a 3-up `items-end` grid at `md` with champion lifted 12 steps (`-translate-y-12`); ranks 4–10 as list rows capped by the section-divider pill heading.
- Auth: chromeless 50/50 split at `lg`; form lives in a `panel rounded-2xl p-8` capped at `max-w-sm`.
- About: kicker + display statement, a strip of four `.panel` counters fed by real Prisma aggregates (`getCommunityStats`), two mission panels in frost, the five-step How It Works (neutral frost circles with ink lucide icons and `field-mark` numbers — no external media), four "rules of the board" chips, and a closing CTA panel; all copy stays claim-free (real numbers only).
- Pricing: kicker + statement, three frost cards (Free in `panel-solid` as the current plan — 3 uploads/month, watermarked; PRO at 7€/month and PLATINUM as honest "Coming soon" with disabled buttons), a "what Supporters will never get" panel (no paid votes, ranks or shortcuts), a tip-jar panel (Ko-fi/PayPal, coming soon, unlocks nothing) and a note that nothing is purchasable until billing exists. Upload quotas and watermark entitlements live in `src/lib/plans.ts` — the single source of truth. Free/watermark FAQ answers deep-link here; footer Links column carries it.
- Upload: under the card description a quota line — plan `field-mark` chip plus the live-green "N of M uploads left this month" (or "Unlimited uploads this month"); at 0 the submit button reads "Monthly limit reached" and the line offers the Pricing deep link. The watermark row shows the visitor's real plan chip and reflects `planConfig(plan).watermark` (locked checkbox, never editable).
- Header: sticky `h-16` frost bar that tucks away (`translateY(-100%)`, 300ms `--ease-bloom`) on scroll-down past 96px and returns on scroll-up; `:focus-within` always reveals it and reduced-motion disables the behavior. Footer: the console's black shell (`ink-void`, both themes) — sky-white text, `white/70` links, `night-muted` field-marks, 3 columns at `md`.

## Elevation & Depth

Layered frosts on light: the graph-paper field sits at `z-index: -10` fixed behind everything, translucent chrome floats above it, solid frost carries content, and white pills sit on top of that. Depth is declared with blue-inked diffuse shadows (never black, never hard-offset) and the magenta bloom marks selection. When a plate blooms, the field itself steps back — `body[data-bloom='deep']` blurs the field 6px and bumps saturation while the row is hovered/focused.

### Shadow Vocabulary
- **Lift** (`--lift`: `0 14px 34px -22px hsl(207 60% 28% / 0.4)`): resting elevation on plates, cards, primary buttons, active nav pill.
- **Bloom** (`--bloom`: `0 0 0 3px hsl(322 100% 65% / 0.8), 0 22px 48px -20px hsl(207 60% 28% / 0.45)`): the single selection/hover state, always paired with `translateY(-10px) scale(1.04)`.
- **Panel Drop** (`0 18px 42px -30px hsl(209 60% 22% / 0.4)`): the `.panel` frost's own soft drop.
- **Champion Aura** (`--champion-aura`: `0 16px 40px -22px hsl(38 90% 42% / 0.45)`): amber drop, Hall of Fame 1st place only (legacy token, remapped warm in the new world).
- **Ink Scrim** (`hsl(212 38% 16% / 0.55)` + `backdrop-blur-sm`): dialog/sheet/alert overlays — the only dark thing in the world, and it is a veil, not a surface.

### Named Rules
**The Blue-Ink Shadow Rule.** Every shadow tints from `hsl(207 60% 28%)` (or its amber champion exception). Black shadows do not belong on cloud.
**The Field Steps Back Rule.** Selection dims the environment: while the browse row holds focus, the field blurs to 6px so the bloomed plate is the brightest thing on screen.

## Shapes

Base radius is 10px (`--radius: 0.625rem`); derived steps: 6 / 8 / **10** / 14 / 16, plus full pills. The 10px step (`lg`, the chip/dialog radius) covers dialog & sheet corners and the literal scrollbar-thumb radius; badges read as 8px chips at `rounded-md`; browse plates are 14px (`rounded-xl`); frost cards and section shells are 16px (`rounded-2xl`); buttons, nav pills, rank chips, the month strip, and the "Rest of the Top 10" pill are fully round. Borders are frost-white (`hsl(0 0% 100% / 0.65)` on `.panel`) or cloud-edge (`hsl(207 36% 84%)` on `.panel-solid`); plates carry a 1px white ring; the submit slot is the only dashed shape (2px, ink-black at 0.35, solidifying to 0.70 on hover). Spoiler treatment is frost, not black-out: image blurred 22px and scaled 1.08 under a `hsl(210 60% 99% / 0.42)` frosted veil (full cards use a 0.86 veil with `blur(10px)` frost on the row tile).

## Components

### Buttons (all pill, 15px-16px bold type, 40px tall; sm 36 / lg 48)
- **Primary:** ink-black fill, sky-white text, resting `--lift`, hover escalates to `--bloom`; focus-visible = 2px ring `--ring` + 2px offset.
- **Outline (the frost button):** `hsl(0 0% 100% / 0.65)` + `backdrop-blur`, white 70% border, deep-ink text; hover to white 95% + lift. The default secondary everywhere (Sign in, Load more, Reveal screenshot).
- **Secondary:** white 85% with a 1px white ring; **Ghost:** bare text, hover white 55%; **Link:** ink-black underline; **Destructive:** alert-red.

### Chips
- **Rank chip:** absolute on the plate's top-left, white 85% pill, 12px bold tabular `#N` in ink-black, backdrop-blurred.
- **Platform badge:** outline chip, `rounded-md`, `text-xs font-semibold`, ink text — a data chip, never a colored tag.

### Cards / Containers
- **Frost card (`.panel-solid`):** 92% frost, cloud-edge border, 16px corners, `--lift`; gallery cards add a uniform 500ms mount fade (`animate-in fade-in slide-in-from-bottom-3 duration-500`) — deliberately no per-card stagger — and hover to `--bloom` (shadow only; the image scales 1.02).
- **"Pride of the Collection":** `ring-2 ring-primary/60` plus a top banner (primary at 10% ground, 12px bold 0.14em uppercase).
- **Section shells:** 74% `.panel` with rounded-2xl and p-6→p-10 (home below-fold, explore filter card, header, footer).

### Browse Plate + Race Row (signature)
- Tile: 16:9 plate, 14px corners, white ring, resting lift. Bloom (hover, focus-visible, or `[data-selected]`) lifts it 10px at 1.04 with the ice ring; the plate itself carries no caption — game, hunter and votes live in the link's `aria-label` and on the detail page. Selection is *resting*: it persists without a mouse and is moved by Arrow keys with `scrollIntoView` centering; the last slot is always the dashed Submit plate. Row hover/focus deepens the field blur.

### Dialogs / Sheets / Alerts
- Ink scrim + light blur; content is `--background` with 1px border and 10px corners; sheets slide from the right at `w-72` for mobile nav (same pill list, full-width active pill).

### Navigation
- Sticky frost bar, `h-16`; pills 15px/600, idle `text-secondary-foreground/80` with white-50 hover; **active** = `pathname === link.href` exact match → white 85% pill, ink-black text, lift, white ring, `aria-current="page"`. Upload is the only filled pill in the bar.

### Inputs / Browser Surfaces
- Inputs take the hairline border and 8px radius; caret is ink-black; text selection is magenta at 0.22 over ink-black; scrollbars are thin, ink thumbs (58% → 44% on hover) on transparent tracks. Global fallback focus: 2px ice outline, 2px offset.

### Vote Control
- Ghost button + heart; unvoted muted-ink, hover/voted alert-red (filled heart at scale 1.1); press fires the one micro-animation in the system — a 1→1.5→1 heart pop over 0.5s. Tabular count beside it.

## Do's and Don'ts

### Do:
- **Do** keep every surface light in the day world: frost on cloud, ink text; the only dark layer is the modal scrim (`hsl(212 38% 16% / 0.55)`). In the Night Console the same discipline inverts: dark frost on ink-navy ground, sky-white text.
- **Do** keep the field fixed (paper, masked grid, whisper duotone glows); the only thing `race.ts` drives is the days-left copy — no surface picks weather.
- **Do** use the single `--bloom` treatment for hover, focus, and resting selection, and keep exactly one resting selection per browse row.
- **Do** reserve `.field-mark` (11px/700/0.22em) for data labels and render every changing count with `tabular-nums`.
- **Do** use the two frosts correctly: 74% `.panel` for chrome, 92% `.panel-solid` for content surfaces.
- **Do** show screenshots at native aspect ratio (contained on a cloud mat when the shape matters, as on the podium).
- **Do** state real database counts or say the board is empty ("be the first plate of {month}") — live honesty is part of the world.
- **Do** honor `prefers-reduced-motion` (and `?motion=off`): static field, no hover lift, no blur, no intro, marquee and sticky-deck degrade to plain scroll, selection stays the magenta ring alone.

### Don't:
- **Don't** reintroduce dark chrome, black panels, or black shadows — depth tints from `hsl(207 60% 28%)`.
- **Don't** put kickers/eyebrows above headings; tracked caps are data, not decoration.
- **Don't** reproduce PlayStation logos, glyphs, or the button symbols; fan product, own marks.
- **Don't** invent social proof, launch claims, or fake counts.
- **Don't** add looping or ambient motion beyond the marquee (which yields to the visitor); the intro fires once and `clearProps` so bloom keeps working.
- **Don't** paint the field with gradients or phase skies — flat paper, whisper glows, masked grid, full stop.
- **Don't** stagger platinum-card mount fades; the uniform 500ms wash is the deliberate choice.
- **Don't** let red (vote/destructive) or the amber podium family wander off their reserved jobs.
- **Don't** build new surfaces on the last two legacy utilities (`section-divider`, `shadow-champion`); they survive only for hall-of-fame and retire when it rebuilds.

## Legacy & Reserved (carried, not canonized)

`--chart-1…5` are defined in `:root` with no component consumers: a reserved data-viz series, not brand colors. `--ice-soft` is the defined soft step of the magenta family with no consumer yet. The race clock no longer reaches the DOM as a visual phase — `getRaceState` supplies only `daysLeft` and `monthLabel` for copy. The cloud mat and the dusk-amber crown family are real tokens (`--cloud-mat`, `--dusk-amber`, `--dusk-amber-bright`, mapped as `--color-mat`/`--color-dusk`/`--color-dusk-bright`) instead of inline `hsl()` values. (The old `.platinum-text`/`.platinum-plate`/`.platinum-edge`/`.stage-light` utilities and their `--platinum*`/`--spot*` remaps had no consumers and were deleted; the unused `ui/carousel.tsx` and the deprecated `PlatinumCard` `top` variant — the last black-gradient surface, which the world forbids — are gone too.)
