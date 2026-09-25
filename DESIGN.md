---
name: Platinum Showcase
description: The Console Browse Screen — a light, XMB-inspired browse field whose sky tracks the live monthly race clock.
colors:
  cloud: "hsl(210 60% 98%)"
  frost: "hsl(210 60% 99%)"
  ink: "hsl(212 38% 16%)"
  ink-void: "hsl(212 38% 14%)"
  ink-secondary: "hsl(211 22% 36%)"
  ink-deep: "hsl(211 40% 20%)"
  sky-white: "hsl(210 80% 98%)"
  console-blue: "hsl(209 62% 32%)"
  ice: "hsl(203 92% 52%)"
  ice-soft: "hsl(203 88% 74%)"
  bloom-glow: "hsl(203 95% 68%)"
  ink-shadow: "hsl(207 60% 28%)"
  cloud-mat: "hsl(206 45% 94%)"
  haze: "hsl(205 48% 91%)"
  ice-mist: "hsl(203 72% 88%)"
  hairline: "hsl(206 30% 82%)"
  cloud-edge: "hsl(207 36% 84%)"
  scrollbar-ink: "hsl(207 30% 58%)"
  scrollbar-ink-deep: "hsl(207 32% 44%)"
  alert-red: "hsl(0 62% 42%)"
  dusk-amber: "hsl(38 88% 42%)"
  dusk-amber-bright: "hsl(38 88% 45%)"
  sunrise-cream: "hsl(44 92% 90%)"
  champion-ink: "hsl(30 72% 32%)"
  runner-silver: "hsl(211 30% 55%)"
  ember-bronze: "hsl(24 55% 45%)"
  ember-ink: "hsl(24 60% 34%)"
  platinum-steel: "hsl(206 28% 52%)"
  platinum-glint: "hsl(203 60% 84%)"
  platinum-ghost: "hsl(208 20% 42%)"
  chart-1: "hsl(203 72% 44%)"
  chart-2: "hsl(28 88% 52%)"
  chart-3: "hsl(168 44% 38%)"
  chart-4: "hsl(44 88% 52%)"
  chart-5: "hsl(248 36% 58%)"
  race-top: "hsl(202 82% 94%)"
  race-mid: "hsl(203 64% 85%)"
  race-low: "hsl(206 48% 73%)"
  race-wave-a: "hsl(204 72% 91%)"
  race-wave-b: "hsl(208 42% 64%)"
  race-glow: "hsl(203 90% 62%)"
  closing-top: "hsl(38 78% 91%)"
  closing-mid: "hsl(27 68% 82%)"
  closing-low: "hsl(210 34% 64%)"
  closing-wave-a: "hsl(40 84% 88%)"
  closing-wave-b: "hsl(212 30% 56%)"
  closing-glow: "hsl(28 92% 58%)"
  final-top: "hsl(44 92% 88%)"
  final-mid: "hsl(30 82% 76%)"
  final-low: "hsl(214 38% 54%)"
  final-wave-a: "hsl(46 95% 84%)"
  final-wave-b: "hsl(218 34% 48%)"
  final-glow: "hsl(38 96% 55%)"
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
    backgroundColor: "{colors.console-blue}"
    textColor: "{colors.sky-white}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.console-blue}"
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
    textColor: "{colors.console-blue}"
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
    textColor: "{colors.console-blue}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 16px"
---

# Design System: Platinum Showcase

## Overview

**Creative North Star: "The Console Browse Screen"**

The site is the community's own console browse screen: a living sky you scroll across, frosted system panels for chrome, and plates that bloom when selection rests on them. It refuses the dark-gallery hero completely — the world is bright, cloud-lit, and quiet, and the trophy screenshots carry all the visual weight. Depth and heat come from the clock: the field's light tracks the real race state (cold sky when the month opens, amber dusk in the final week, sunrise gold in the last 48 hours), so the showcase reads as a living monthly event rather than a static archive.

Materials are the identity. Two frosts — a 74% translucent `.panel` for chrome (header, footer, section shells) and a 92% `.panel-solid` for content you read (month strip, captions, cards) — sit over a full-bleed canvas wave field. Ink-blue text on cloud-white grounds replaces the old dark chrome entirely. Selection has exactly one language: the ice bloom — a 3px `hsl(203 95% 68% / 0.8)` ring plus an ink-tinted lift shadow, with the tile rising 10px at 1.04 scale — and unlike a hover-only system, a browse screen always holds a resting selection, moved by arrow keys.

