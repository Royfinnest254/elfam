# Elfam — Visual System Repair

This project drifted from PROJECT_BRIEF.md during the original build.
The functionality is mostly intact. The visual system was replaced
wholesale during the build and now contradicts the brief.

Your job is to restore the visual system specified in the brief —
editorial typography, flat shapes, no shadows, no hover-scale, no
SaaS-template tells — across every page already built, without
breaking the functionality.

Read PROJECT_BRIEF.md and PAGES_SPEC.md first if those exist in the
repo. Then read this document in full before changing any code.

The color palette is being decided separately. This document does
not touch color tokens. Leave the existing color values in
`tailwind.config.ts` and `globals.css` alone — they will be
replaced in a separate pass. Every instruction here is about
typography, shape, weight, spacing, motion, and voice.

---

## What's wrong now, specifically

The current build:
- Uses Georgia, Calibri, and Candara as fonts. The brief specified
  Fraunces (display), Inter Tight (body), JetBrains Mono (data).
  Fraunces and Inter Tight are not loaded.
- Renders all headings in bold uppercase with tight tracking. The
  brief specified mixed-case Fraunces with negative letter-spacing —
  editorial, not SaaS.
- Uses 18px, 24px, and 32px border radii throughout. The brief
  specified 4px on inputs, 6px on buttons, 0px on cards.
- Has drop shadows on cards, buttons, and modals. The brief
  explicitly forbade shadows.
- Has `hover:scale-[1.02]` on buttons and other hover-grow effects.
  These are AI-template tells and were not asked for.
- Has 52px-tall buttons with letter-spacing 0.15em uppercase text.
  The brief specified 40px buttons with mixed-case 13px labels.
- Contains marketing-voice copy in places. The brief banned this
  voice.

Do not try to "blend" the current visual style with the correct
one. Replace it.

---

## Typography

Replace the font setup completely.

Use `next/font/google` in `src/app/layout.tsx` to load:

- **Fraunces**: weights 400 and 500, optical size 144, normal style.
  Expose as CSS variable `--font-display`.
- **Inter Tight**: weights 400, 500, 600. Expose as `--font-sans`.
- **JetBrains Mono**: weight 400. Expose as `--font-mono`.

Apply the variables to `<html>` so they're available everywhere.

In `tailwind.config.ts`:

```ts
fontFamily: {
  display: ["var(--font-display)", "Georgia", "serif"],
  sans: ["var(--font-sans)", "system-ui", "sans-serif"],
  mono: ["var(--font-mono)", "monospace"],
}
```

Remove Georgia, Calibri, Candara, and Segoe UI from `fontFamily`.

In `globals.css`, remove every `uppercase` and `tracking-tight` from
the global heading rules. Headings are mixed-case Fraunces with
*negative* letter-spacing — editorial, not tight uppercase.

Replace the global heading rules with exactly these:

```css
h1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.015em;
  text-transform: none;
}

h2 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 22px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  text-transform: none;
}

h3 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 18px;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-transform: none;
}

body {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 15px;
  line-height: 1.5;
}
```

Page titles use a `.display` class:

```css
.display {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 48px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-transform: none;
}
```

Labels (11px uppercase mono, tracking 0.04em) and body-small (13px
Inter Tight) become utility classes:

```css
.label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 11px;
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.body-small {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 13px;
  line-height: 1.4;
}

.mono {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 13px;
  line-height: 1.3;
}
```

Tag numbers, litre counts, dates in tables, timestamps — all in
`.mono`. Names in Fraunces. Body labels in Inter Tight.

---

## Shapes

Find every `rounded-[18px]`, `rounded-[24px]`, `rounded-[32px]`,
`rounded-modal`, `rounded-system`, `rounded-input`, `rounded-xl`,
`rounded-2xl`, `rounded-3xl`, `rounded-full` (except on profile
avatars). Replace with:

- Inputs: `rounded-[4px]`
- Buttons: `rounded-[6px]`
- Cards: no radius — square corners
- Badges: `rounded-[2px]`
- Modals: `rounded-[6px]` maximum
- Toasts: `rounded-[4px]`

Cards are separated by background tone and 1px hairline borders, not
by corners. Square cards. Do not soften them.

In `tailwind.config.ts`, remove the `borderRadius` block entirely
(or set it to only the four values above).

---

## Shadows

Remove every `shadow-*` class from the codebase. This includes
`shadow-premium`, `shadow-elevated`, `shadow-md`, `shadow-lg`,
`shadow-xl`, `shadow-2xl`, `shadow-[...]`, `hover:shadow-*`,
`drop-shadow-*`. Delete the `boxShadow` block from
`tailwind.config.ts` entirely.

No drop shadows anywhere. None. Cards, modals, dropdowns,
tooltips — all flat. Use 1px hairline borders to define edges.

The single exception is focus rings, which are 2px solid outlines
with 2px offset for accessibility.

---

## Hover and motion

Remove every `hover:scale-*`, `hover:translate-*`,
`transition-transform`, `active:scale-*`, and any "lift on hover"
effects from buttons, cards, links, and rows. These are AI-template
tells.

