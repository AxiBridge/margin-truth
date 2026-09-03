# Margin Truth — Design system

For Claude Code and whoever styles after. The reference feel is warm paper and a calm
ledger, not a SaaS dashboard and not a founder-tool doodle aesthetic. The user is holding
a phone with wet hands in a driveway.

---

## Principles

1. **One saturated element per screen.** The verdict block. Everything else is neutral.
2. **Dollars, never percent.** The only % in the app is the target-margin input.
3. **No decoration.** No illustrations, no icons beyond a chevron and a close, no gradients.
4. **Tap targets 44px.** Inputs 48px tall. Buttons full width on mobile.
5. **Numbers align right, tabular figures.** It is a ledger. Treat it like one.
6. **No encouragement.** The copy states facts. The operator supplies the feeling.

---

## Tokens

### Colour

```css
--paper:        #F7F4EE;   /* page background — warm, not white */
--surface:      #FFFDF9;   /* cards, panels */
--ink:          #1C1A17;   /* primary text */
--ink-2:        #5C574F;   /* secondary text */
--ink-3:        #8F8A81;   /* muted labels, captions */
--rule:         #E4DFD6;   /* hairlines */
--rule-strong:  #C9C3B8;   /* totals rule */

--breach-bg:    #F6E4E1;   /* verdict block, under floor */
--breach-ink:   #7A2E27;
--breach-em:    #4E1C18;   /* the big number */

--clear-bg:     #E8ECE4;   /* verdict block, cleared floor */
--clear-ink:    #3C4A34;
--clear-em:     #26301F;

--accent:       #1C1A17;   /* buttons — ink, not a brand colour */
--accent-ink:   #F7F4EE;
```

Dark mode: not in demo. Not in launch. Detailers work in daylight.

### Type

System stack. No webfont in the demo — cold load matters more than character.

```css
font-family: -apple-system, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
font-variant-numeric: tabular-nums;
```

| Role | Size | Weight | Notes |
|---|---|---|---|
| Verdict number | 28px | 500 | The only large text on the screen |
| Screen title | 18px | 500 | |
| Body / rows | 15px | 400 | |
| Labels, captions | 12px | 400 | `--ink-3`, letter-spacing 0.04em on section labels |
| Input text | 17px | 400 | Prevents iOS zoom on focus |

Line-height 1.4 body, 1.2 numbers.

### Space

4px base. Row padding 12px vertical. Card padding 20px. Section gap 24px. Page gutter 20px.

### Radius and elevation

Cards 10px. Verdict block 8px. Inputs 6px. Buttons 6px.
No shadows. Elevation is a hairline border on `--surface` over `--paper`.

---

## Components

### Verdict block

```
┌─────────────────────────────────────┐
│ You charged $275. Your floor was $378. │   13px, --breach-ink
│                                       │
│ That job cost you $103                │   28px/500, --breach-em
└─────────────────────────────────────┘
```

Background `--breach-bg` or `--clear-bg`. Padding 20px. Full width inside the card.
No icon. No border.

### Stack row

```
Labour · 360 min                    $300.00
```

Label left `--ink-2`, value right `--ink`, tabular. 12px vertical padding. Hairline
below. Entire row is the tap target. Tapped state: background `--paper`, chevron rotates,
detail expands inline below with 16px left inset.

Total row: label and value 500 weight, `--rule-strong` above, no rule below.

### Input

48px tall. `--surface` background. `--rule` border, `--ink` on focus. Currency inputs show
`$` as a fixed prefix in `--ink-3`. Numeric keyboard on mobile (`inputmode="decimal"`).
No placeholder text — every input arrives filled.

### Button

Primary: full width, 48px, `--accent` background, `--accent-ink` text, 15px/500.
One per screen. Label is a verb phrase: *Show me the floor*, *Price my next one*.

Secondary (reset, cancel): text only, `--ink-2`, no border, no background.

### Panel (config)

Collapsed: one row, label left, derived value right, chevron. Same as a stack row.
Expanded: sections separated by 12px section labels in `--ink-3` caps.

### Disclosure line

12px `--ink-3` italic-free. Used exactly twice: under the stack (*"Every number here is
yours except product coverage rates"*) and under product detail (*"Quantities are our
estimates for a mid-size vehicle"*). Do not add more.

---

## Layout

Single column, max-width 420px centred on wider viewports, `--paper` beyond. No sidebar,
no nav bar, no header logo in the demo. Wordmark appears once, 12px, bottom of the page.

---

## Voice

| Do | Don't |
|---|---|
| That job cost you $103 | Oops! Looks like this one lost money |
| Your floor was $378 | Your minimum viable price is $378 |
| Every number here is yours | We used your inputs to calculate |
| Try one you weren't sure about | Great job! Try another |
| Enter jobs per week to allocate overhead | Please enter a valid value |
| $1,915 a month | $1.9k/mo |

Never: exclamation marks, "great", "awesome", "oops", emoji, "let's", "we're excited".
Never explain the formula in prose; show the arithmetic as a line.
Second person always. The app never says "I" or "we" except in the two disclosure lines.

---

## Motion

Expand/collapse 180ms ease-out. Verdict block fades in 200ms on first render only.
Nothing else moves. No skeleton loaders — the pack is local, the screen is instant.