**Key Characteristics:**
- Light world: cloud grounds (`hsl(210 60% 98%)`), ink text (`hsl(212 38% 16%)`), frost panels; no dark chrome anywhere.
- The sky is never chosen by a surface: `src/lib/race.ts` derives the phase palette from days-left (≤2 final, ≤7 closing, else race) and hands it to the canvas field.
- One selection language: the ice bloom (`--bloom`), shared by hover, focus-visible, and the resting `[data-selected]` plate.
- Mulish is the only family; `--font-headline` aliases `--font-body`. The voice is weight and tracking, not a second face.
- Tracked micro-caps (11px, 0.22em) survive only as data labels — month name, PLATFORM, rank/status, countdown, footer column heads — never as kickers above headings.
- All real motion is action-triggered or once-only: a console-boot intro that plays one time, scroll reveals that fire once, bloom-on-select, a uniform 500ms card mount fade with deliberately no per-card stagger. The ambient field is near-still (20fps, imperceptible drift, pauses when the tab hides, paints one static frame under reduced motion).
- English-only, honest numbers, and never a PlayStation logo or glyph — line marks are generic (Lucide) or self-drawn (`PlatinumTrophyIcon`).

## Colors

The palette is sky-derived: cloud and frost neutrals as ground, ink blues for text and action, one ice blue for selection, and a warm amber/ember family reserved for closing heat and podium metal.

### Primary
- **Console Blue** (`hsl(209 62% 32%)`, `--primary`): CTA fill, links, active nav-pill text, rank-chip digits, vote counts in captions, the submit-plate dashed slot, text caret. The deep working blue of the interface.
- **Ice Blue** (`hsl(203 92% 52%)`, `--ice` / `--ring`): global focus outline (2px + 2px offset), text-selection tint (at 0.32 alpha), button focus ring. The "selection" signal, never a decorative fill.
- **Bloom Glow** (`hsl(203 95% 68%)` at 0.8): the 3px halo ring inside `--bloom`. It only ever means "this plate is the one you're on".
- **Sky White** (`hsl(210 80% 98%)`, `--primary-foreground`): text on console-blue fills.

### Secondary
- **Dusk Amber** (`hsl(38 88% 42%)` and bright sibling `hsl(38 88% 45%)`): the crown family — Hall of Fame award icon, champion ring (0.65 alpha) and avatar border (0.8 alpha). Chrome gold exists only at the podium; the race clock's amber lives in the field itself, not on surfaces.
- **Alert Red** (`hsl(0 62% 42%)`, `--destructive`): the vote heart and destructive actions only. Nothing else wears red. There is no success-green in this world; confirmations are neutral frost + ice.

### Tertiary (podium metals)
- **Sunrise Gold family** (`hsl(44 92% 90%)` ground at 0.8, `hsl(30 72% 32%)` / `hsl(30 72% 30%)` ink): 1st place. Champion is the only rank wearing `--champion-aura` (`shadow-champion`).
- **Console Silver** (`hsl(211 30% 55%)` ring at 0.5, `hsl(211 45% 32%)` ink, cloud-mat ground): 2nd place.
- **Ember Bronze** (`hsl(24 55% 45%)` ring at 0.5, `hsl(24 60% 34%)` ink, `hsl(28 65% 93%)` ground): 3rd place.

### Neutral
- **Cloud** (`hsl(210 60% 98%)`, `--background`): the declared ground; in practice the body is transparent over the canvas field, and `--background` fills dialogs/sheets.
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
- **Cold Sky (race)** (`top hsl(202 82% 94%)`, `mid hsl(203 64% 85%)`, `low hsl(206 48% 73%)`, `waveA hsl(204 72% 91%)`, `waveB hsl(208 42% 64%)`, `glow hsl(203 90% 62%)`): month just opened.
- **Amber Dusk (closing, ≤7 days)** (`hsl(38 78% 91%)` → `hsl(27 68% 82%)` → `hsl(210 34% 64%)`, waves `hsl(40 84% 88%)` / `hsl(212 30% 56%)`, glow `hsl(28 92% 58%)`): the light goes warm as polls near close.
- **Sunrise Gold (final, ≤2 days)** (`hsl(44 92% 88%)` → `hsl(30 82% 76%)` → `hsl(214 38% 54%)`, waves `hsl(46 95% 84%)` / `hsl(218 34% 48%)`, glow `hsl(38 96% 55%)`): crown day; the gold lives in the sky, the chrome stays ice.
- The canvas lerps between palettes (2% per frame); no surface picks its own weather. `viewport.themeColor` is `#e3f1f8`.

