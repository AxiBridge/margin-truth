# Margin Truth — Product Specification v2

*Quote-time pricing for consumable-heavy micro service businesses.*

Supersedes v1. Changes: floor-first positioning, corrected capacity math, itemised overhead,
size scaling deferred with reason, floor transparency as launch requirement.

---

## 1. Thesis

**Operators are underquoting and cannot see it.** Validated through detailing discovery and
direct operating experience. Confirmed by the founder's own pack: six of ten services priced
below floor on a medium vehicle, the flagship full detail under by $103.

The product is the floor. Pricing backward from a target margin is the mechanism that gets
them above it. The marketing message is one sentence: *you're underquoting and you can't see it.*

Positioning is against **QuickBooks + gut feel**. Not against Jobber today. The floor is the
wedge; the product builds outward into the field-service platform for consumable-heavy
trades — quote, invoice, payment, then schedule — with every feature passing one test:
does it touch the floor or the realised margin. Strategy and sequencing in 07-roadmap.md.

---

## 2. ICP

Widen along the **consumable axis**, not the service-business axis.

**Qualifying test:** does a meaningful share of job cost get consumed, and does nobody
track it?

| In | Out |
|---|---|
| Detailing | Anything billing hours |
| Pressure / soft washing | Anything passing materials at cost-plus |
| Lawn and turf treatment | Consultants, bookkeepers, trades |
| Pest control | |
| Window cleaning | |
| Pool service | |

**Launch:** detailing and pressure/soft washing. Shared chemicals, shared dilution logic,
frequently the same operator, same distribution network.

**Third:** lawn and turf, gated on label-rate data.

---

## 3. Core schema

A job is **a measure × a service**.

| Element | Definition |
|---|---|
| Measure | vehicle, 100 sq ft, linear ft, unit count, acre |
| Service | carries labour minutes per unit and a per-service target margin |
| Consumables | catalogue with container size, price, dilution → cost per ready-to-use unit |
| Service consumables | quantity of each consumable per measure unit |
| Overhead | itemised monthly lines, allocated per billable hour |

```
loadedRate   = wage × (1 + burden) + monthlyOverhead ÷ billableHours
floor        = minutes ÷ 60 × loadedRate + Σ consumable cost
targetPrice  = floor ÷ (1 − targetMargin)
```

Full detail in 02-data-model.md.

### 3.1 Capacity math — the correction that matters

`billableHours = techs × jobsPerWeek × hoursPerJob × 4.33`

Jobs × hours **is already billable time**. Do not apply a utilisation discount on top of it;
that double-counts and inflated the overhead rate by 43% in v1. The utilisation question, if
asked at all, belongs on *jobs per week* ("how many do you actually book"), never on hours.

**Labour burden defaults to 0** for a solo owner drawing pay. Payroll burden applies only when
the operator has employees. v1 defaulted to 15% and added $7.50/hr of phantom cost.

### 3.2 Overhead — itemised, never a single number

Thirteen lines: facility rent, facility utilities, vehicle payments, vehicle insurance,
liability insurance, fuel, vehicle maintenance, equipment replacement, phone, software,
marketing, licences/accounting, other.

Operators asked for one overhead number produce roughly half the real figure because they
omit vehicle payments and insurance. The founder's gut number was $1,000; itemised, $1,915.
The list exists to force the omission into view.

**Never ask for hourly overhead.** The operator divides by hours worked instead of hours
billed and the floor comes out roughly a third too low.

### 3.3 Vehicle size — deferred, with the reason

Size scaling is real: a crew cab consumes more product and time than a sedan. But an
operator's labour minutes are averages across the vehicles they actually work on. Applying a
multiplier to an average charges for the truck twice. In v1 this produced a $722 floor
against a real $378.

Size scaling ships only when labour minutes and consumable quantities are re-baselined to a
**medium vehicle** in the pack. That is a pack-authoring task, not a product task.
Until then, one floor per service.

---

## 4. Margin architecture

### 4.1 Floor — computed, hard, override requires a reason

Floor = the price at which the job returns zero contribution. Below it, performing the job
costs money.

UI: hard rail on the price slider. Dragging below requires a reason code:

- Matched a competitor
- Repeat customer
- Filling a slow day
- Foot in the door on a commercial account
- Other

Reason codes aggregate into the monthly report:
*"You gave away $2,340 to 'repeat customer' this quarter."*
One dropdown at quote time. Do not remove it to reduce friction.

### 4.2 Floor transparency — launch requirement

For most operators the floor lands 30–40% above current pricing. Some will reject the tool
rather than their pricing. The defence:

- The floor is never a single number. It is a tappable stack.
- Every line is the operator's own input: their wage, their overhead, their minutes.
- **Coverage rate is the only external number.** Label it as ours. Make it editable in place.
- Any disputed line can be changed and the floor moves.

