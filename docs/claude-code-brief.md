# Margin Truth — demo build brief

Single-screen web demo. One job: show a detailer that a job they were proud of lost money.

## Stack

React + Vite + TypeScript, Tailwind. One page. `pack-detailing.json` imported as a static
module. No auth, no database, no backend, no routing library. Deploy to Vercel.

Do not add: natural-language intake, LLM calls, QuickBooks, user accounts, persistence,
onboarding flow, multi-vertical support. All of it is out of scope and none of it is
being validated by this demo.

## Data

`pack-detailing.json` is the single source of truth. Shape:

- `operator` — burdened labour rate, overhead rate per hour, target margin, capacity inputs
- `overheadLines` — the 13 itemised monthly overhead lines
- `sizeMultipliers` — medium 1.00 only. Size scaling is cut from the demo: labour
  minutes in the pack are real averages across mixed vehicles, so a multiplier on top
  charges for the truck twice
- `consumables` — 22 products, each with `costPerReadyToUseUnit` already computed
- `services` — 10 services with `labourMinutes` and `currentPrice`
- `serviceConsumables` — 68 rows joining service to consumable with `qtyPerMediumUnit`
  and `costPerMediumUnit` already computed

Every derived cost is precomputed in the JSON. The app multiplies, it does not model.

## The math

```
labourCost      = labourMinutes / 60 * operator.burdenedLabourRate
overheadCost    = labourMinutes / 60 * operator.overheadRatePerHour
consumableCost  = sum(costPerMediumUnit for rows matching serviceId)
floor           = labourCost + overheadCost + consumableCost
gap             = whatTheyCharged - floor
targetPrice     = floor / (1 - operator.targetMargin)
```

No size multiplier. Add it only after labour minutes are re-baselined to a medium vehicle.

## Screens

### 1. Entry

Three controls, nothing else.

- Service — dropdown of the 10 services
- What you charged — currency input

Copy above the controls: "Think of a job from last week you felt good about."
Button: "See the floor".

### 2. Result

This is the entire product. Layout, top to bottom:

- Service name and labour hours as a subhead
- **The verdict block.** Danger-tinted panel. Two lines:
  - small: `You charged $275. Your floor was $378.`
  - large, 28px: `That job cost you $103`
  - If the job cleared the floor, swap to a neutral tint and read
    `You cleared your floor by $102` with a second line: `Your target margin would put it at $755.`
- **The floor stack.** Three rows plus a total. Labour with minutes, overhead with minutes,
  product with item count, then Floor in bold above a hairline.
- Footer line: `Every number here is yours except coverage rates. Tap any line to change it.`
- Button: "Price another one"

### 3. Line detail

Tapping any row in the stack expands it inline. No modal, no new page.

- Labour → burdened rate, minutes, and the arithmetic
- Overhead → the 13 overhead lines with monthly amounts, then the division by billable
  hours per month. This is the row most likely to be disputed, so show all of it.
- Product → every consumable for that service: name, quantity, unit cost, line cost

Rows are editable where it costs nothing: labour minutes, wage, and any consumable
quantity. Edits recompute the floor live. Edits do not persist across reloads.

## Visual direction

Warm off-white page background, not white and not dark. Flat surfaces, hairline borders,
generous whitespace. No illustrations, no icons beyond a chevron, no rounded playful
shapes, no encouragement copy, no confetti.

Dollars everywhere, percentages nowhere. `That job cost you $176` lands; `you ran at a
-64% margin` does not.

The verdict block is the only saturated colour on the screen. Everything else is neutral.

Mobile first. The operator is holding a phone in a driveway. Target 380px wide, scale up
gracefully. Tap targets 44px minimum.

## Acceptance

- Selecting `Interior + exterior full detail` and `$275` shows a floor of $377.75 and a
  loss of $102.75
- Selecting `Boat polish` and `$400` shows the job clearing its floor by $237.65
- Loaded rate reads $61.06/hour, overhead rate $11.06/hour, billable hours 173.2/month
- Every row in the stack expands and every editable field recomputes the floor
- The whole flow works on a 380px viewport with no horizontal scroll
- Cold load to first paint under two seconds

## Out of scope, explicitly

Quoting a customer, sending anything, saving anything, logging in, tracking realized
margin, win/loss capture, price bands, reason codes, multiple verticals. Those are the
product. This is the proof that the product is worth building.