### Named Rules
**The Heat Rule.** The field's light escalates with the race clock — cold sky, amber dusk, sunrise gold — and it is the only place amber is allowed to flood the screen. Surfaces keep the same inks in every phase.
**The No-Marks Rule.** No PlayStation logos, glyphs, or trademarked shapes are ever reproduced. Marks are generic line icons or the self-drawn `PlatinumTrophyIcon`. It is a fan community product and says so plainly.
**The One Selection Rule.** Hover, focus, and resting selection all render the identical `--bloom` treatment. If a screen shows two blooms, one is wrong.

## Typography

**Display/Body Font:** Mulish (weights 300/400/600/700/800), the single family — `--font-headline` is an alias of `--font-body` in the theme layer.
**Label/Mono Font:** none distinct; Mulish with `tabular-nums` (`.tabular`) for every count.

**Character:** the browse screen's voice is weight and tracking, not typefaces. A light 300 hero sounds like a console welcome; 700s run the pages; 11px/0.22em micro-caps read as system data labels.

### Hierarchy
- **Display** (300, 2.25→3.75rem, leading 1.08, tracking tight): the home hero line only ("Show your platinum to the world."), inside an overflow-masked block for the boot reveal.
- **Headline** (700, 2.25→3rem, tracking tight): page titles (Explore, Hall of Fame), text-balance.
- **Subhead** (700, 1.5→2.25rem): section titles inside frost shells (Latest platinums, CTA, podium ranks, Rest of the Top 10).
- **Title** (600, 1→1.5rem): game names on cards, detail-panel headings.
- **Body** (400, 1rem, 1.6) / **Small** (400/600, 0.875rem): descriptions, card meta, captions.
- **Nav** (600, 15px): header pills, `rounded-full px-4 h-10`.
- **Label / micro-caps** (600–700, 11px–12px): `.field-mark` is 11px / 700 / 0.22em / uppercase / `hsl(211 22% 36%)`; badges and rank chips are 12px bold.

### Named Rules
**The One Family Rule.** Mulish only. A second face is never introduced for "display" effect.
**The Tracked Caps Are Data Rule.** Letter-spaced uppercase exists only as data labels: month name, PLATFORM/Achieved-on keys, rank chips' context, countdown line, spoiler status, footer column heads, keyboard hint. Never a kicker above a heading.
**The Vote Is a Number Rule.** Every count (votes, plates, days left, rank) renders with `tabular-nums`; numbers must not jitter as they tick.

## Layout

- Container: full width, `max-width: 1400px` (`--container-2xl`), `padding-inline: 2rem`.
- Home first viewport: `min-height: calc(100dvh - 4rem)`; month strip floats at top, centered title/subtitle block, the race row as the hero, and the hint micro-caps beneath it. The field is the page; the race row is the hero.
- Race row: horizontal scroll (`overflow-x-auto px-8 sm:px-12 pb-16 pt-6`), flex `gap-5` (20px), `snap-x snap-proximity`, plates fixed at 256px (288px at `sm`), the submit-plate slot always last.
- Below-fold sections sit in frost shells (`panel` / `panel-solid`, `rounded-2xl`, p-6 → p-10) with `scroll-mt-24` anchors; vertical rhythm in Tailwind steps (gap-6/gap-8, pb-16/pb-20, `section` = 64px).
- Gallery: CSS multi-columns masonry — 1 / 2 (sm) / 3 (lg) / 4 (xl), gap 24px, cards keep their natural aspect ratio.
- Detail page: 2/3 image + 1/3 solid-frost info panel at `md`, `max-w-4xl`.
- Hall of Fame: podium is a 3-up `items-end` grid at `md` with champion lifted 12 steps (`-translate-y-12`); ranks 4–10 as list rows capped by the section-divider pill heading.
- Auth: chromeless 50/50 split at `lg`; form lives in a `panel rounded-2xl p-8` capped at `max-w-sm`.
- Header: sticky `h-16` frost bar; footer: frost panel, 3 columns at `md`.