Allowed hover treatments:

- Buttons: change background color only.
- Secondary buttons: change background to the card-surface tone.
- Table rows: change background to the card-surface tone.
- Links: change color or add underline.
- Cards that are themselves links: change the small "View" affordance
  inside the card, not the card itself.

Nothing scales. Nothing translates. Nothing animates beyond a 150ms
color transition.

Also remove any `animate-in fade-in` style transitions on regular
page content. Modals and toasts may fade in over 150ms. Page
content appears immediately.

---

## Buttons

Rewrite all button utility classes in `globals.css`:

```css
.btn-primary {
  height: 40px;
  padding: 0 16px;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  transition: background-color 150ms;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.btn-secondary {
  height: 40px;
  padding: 0 16px;
  border: 1px solid;
  border-radius: 6px;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  transition: background-color 150ms;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.btn-destructive {
  height: 40px;
  padding: 0 16px;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
```

The color tokens for backgrounds, borders, and text on these buttons
will be filled in during the palette pass. For now leave the
existing color classes attached, but rewrite the height, padding,
radius, font, and weight per above.

Buttons are **not** all-caps. They are **not** 900-weight. They
are **not** 52px tall. They are **not** rounded-18px. They do
**not** scale on hover. Their labels are mixed-case ("Sign in",
not "SIGN IN").

---

## Inputs

```css
.input-field {
  height: 40px;
  padding: 0 12px;
  border: 1px solid;
  border-radius: 4px;
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 400;
  transition: border-color 150ms;
}

.input-field:focus {
  outline: none;
  border-width: 2px;
  padding: 0 11px;
}
```

Remove `font-medium`, `tracking-*`, `text-xs` from inputs.

Labels above inputs use `.label` (11px uppercase Inter Tight,
tracking 0.04em).

---

## Cards

```css
.card {
  border: 1px solid;
  border-radius: 0;
  padding: 24px;
}
```

No shadow. No radius. No hover state unless the card is itself a
link, in which case the inner "View" affordance gets the hover
treatment, not the card.

Find every `.system-card`, `rounded-[32px]`, `shadow-premium`
combination and replace with the flat `.card` style.

---

## Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 2px;
  border: 1px solid currentColor;
  background: transparent;
}
```

Remove the existing `.status-ok`, `.status-low`, `.status-out`
treatments that use background tints. Badges are outlined-only,
using `currentColor` for both border and text, with the appropriate
semantic color applied via a modifier class.

---

## Sidebar

The sidebar must:

- Use a dark surface background with a light foreground for text.
- Show the wordmark "Elfam" at 22px in Fraunces 500 at the top.
- Show a small role indicator below the wordmark at 11px label style.
- Have navigation items at 13px Inter Tight, mixed case, 12px vertical
  padding, 24px horizontal padding.
- Have an active item with **inverted** colors (dark text on light
  background), no rounded corners, full-width.
- Have no rounded corners on items, no glow, no shadow, no scale.

Find the current Sidebar component and replace any item styling that
uses `rounded-xl`, `rounded-2xl`, `shadow-*`, or `hover:scale-*`.

Group labels (Today / Herd / Land / Business) use `.label` style with
50% opacity on the cream-on-dark color.

---

## Charts

If recharts is used anywhere, sweep through and:

- Remove every `<linearGradient>` and `<radialGradient>`. Use single
  solid colors for strokes and fills.
- Remove every `gradientStop`.
- Remove any chart `drop-shadow`, `filter`, or glow effects.
- Set axis tick labels to mono 11px.
- Set gridlines to a single horizontal rule color, 1px.
- Remove gridline-Y if more than one is rendered — keep only a
  single reference line (e.g. average).
- Set tooltip background to the ink color and tooltip text to the
  cream color (these tokens will be assigned in the palette pass —
  for now use `--ink` and `--cream` semantically, regardless of
  their current hex value).

---

## Modals

Modal overlay uses a semi-transparent overlay derived from the ink
color. Not white-on-blue, not blue-on-blue.

Modal panel: paper background, 1px hairline border, no shadow,
`rounded-[6px]` maximum, 32px padding.

Find every modal in the codebase (currently at least one in
`src/app/page.tsx`) and remove `shadow-elevated`, `rounded-[24px]`,
`rounded-[32px]`, and any animation longer than 150ms fade.

---

## Voice sweep

Find and rewrite any marketing-flavored copy that slipped in. Banned
phrases anywhere in the UI:

- "high-yield"
- "modern commercial"
- "seamless", "unlock", "empower", "leverage", "harness", "transform"
- "premium", "elevated", "world-class", "cutting-edge"
- "AI-powered" or any variant
- Exclamation marks in UI strings (except genuine alerts)
- Any emoji used as a UI element

Replace with plain, specific copy in the voice of someone who has
been on a Kenyan farm. Examples:

- Bad: *"high-yield cereal crops including wheat and contract barley
  delivered directly to East African Breweries Limited (EABL) in
  Eldoret, alongside a modern commercial dairy herd."*
- Good: *"450 acres of wheat, 350 acres of barley under contract to
  EABL, and a Friesian dairy herd."*

- Bad: *"🎉 You're all caught up!"*
- Good: *"No tasks today."*

The About modal currently contains marketing copy. Rewrite using the
three-paragraph copy in PAGES_SPEC.md §5.2 ("/about") if that spec
is available; otherwise: a paragraph on what Elfam is (1,600 acres,
Uasin Gishu, Prof. Margaret Kamar, Maria Soti), a paragraph on what
it produces, and a closing italic paragraph beginning *"This is a
system for recording the work of the farm…"* — keep that line
verbatim.

---

## Files to touch

You will need to edit at minimum:

1. `tailwind.config.ts` — fontFamily replacement, `borderRadius`
   cleanup, `boxShadow` removal.
2. `src/app/globals.css` — typography rules (h1-h3, body, .display,
   .label, .body-small, .mono), button/input/card utility classes,
   removal of shadow and scale rules. Leave color tokens alone.
3. `src/app/layout.tsx` — font loading via `next/font/google`,
   variable exposure on `<html>`.
4. `src/components/Wordmark.tsx` — verify it uses Fraunces 500 at
   the right sizes.
5. `src/components/Sidebar.tsx` — flat items, no rounded corners,
   no hover-scale, mixed-case labels.
6. Every page under `src/app/(dashboard)/**/page.tsx` — sweep for
   `rounded-[18px]`, `rounded-[24px]`, `rounded-[32px]`,
   `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `shadow-*`,
   `hover:scale-*`, `active:scale-*`, `uppercase tracking-[0.15em]`,
   `font-black`, `font-bold` on body text, `h-[52px]` on buttons,
   `text-[10px] font-black uppercase tracking-widest` on labels —
   and replace with the correct utilities.
