---
name: Platinum Showcase
description: The Midnight Showcase — a dark gallery where platinum trophies are the exhibits.
colors:
  midnight: "hsl(224 71% 4%)"
  exhibit-panel: "hsl(224 71% 8%)"
  ink: "hsl(210 40% 98%)"
  ps-blue: "hsl(210 100% 56%)"
  muted-halo: "hsl(215 20% 65%)"
  slate-edge: "hsl(217 33% 17%)"
  platinum-metal: "hsl(210 25% 88%)"
  platinum-dim: "hsl(215 18% 62%)"
  plate-top: "hsl(224 71% 10%)"
  scroll-edge: "hsl(217 33% 24%)"
  trophy-gold: "#fbbf24"
  heart-red: "#ef4444"
  success-green: "#2ecc71"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.5rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ps-blue}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ps-blue}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card-exhibit:
    backgroundColor: "{colors.exhibit-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  chip-badge:
    backgroundColor: "transparent"
    textColor: "{colors.muted-halo}"
    rounded: "{rounded.sm}"
    padding: "2px 10px"
  plaque-champion:
    backgroundColor: "{colors.exhibit-panel}"
    textColor: "{colors.platinum-metal}"
    rounded: "{rounded.xl}"
---

# Design System: Platinum Showcase

## Overview

**Creative North Star: "The Midnight Showcase"**

The gallery is dark and quiet; the only light falls on the exhibits — the platinum screenshots themselves. Every surface decision serves one idea: a captured platinum is a museum object. The chrome (nav, filters, cards, text) recedes into deep navy and cool gray, and attention is bought with contrast and spotlight, never with decoration. The room stays dark so the metal can shine.

The identity material is **platinum**: a cool silver-white used almost nowhere, so that when it appears — champion banners, Hall of Fame placements, "Pride of the Collection" — it reads as the trophy metal it evokes. PlayStation blue is the working accent (actions, links, focus); red belongs exclusively to the heart/vote; green is reserved for success feedback. The system would pass the "lights-out test": if you turned the lights off, only the screenshots and their plaques should glow.

**Key Characteristics:**
- Screenshots are shown at native aspect ratio, never force-cropped (they are documents, not thumbnails).
- Flat at rest; scenic blue glow only on hover/focus/celebration.
- Platinum metal as a reserved material (≤5% of any screen, championship moments only).
- Outfit display type with heavy weights as the voice; Inter for everything operational.
- Dark-first: the `.dark` token set is the canonical system; the light set is vestigial.

## Colors

One working blue carries the system; everything else is a reserved specialist.

### Primary
- **PlayStation Blue** (`hsl(210 100% 56%)`): CTAs, links, focus rings, ring/primary token. The doer of the system.

### Secondary
- **Heart Red** (`#ef4444`): the vote. Voted state is red, filled, unmistakable. Nothing else wears red except destructive actions.
- **Success Green** (`#2ecc71`): success toasts only. A response color, not a brand color.

### Tertiary
- **Trophy Gold** (`#fbbf24` + amber family): Hall of Fame 1st place and legacy rank medals (gold/silver/bronze). Lives only on the podium.

### Neutral
- **Midnight** (`hsl(224 71% 4%)`): page background.
- **Exhibit Panel** (`hsl(224 71% 8%)`): cards, popovers, raised surfaces.
- **Ink** (`hsl(210 40% 98%)`): primary text.
- **Muted Halo** (`hsl(215 20% 65%)`): secondary text, labels.
- **Slate Edge** (`hsl(217 33% 17%)`): borders, inputs, secondary fills.
- **Platinum Metal** (`hsl(210 25% 88%)` with a subtle silver gradient `180deg, hsl(210 30% 94%) → hsl(215 18% 72%)`): reserved celebration material.
- **Platinum Dim** (`hsl(215 18% 62%)`): secondary tone of the metal for plates/engravings.
- **Plate Top** (`hsl(224 71% 10%)`): upper stop of the engraved plaque surface (`.platinum-plate`).
- **Scroll Edge** (`hsl(217 33% 24%)`): custom scrollbar thumb — one step above the border tone so browser chrome stays in-world.

### Named Rules
**The Platinum Reserve Rule.** Platinum metal may only appear on championship content: the monthly #1, Hall of Fame placements, and "Pride of the Collection." If a surface has no champion, it shows no metal.
**The One Light Rule.** Blue glow marks state (hover, focus, celebration), never idle decoration. A resting card emits no light.

## Typography

**Display Font:** Outfit (weights 700/900)
**Body Font:** Inter (400/500/600)
**Label/Mono Font:** none distinct; Inter at small sizes with `tabular-nums` for counts.