## Elevation & Depth

Layered frosts on light: the canvas field sits at `z-index: -10` fixed behind everything, translucent chrome floats above it, solid frost carries content, and white pills sit on top of that. Depth is declared with blue-inked diffuse shadows (never black, never hard-offset) and the ice bloom marks selection. When a plate blooms, the field itself steps back — `body[data-bloom='deep']` blurs the canvas 7px and bumps saturation while the row is hovered/focused.

### Shadow Vocabulary
- **Lift** (`--lift`: `0 14px 34px -22px hsl(207 60% 28% / 0.4)`): resting elevation on plates, cards, primary buttons, active nav pill.
- **Bloom** (`--bloom`: `0 0 0 3px hsl(203 95% 68% / 0.8), 0 22px 48px -20px hsl(207 60% 28% / 0.45)`): the single selection/hover state, always paired with `translateY(-10px) scale(1.04)`.
- **Panel Drop** (`0 18px 42px -30px hsl(209 60% 22% / 0.4)`): the `.panel` frost's own soft drop.
- **Champion Aura** (`--champion-aura`: `0 16px 40px -22px hsl(38 90% 42% / 0.45)`): amber drop, Hall of Fame 1st place only (legacy token, remapped warm in the new world).
- **Ink Scrim** (`hsl(212 38% 16% / 0.55)` + `backdrop-blur-sm`): dialog/sheet/alert overlays — the only dark thing in the world, and it is a veil, not a surface.

### Named Rules
**The Blue-Ink Shadow Rule.** Every shadow tints from `hsl(207 60% 28%)` (or its amber champion exception). Black shadows do not belong on cloud.
**The Field Steps Back Rule.** Selection dims the environment: while the browse row holds focus, the sky blurs to 7px so the bloomed plate is the brightest thing on screen.

## Shapes

Base radius is 10px (`--radius: 0.625rem`); derived steps: 6 / 8 / **10** / 14 / 16, plus full pills. The 10px step (`lg`, the chip/dialog radius) covers dialog & sheet corners and the literal scrollbar-thumb radius; badges read as 8px chips at `rounded-md`; browse plates are 14px (`rounded-xl`); frost cards and section shells are 16px (`rounded-2xl`); buttons, nav pills, rank chips, the month strip, and the "Rest of the Top 10" pill are fully round. Borders are frost-white (`hsl(0 0% 100% / 0.65)` on `.panel`) or cloud-edge (`hsl(207 36% 84%)` on `.panel-solid`); plates carry a 1px white ring; the submit slot is the only dashed shape (2px, console-blue at 0.35, solidifying to 0.70 on hover). Spoiler treatment is frost, not black-out: image blurred 22px and scaled 1.08 under a `hsl(210 60% 99% / 0.42)` frosted veil (full cards use a 0.86 veil with `blur(10px)` frost on the row tile).

## Components

### Buttons (all pill, 15px-16px bold type, 40px tall; sm 36 / lg 48)
- **Primary:** console-blue fill, sky-white text, resting `--lift`, hover brightens 110% and escalates to `--bloom`; focus-visible = 2px ring `--ring` + 2px offset.
- **Outline (the frost button):** `hsl(0 0% 100% / 0.65)` + `backdrop-blur`, white 70% border, deep-ink text; hover to white 95% + lift. The default secondary everywhere (Sign in, Load more, Reveal screenshot).
- **Secondary:** white 85% with a 1px white ring; **Ghost:** bare text, hover white 55%; **Link:** console-blue underline; **Destructive:** alert-red.

### Chips
- **Rank chip:** absolute on the plate's top-left, white 85% pill, 12px bold tabular `#N` in console-blue, backdrop-blurred.
- **Platform badge:** outline chip, `rounded-md`, `text-xs font-semibold`, ink text — a data chip, never a colored tag.

### Cards / Containers
- **Frost card (`.panel-solid`):** 92% frost, cloud-edge border, 16px corners, `--lift`; gallery cards add a uniform 500ms mount fade (`animate-in fade-in slide-in-from-bottom-3 duration-500`) — deliberately no per-card stagger — and hover to `--bloom` (shadow only; the image scales 1.02).
- **"Pride of the Collection":** `ring-2 ring-primary/60` plus a top banner (primary at 10% ground, 12px bold 0.14em uppercase).
- **Section shells:** 74% `.panel` with rounded-2xl and p-6→p-10 (home below-fold, explore filter card, header, footer).