7. `src/app/page.tsx` — rewrite buttons to the new style, remove
   uppercase letter-spacing on button text, rewrite the About
   modal copy.
8. `src/app/signin/page.tsx` — same sweep.
9. `src/app/not-found.tsx` — same sweep.
10. Any chart component using recharts.

---

## Execution order

Do this in order. After each step, run `tsc --noEmit` and confirm
zero errors before continuing.

1. Update `src/app/layout.tsx` with the three Google fonts and
   expose the variables.
2. Update `tailwind.config.ts` — fontFamily, remove boxShadow,
   shrink borderRadius.
3. Update `src/app/globals.css` — replace heading rules,
   button/input/card utility classes, remove all shadow and scale
   rules. Add `.display`, `.label`, `.body-small`, `.mono` utility
   classes.
4. Update the Wordmark component if needed.
5. Update the Sidebar component.
6. Update the landing, signin, and 404 pages.
7. Sweep the owner surface (`/owner/*`).
8. Sweep the manager surface (`/manager/*`).
9. Sweep the worker surface (`/worker/*`).
10. Sweep shared pages (`/settings`).
11. Sweep any chart components.
12. Voice sweep: grep the banned phrases and rewrite.
13. Final visual check: run the dev server, open each page in turn,
    confirm no shadows, no buttons scale on hover, no headings are
    uppercase tight, every card is square, every button is 40px tall
    with mixed-case label.

---

## How to know you're done

Run these greps from the repo root. Each must return nothing.

```
grep -rE "shadow-(premium|elevated|md|lg|xl|2xl)" src/ tailwind.config.ts
grep -rE "hover:scale|active:scale|hover:translate" src/
grep -rE "rounded-\[(18|24|32)px\]|rounded-(xl|2xl|3xl)" src/
grep -rE "tracking-\[0\.15em\]" src/
grep -rE "h-\[52px\]" src/
grep -rE "font-black|font-extrabold" src/
grep -ri "Georgia|Calibri|Candara" src/ tailwind.config.ts
grep -ri "high-yield|seamless|unlock|empower|leverage" src/
```

Visual checks:

- The landing button reads "Sign in" in mixed-case 13px Inter Tight,
  not "SIGN IN" in 11px tracked.
- The herd dashboard cards are flat, square, with 1px hairline
  borders. No shadows. No drop blur.
- A cow profile shows the cow's name in Fraunces 32px mixed case,
  with the tag in JetBrains Mono beside it.
- Buttons do not grow when you hover them.
- The sidebar items are flat-edged, not rounded pills.
- Page headings are mixed-case Fraunces with negative letter-spacing.
  They do not shout.
- No element on any page has a drop shadow.

If any of those fail, that section is not done.

---

## Things not to do

- Do not touch color tokens. The palette is being decided separately
  and will be applied in a later pass. Leave existing hex values
  alone except where you must remove a banned shadow class that
  contains a color.
- Do not add new pages. The page structure is fine.
- Do not refactor unrelated logic. This is a visual-system repair
  only.
- Do not change Convex queries or mutations. Do not touch the
  schema. Do not re-seed.
- Do not preserve `hover:scale`, drop shadows, or large radii on
  the grounds that they "look modern." They are the exact things
  that make this look generated.

Restore the typography, shape, weight, motion, and voice specified
in the brief. Color comes later.