**Character:** Outfit's deco-free geometry at heavy weights sounds like an awards ceremony title card; Inter handles the day-to-day operation without stealing tone.

### Hierarchy
- **Display** (900, clamp 2.25–3.5rem): hero and page titles only.
- **Headline** (700, 1.875–3rem): section titles ("Hall of Fame", "Trophy Gallery").
- **Title** (600, 1.125rem): game names on cards, card headers.
- **Body** (400, 1rem, 1.6): descriptions, copy. Max measure ~70ch.
- **Label** (500, 0.875rem): form labels, badges, metadata. Vote counts use tabular figures.

### Named Rules
**The Vote Is a Number Rule.** Vote counts render in the label tier with `tabular-nums` — they are data, never display type.

## Layout

- Single fluid container: `width: 100%; max-width: 1400px; padding-inline: 2rem` (`.container`).
- Vertical rhythm: sections separated by `py-8 md:py-12`; content blocks `mb-12`/`mb-16`; more space above a heading than below it.
- Grids: gallery uses responsive columns — 1 / 2 (sm) / 3 (lg) / 4 (xl) with `gap-6`; detail page is a 2/3 + 1/3 split at `md`; profile gallery 4-up.
- Masonry intent: in Explore, items keep their natural screenshot aspect ratio; the grid reads as a wall of exhibits, not a rack of identical frames.
- Auth routes run chromeless (no header/footer) in a 50/50 split at `lg`.

## Elevation & Depth

Flat by rest, lit by state. Depth is conveyed by tonal layering (Midnight ground → Exhibit Panel surfaces → Slate Edge borders) plus one authored response: a soft blue spotlight glow.

### Shadow Vocabulary
- **Spot hover** (`box-shadow: 0 0 32px -8px hsl(210 100% 56% / 0.45)`): cards and primary controls on hover/focus. Diffuse, no offset — light from above.
- **Champion aura** (`box-shadow: 0 0 48px -12px hsl(210 25% 88% / 0.35)`): platinum-toned glow for HoF 1st place. The only non-blue glow in the system.
- Standard shadcn soft shadows remain for dialogs/sheets (structural, not decorative).

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Glow appears only as a response to state (hover, focus, championship).

## Shapes

Gently curved (radius `0.5rem` base; 12–16px cards, 8px controls, pills only for tiny badges). Borders are 1px Slate Edge and serve as the "frame edge" of exhibits; screenshot containers are flush (no internal padding) so the image meets the frame like a mounted print. Spoiler treatment is a blur + scale-110 veil with a centered reveal control — the object stays in the room, just under cloth.

## Components

### Buttons
- **Shape:** softly rounded (8px), icon-left label.
- **Primary:** PlayStation Blue fill, near-white text, 10×20px padding; hover slightly deepens, focus ring uses `--ring`.
- **Ghost/Outline:** transparent with Slate Edge border for secondary nav and "Load more".
- **Vote button:** the one shape-language exception — a pill (`rounded-full`) with filled heart when voted; red fill on detail, red-tinted ghost on cards; press animation scales the heart once (the authored micro-moment).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Exhibit Panel; no border on gallery cards (elevation declared once, by shadow-on-state).
- **Internal Padding:** 16px for meta zones; 0 for the image zone.

### Inputs / Fields
- **Style:** transparent/dark fill, 1px Slate Edge stroke, 8px radius; focus = blue ring, no glow.
- **Selects/popovers:** Exhibit Panel ground, Ink text.

### Navigation
- Sticky 64px header, 95% midnight with backdrop blur; ghost buttons become secondary (Slate Edge fill) on the active route; Upload is the only primary button in the bar; mobile opens a right sheet.

### Signature: Champion Plaque
Hall of Fame 1st place renders as an engraved plaque: platinum gradient text/edge on Exhibit Panel with champion aura. 2nd/3rd take the medal hierarchy (silver-gray, bronze-orange) at lower intensity.

## Do's and Don'ts

### Do:
- **Do** show screenshots at native aspect ratio; the crop of a trophy list is the content.
- **Do** keep idle surfaces flat and let hover glow carry life.
- **Do** reserve platinum for championship moments; its rarity is its value.
- **Do** tint secondary text on colored grounds from the ground's hue, never gray.
- **Do** use tabular numerals wherever counts change (votes, rankings).

### Don't:
- **Don't** use gradient text outside the platinum plaque treatment.
- **Don't** add kickers/eyebrows above headings.
- **Don't** let red or green wander off their reserved jobs (vote, success/error).
- **Don't** force 16:9 `object-cover` crops on user screenshots in Explore or profiles.
- **Don't** stack a border and a big soft shadow on the same card (ghost card).