### Browse Plate + Race Row (signature)
- Tile: 16:9 plate, 14px corners, white ring, resting lift. Bloom (hover, focus-visible, or `[data-selected]`) lifts it 10px at 1.04 with the ice ring while the frosted caption panel (`panel-solid`, game / @user · platform / votes) rises 10px under it. Selection is *resting*: it persists without a mouse and is moved by Arrow keys with `scrollIntoView` centering; the last slot is always the dashed Submit plate. Row hover/focus deepens the field blur.

### Dialogs / Sheets / Alerts
- Ink scrim + light blur; content is `--background` with 1px border and 10px corners; sheets slide from the right at `w-72` for mobile nav (same pill list, full-width active pill).

### Navigation
- Sticky frost bar, `h-16`; pills 15px/600, idle `text-secondary-foreground/80` with white-50 hover; **active** = `pathname === link.href` exact match → white 85% pill, console-blue text, lift, white ring, `aria-current="page"`. Upload is the only filled pill in the bar.

### Inputs / Browser Surfaces
- Inputs take the hairline border and 8px radius; caret is console-blue; text selection is ice at 0.32 over deep ink; scrollbars are thin, ink thumbs (58% → 44% on hover) on transparent tracks. Global fallback focus: 2px ice outline, 2px offset.

### Vote Control
- Ghost button + heart; unvoted muted-ink, hover/voted alert-red (filled heart at scale 1.1); press fires the one micro-animation in the system — a 1→1.5→1 heart pop over 0.5s. Tabular count beside it.

## Do's and Don'ts

### Do:
- **Do** keep every surface light: frost on cloud, ink text; the only dark layer is the modal scrim (`hsl(212 38% 16% / 0.55)`).
- **Do** let `race.ts` pick the sky from days-left; ship the phase palette straight into the canvas and nothing else.
- **Do** use the single `--bloom` treatment for hover, focus, and resting selection, and keep exactly one resting selection per browse row.
- **Do** reserve `.field-mark` (11px/700/0.22em) for data labels and render every changing count with `tabular-nums`.
- **Do** use the two frosts correctly: 74% `.panel` for chrome, 92% `.panel-solid` for content surfaces.
- **Do** show screenshots at native aspect ratio (contained on a cloud mat when the shape matters, as on the podium).
- **Do** state real database counts or say the board is empty ("be the first plate of {month}") — live honesty is part of the world.
- **Do** honor `prefers-reduced-motion` (and `?motion=off`): static single-paint field, no hover lift, no blur, no intro, reveals skipped, selection stays the ice ring alone.

### Don't:
- **Don't** reintroduce dark chrome, black panels, or black shadows — depth tints from `hsl(207 60% 28%)`.
- **Don't** put kickers/eyebrows above headings; tracked caps are data, not decoration.
- **Don't** reproduce PlayStation logos, glyphs, or the button symbols; fan product, own marks.
- **Don't** invent social proof, launch claims, or fake counts.
- **Don't** add looping or ambient motion beyond the near-still field; intro and reveals fire once and `clearProps` so bloom keeps working.
- **Don't** stagger platinum-card mount fades; the uniform 500ms wash is the deliberate choice.
- **Don't** let red (vote/destructive) or the amber podium family wander off their reserved jobs.
- **Don't** build new surfaces on the legacy utilities (`platinum-text`, `platinum-plate`, `platinum-edge`, `stage-light`, `section-divider`, `shadow-champion`); they survive only for their last consumers (hall-of-fame's `shadow-champion` + `section-divider`) and retire when those rebuild.

## Legacy & Reserved (carried, not canonized)

`--platinum` (`hsl(206 28% 52%)`), `--platinum-bright`, `--platinum-dim` and the `.platinum-*` / `.stage-light` utilities are remapped light-world stand-ins kept until their last consumer is rebuilt — `.platinum-text`/`.platinum-plate`/`.platinum-edge`/`.stage-light` currently have no consumers at all. `--chart-1…5` are defined in `:root` with no component consumers: a reserved data-viz series, not brand colors. `--ice-soft` is the defined soft step of the ice family with no consumer yet. The race clock reaches the DOM only through the canvas palette — there are no per-phase body classes.
