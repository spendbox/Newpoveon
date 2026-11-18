# HealthCheck design reference

> Copied from the HealthCheck design system (https://claude.ai/artifact/8CLdFZpEXcsQ4mBx5a8XRS) and the clickable mockup (https://claude.ai/artifact/2D2vZpEqQEVh9QB5atxQEE) on 17 Nov 2026. The app's colours live in `src/app/globals.css` and must match `tokens.json` here.


Friendly health screening for Nigerians: fun, warm and professional. HealthCheck is Poveon's
public self-screening app. People answer a short set of questions and get their heart age,
diabetes risk, sleep and mood results, then can book a ₦5,000 doctor consult, order a home test or
request medication delivery.

The clickable mockup (welcome → questions → results) is on the design canvas:
https://claude.ai/artifact/2D2vZpEqQEVh9QB5atxQEE

## Content fundamentals

- **Talk like a friendly nurse, not a hospital form.** "Let's talk about sleep", not "Section 3: Sleep Assessment".
- **One question per screen.** Short, plain words a secondary-school leaver understands.
- **Encourage, never scare.** Use "Halfway there!", "Nice, keep going". Bad news is framed with a next step:
  "This can come down. Book a doctor."
- **Be honest about limits.** Every result says it's an **estimate, not a diagnosis**, and names the tool
  it's based on (for example, "Estimate based on WHO risk charts").
- **No emoji in the UI.** Use drawn icons and illustrations instead.
- Examples:
  - Heading: "Let's check in on you"
  - Subtext: "A few friendly questions, about 10 minutes."
  - Result: "You're 35, but your heart is working like it's 7 years older."
  - Reaction: "Your lungs say thank you"

## Visual foundations

**Colour.** `ground` (mint) is the page. `surface` (white) holds cards and tiles. `ink` is for
text and the thick outlines that give everything its character. `coral` is the one action colour:
primary buttons, hearts and selected states. Always put **ink text on coral**, never white. `sun`,
`leaf` and `lavender` are accents, and each question topic gets its own tint background:
- Moving: `sun-tint`
- Smoking: `coral-tint`
- Sleep: `night`
- Family: `lavender-tint`
- Blood pressure: `leaf-tint`

**Status.** Results use `good-bg` with `good-text` ("Looking good") and `caution-bg` with
`caution-text` ("Act on this" or "Worth checking"). Status is never colour alone: always pair it
with a word and an icon.

**Type.** **Baloo 2** (800) for headings, numbers and buttons, with tight leading. **Nunito**
(600–800) for everything else. Question titles use `question` (27px). Overlines use `overline`
(13px, uppercase, letter-spaced).

**Shape.** Big, soft radii: `radius-md` (20px) for buttons and tiles, `radius-lg` (28px) for
illustration and hero cards, and pills for badges. Borders are thick (2.5px) in `ink` on interactive
elements. The primary button sits on a chunky `shadow-press` that presses down when tapped.

**Spacing.** Phone screens are 390px wide with `space-6` (24px) side padding, `space-3` (12px)
between tiles, and `space-4` (16px) inside cards.

**Motion.** Motion makes it fun, but stays gentle:
- Question cards slide in from the right (~0.55s ease-out).
- A chosen tile pops, and a green tick badge bursts in.
- Illustrations idle softly: floating, breathing lungs, rising Z's, a swinging gauge needle.
- Results count up to the heart age, then the cards rise in one by one.
- A smiley progress character walks along a dashed path to a finish flag.
- Always respect `prefers-reduced-motion`: switch all of it off.

## Illustration and iconography

- **Illustrations** (see the Illustrations assets) use flat shapes, thick `ink` outlines (3–4px),
  rounded joins and the palette above. People are drawn with dark-brown skin tones for Nigerian
  users. Each sits on its topic's tint inside a `radius-lg` card, 196px tall on phones.
- **Icons** are stroke icons, 2.6px `ink` lines with round caps, at 18–40px. Answer tiles use 40px
  picture icons (a couch, someone walking, someone running) so answers can be read at a glance.

## Components

- **Button:** the coral primary action and the white outline secondary action.
- **AnswerTile:** a big tappable answer with an icon, plus its selected state.
- **ResultCard:** a status card for one screening result.

## Accessibility

- Text meets 4.5:1 contrast on its background. Coral is a fill colour; never use it for small text.
- Use real buttons and links, with touch targets of 44px or more.
- Give icon-only buttons an `aria-label`. Decorative SVGs get `aria-hidden`.
- Every illustration with meaning has a short label.

## Components

### Button
The coral primary button that moves people forward, and a white outline secondary button.

- **Primary:** coral fill, 2.5px ink border, ink text in Baloo 2 (800, 20–21px), 56–60px tall, `radius-md`, `shadow-press`. On press it moves down 3px and the shadow shrinks to `0 3px 0`. Use one per screen for the main step: "Let's start", "Continue", "Talk to a doctor".
- **Secondary:** white fill, 2.5px ink border, Nunito 800 at 16px, 52px tall, no shadow. Use for the alternative step: "Find a blood pressure check near you".
- **Disabled:** 45% opacity until the question is answered.
- **You provide:** the label, an optional trailing arrow icon, and the action.

### AnswerTile
A big tappable answer with a picture icon, used for every multiple-choice question.

- **Unselected:** white `surface`, 2.5px `border`-colour outline, `radius-md`, a 40px stroke icon above a Nunito 800 label at 15px. 112px tall in a 3-column grid, or 62px tall in rows for longer labels.
- **Selected:** `ink` outline, `coral-tint` fill, a quick "pop" (scale 1 → 1.08 → 1), and a 26px `leaf` tick badge bursting in at the top-right corner.
- **Hover:** lifts 2px.
- **You provide:** the icon, the label, whether it's selected, and the tap handler. Always use a real `<button>`.

### ResultCard
A small card for one screening result, shown in a 2-column grid under the heart age reveal.

- **Looking good:** `good-bg` with a `good-text` tick label.
- **Act on this / Worth checking:** `caution-bg` with a `caution-text` warning-triangle label.
- Layout: the status label (12px, 800), then the topic (14px `muted`), then the value in Baloo 2 (20px, 800). Padding is 12px by 14px with `radius-md`.
- Cards rise in one by one (~0.15s apart) after the heart age finishes counting.
- **You provide:** the status, the topic, the value, and optionally a next-step link ("Book a doctor", "Order the test", "Retest in 3 months"). Never show status by colour alone.

## Illustrations

Topic illustrations for the questionnaire, the welcome screen and the results reveal. They are flat shapes with thick ink outlines and gentle idle animations.

- `welcome-character.svg`: the welcome screen hero, a smiling person holding a beating heart.
- `q-moving.svg`: physical activity, on `sun-tint`.
- `q-smoking-lungs.svg`: smoking, on `coral-tint`.
- `q-sleep.svg`: sleep and snoring, on `night`.
- `q-family.svg`: family history, on `lavender-tint`.
- `q-blood-pressure-gauge.svg`: blood pressure, on `leaf-tint`.
- `results-heart.svg`: the heart age reveal.

Question illustrations are 342 × 196 and sit in a `radius-lg` card. Make new topics in the same style: dark-brown skin tones, 3–4px ink outlines, and at most three palette colours per scene.

New topic illustrations drawn for the app in the same style: about-you, scale, tape, heart-history, sugar, veg, drink, mood, calm, checklist, support, doctor, home-test, delivery. After editing any SVG here, run `npm run illustrations`.