A black-box number they disagree with is a cancellation. The same number shown as arithmetic
on their own inputs is an argument they have to have with themselves.

### 4.3 Target — per service

A ceramic coating and an interior detail have different consumable risk and different
elasticity. Packs ship with per-service targets pre-set. A single global target produces
prices the operator overrides constantly and learns to ignore.

### 4.4 Ceiling — learned, month three

The system cannot know what the local market bears.

**Seeded bands** from the vertical pack: $/vehicle by service tier, $/100 sq ft for washing.
**Learned bands** from one-tap win/lost/ghosted on each quote. ~25 quotes to mean anything.

Soft rail: a warning, not a stop. Deferred because the validated pain is underquoting; nobody
is pushing the ceiling yet.

---

## 5. Quoted vs realised — the retention mechanic

Quoted margin is a promise. Realised margin is the truth. The gap comes from drive time,
rework, over-application, discounts given on site, jobs that ran long. None of it is in
QuickBooks.

**Job close-out under 20 seconds.** Every field defaults to *as planned*. The operator
corrects deviations only: actual time, actual product. One-tap "went as quoted."
If close-out has friction, realised data never exists and the loop dies.

---

## 6. Configuration — templates, not settings

**Seeded vertical packs** built by us. Pick a vertical at signup, everything arrives filled.

**Onboarding calibrates their numbers, not the trade's:**
1. What you pay yourself
2. Monthly overhead — itemised, thirteen lines, collapsible to a total
3. Jobs per week, hours per job, number of techs
4. Supplier prices — pre-filled, they correct
5. **Retro-price a job you felt good about**

**They adjust, they never author.** Rename, clone, tweak. Editing a filled form converts;
filling an empty one does not. A blank field anywhere is a bug.

Full flow in 03-onboarding-flow.md.

---

## 7. QuickBooks

Read-only. Supplier prices and category totals. Do not recapture expenses — they already do
this and duplicating it is a reason to churn.

---

## 8. Reporting

Service-line ROI is a byproduct, reframed from vanity to decision.

Wrong: *"Soft washing is 41% of revenue."*
Right: *"You quoted soft washing at 55%, realised 44%, and broke floor on four of eighteen
jobs — all under 800 sq ft."*

Every report ends in a decision the operator can take within seven days.

---

## 9. Moat and constraint

**Coverage data.** Three cutting pads and 12 oz of shampoo per full detail comes from having
done the work. It cannot be scraped.

**Constraint:** wrong rates produce wrong prices; one bad quote loses the account. No vertical
ships without real rate data. This is the governing limit on expansion, above market size,
demand, or competition. Authoring standard in 05-vertical-pack-guide.md.

---

## 10. Build order

| Phase | Ships | Exit criterion |
|---|---|---|
| Demo (now) | Retro-price → floor breach → transparent stack; config panel | Five detailers see their own floor; three say "I want this" unprompted |
| Launch | Quote flow, floor rail, reason codes, close-out, realised-vs-quoted, detailing + washing packs | Ten paying operators, each with ≥20 quotes in 60 days |
| Month 2 | QuickBooks read-only, monthly report with reason aggregation, depletion alerts | Realised margin visible for 80% of closed jobs |
| Month 3 | Win/loss tagging, seeded and learned ceiling bands, minimum job size | Ceiling pain confirmed or cut |
| Later | Lawn/turf pack (gated), crew tier, size scaling (gated on re-baselined packs) | — |

Detail in 07-roadmap.md.

---

## 11. Product feel

Ten opens a month is the right number. Session count is a vanity metric. The goal is to be
unavoidable at the moment money is decided and to deliver one reveal a month that exists
nowhere else.

**Four moments:**
1. Activation — the retro-priced job that breaches. Dollars, not percent.
2. The quote — under 90 seconds, describe to sendable. Live recompute, no Calculate button.
3. The rail — the slider stops at the floor. Resistance is the feature.
4. Month-end — one screen, loss-framed, one decision.

**The delight nobody else has:** *"Your 5-gallon degreaser is 11 jobs from empty."* Falls out
of the schema, doubles as a reorder trigger, and is the thing they'll describe to another
detailer.

**Anti-patterns:** badges, streaks, confetti, mascots, NPS popups, encouragement copy,
illustrated empty states, percentages where a dollar lands harder, any screen that asks for
configuration before showing a number. Tradespeople read gamification as software built by
people who have never done the work.

---

## 12. Open questions

- Price-band sourcing beyond detailing and washing
- Packaging and price point
- Whether floor breaches ever hard-block send
- Label-rate acquisition for lawn/turf
- Floor-driven cancellation rate in the first cohort; if operators reject the floor rather
  than their pricing, 4.2 has failed and needs rework before any expansion
