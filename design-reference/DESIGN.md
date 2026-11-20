# HealthCheck design guide (v2 · "Calm vitality")

Modern, clean and quietly fun. It should feel like a well-made product, not a hospital form and not a cartoon.
v1 (thick outlines, chunky shadows, cartoon characters) is kept for reference in [`archive-v1/`](archive-v1/).

The live tokens are in [`src/app/globals.css`](../src/app/globals.css) and [`tokens.json`](tokens.json). Keep the two in sync.

## Principles

1. **Calm first.** One main action per screen. Plenty of white space. If a screen feels busy, remove something.
2. **Fun in the details, not everywhere.** Personality comes from a few moments: the heart-age reveal, the answer tick, the progress marker, soft floating shapes. Everything else stays quiet.
3. **Professional and trustworthy.** Real data shown plainly, sources named, no exaggeration, no emoji.
4. **Warm and Nigerian.** Plain, friendly English ("Let's check in on you"). Prices in naira. Talk like a kind doctor, not a form.

## Colour

| Token | Hex | Use |
|---|---|---|
| `ground` | #F6F8F7 | Page background (near-white with a hint of green) |
| `surface` | #FFFFFF | Cards, inputs, answer tiles |
| `surface-2` | #EFF4F2 | Quiet fills: chips, secondary buttons, notes |
| `line` / `line-strong` | #E1E9E5 / #C9D6D0 | Hairline borders (cards) / input and button borders |
| `ink` | #10221D | Text, and the dark hero cards |
| `muted` | #4A5D57 | Secondary text (6.7:1 on white) |
| `subtle` | #5E706A | Captions and disclaimers (5.2:1 on white) |
| `primary` | #136F58 | **The one action colour.** Primary buttons, selected states, links, progress. White text on it (5.9:1) |
| `primary-soft` | #E3F2EC | Selected tiles, soft panels |
| `coral` | #FF6B4A | The heart, the progress marker, small highlights. **Fill only, never small text** |
| `sun`, `lavender` | #FFC23D, #7C6CF0 | Accents in topic art and the share card |
| Status | good #E6F4EE/#116149 · check #FFF4DC/#7A4A00 · act #FDE9E4/#9A2E14 | Result status pills |

Rules: one primary button per screen. Status is always **word + icon** ("Looking good" ✓, "Worth checking" ⚠, "Act on this" ⓘ), never colour alone.

## Type

- **Headings and numbers:** Bricolage Grotesque, weight 600–700, letter-spacing −0.02em. Characterful but grown-up.
- **Everything else:** Inter, weight 400–600. Body 15–17px, line height 1.5.
- Question titles 26px/1.15 semibold. Hero 40px (phone) / 64px (desktop) bold.
- Overlines: 13px, semibold, uppercase, +0.06em, in `primary`.
- Numbers that line up use tabular figures (`.tabular`).
- Both fonts are self-hosted (no Google requests), from `@fontsource-variable/*`.

## Shape, depth and spacing

- Radii: `sm` 10 · `md` 14 (buttons, inputs) · `lg` 20 (cards, tiles) · `xl` 28 (hero and feature cards).
- Borders are 1px hairlines (`line`). No thick outlines.
- Shadows are soft and rare: `shadow-sm` on buttons, `shadow-md` on hover and floating cards, `shadow-lg` for the results hero and floating doctor button.
- Phone screens: 20px side padding, 8–10px between tiles, 16–20px inside cards. Phone-width flows are max 460px. On desktop they sit in a white card with a large shadow.

## Components

- **Primary button:** `primary` fill, white text, 54px tall, radius `md`, presses down 1px. Secondary: white with `line-strong` border.
- **Answer tile:** white card, 1px `line` border, radius `lg`. A round icon well (`surface-2`). Selected: `primary` border and ring, `primary-soft` fill, with a small green tick that springs in. Long answers use rows with a radio or checkbox on the right.
- **Progress:** a 6px track with a `primary` fill and a glowing coral marker. Topic name above ("YOUR HEART"), "7 of 24" and a short cheer ("Halfway there!").
- **Result card:** white card with the topic, a status pill, the value (display font), a summary, the source line and one next-step link in `primary`.
- **Heart-age hero:** dark `ink` card, coral heart that beats gently, number counting up, soft drifting dots. The one big "wow" moment.
- **Topic art:** each question topic gets a soft colour field (its tint), two quiet floating shapes, and one icon in a white rounded tile. No people, no faces. 104–136px tall.
- **Floating doctor button:** white pill with a `primary` stethoscope circle, bottom-right. In the top bar on question screens instead.
- **Lab package card:** name, price (or "Price on request"), badges (Popular, number of tests, Women/Men), sample · results time · fasting, "What's included" expander, then "Choose this".

## Topic tints

About you, blood pressure, heart, check-ups, doctor: `primary-soft` · Body, moving, drink, mood: `sun-soft` · Waist, smoking, heart history: `coral-soft` · Sugar, family, sleep, labs: `lavender-soft`.

## Icons

Stroke icons, 2px lines with round caps, drawn on a 40px grid (`src/components/icons.tsx`). 16–22px in UI, 28–34px in topic art. Decorative icons are `aria-hidden`.

## Motion

- Question cards slide 28px and fade (0.32s). Tiles spring 3% when chosen.
- The heart counts up to the heart age, then result cards rise in one by one (0.15s apart).
- Idle motion is slow and small (floating 6px over 5–9s).
- Everything switches off for people who prefer reduced motion.

## Accessibility

Text meets 4.5:1 (3:1 for text 24px and larger). Touch targets are 44px or more. Real buttons, links and labels. Visible focus ring (2.5px `primary`). Coral is never used for text.

## Voice

Short sentences. Encourage, never scare: "This can come down." Every result says it's an estimate, not a diagnosis, and names its tool.

## Logo (Poveon mark)

- Editable vector: `public/brand/poveon-mark.svg` (viewBox 400 × 400, three paths: `poveon-top`, `poveon-left`, `poveon-big`).
- In code: `src/components/poveon-mark.tsx`. The browser tab icon is `src/app/icon.svg`.
- Colours, matched to the site greens: top `#8FD3BF`, left `#3FA88A`, main piece primary `#136F58`.
- Shape: three pieces with 45° cut ends forming a cross and a forward arrow; 20-unit gaps; soft rounded corners.
- Motion: on a visitor's first visit to the home page, the pieces glide in (top from above, left from the side, main piece from bottom-right) and the name fades in. Plays once per browser; never for reduced motion.
