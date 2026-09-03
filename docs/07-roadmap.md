# Margin Truth — Roadmap

**Strategy (decided 2026-09-03):** the floor is the wedge; the product becomes the lightweight
field-service platform for consumable-heavy trades. Standalone pricing tool has a ceiling
around $300–600k ARR. Building outward moves the price point to the $70–110 band and moves
the moat from coverage rates (thin) to each operator's own realised-margin history (thick).

**The one test every feature must pass:** does it touch the floor or the realised margin?
If not, it does not get built, regardless of what competitors ship.

Phases gate on evidence, not dates. A phase does not start until the prior one's exit
criterion is met. Dates below are targets, not commitments.

---

## Phase 0 — Demo (now → mid September 2026)

**Scope**
- Retro-price one job → floor breach → transparent stack, tap-to-edit
- Config panel: pay, overhead (13 lines), capacity, service prices
- `localStorage` persistence, reset to defaults
- Detailing pack, provenance mostly `estimate`
- Deployed to a URL you can open on a phone

**Not in scope**
Accounts, quoting, sending, close-out, ceiling, reason codes, second vertical.

**Exit criterion**
Five sessions run per 06-validation-plan. Decision rule returns *proceed*.

**Metric**
Accept rate. Nothing else.

---

## Phase 1 — Launch: floor + quote (October → November 2026)

**Scope**
- Accounts (email + magic link, no passwords)
- Onboarding per 03-onboarding-flow
- Quote screen: service, units, price slider with **hard floor rail**, target line
- Reason codes on floor override
- Send quote: PDF and SMS, operator's name and logo, no Margin Truth branding on the
  customer-facing artifact. Customer accept/decline link.
- Customer record created automatically from the first quote — name, phone, vehicle.
  No separate "add customer" flow.
- Job close-out under 20 seconds: actual minutes, actual product, one-tap "as quoted"
- Realised-vs-quoted per job
- Weekly digest: three lines, one number, one decision
- Detailing pack to provenance standard (top ten lines measured/operator)
- Pressure/soft washing pack to provenance standard
- Pricing: one tier, monthly. Launch at $49; the plan is to reach the $70–110 band
  once invoicing ships.

**Not in scope**
Invoicing, payments, scheduling, QuickBooks, ceiling, crew features, size classes.

**Exit criterion**
Ten paying operators. Each has ≥20 quotes sent in 60 days. ≥80% of completed jobs have a
close-out.

**Metrics**
- Quotes per operator per week
- Close-out rate
- Floor override rate and reason distribution
- Retention at 60 days

Close-out rate is the leading indicator. If it's under 60% by week four, the close-out
flow has friction and the retention mechanic is dead regardless of what else ships.

---

## Phase 2 — Money: invoice and payment (December 2026 → January 2027)

This is the lock-in phase. Once customers pay through the platform, leaving costs the
operator something.

**Scope**
- Quote → invoice in one tap on close-out; invoice carries the realised numbers
- **Interac Request Money as the default rail in Canada**, via an aggregator (VoPay,
  Flinks Pay, or Paysafe). Request is generated from the closed-out job with the job ID
  attached; the webhook on acceptance marks the job paid and updates realised margin.
  This is reconciliation, not processing — the operator keeps the rail they already use.
- Stripe Connect as the second rail: card deposits on coating and correction work, tap-to-pay
  on the operator's phone, and the US. Both rails run at pass-through cost; no platform fee.
- Realised revenue replaces quoted price in the margin loop automatically
- Monthly report: quoted vs realised by service and by customer, floor breaches,
  reason-code dollar aggregation, one recommended decision
- Consumable depletion: *"11 jobs from empty"* on the home screen, reorder nudge
- QuickBooks: push invoices out (write), pull supplier costs in (read)
- Price increase to the $70–110 band for new signups; existing operators grandfathered
  for six months

**Exit criterion**
≥60% of invoices paid through a platform-generated request (either rail). Realised margin
visible for ≥80% of closed jobs. Monthly report opened by ≥70% within 48 hours.

**Metric that kills it**
Payment adoption. If operators keep sending e-Transfers by hand and reconciling by memo
line, the job record never closes itself and the lock-in never forms.

**Open item**
Aggregator pricing and platform onboarding are unpublished. Expect a sales conversation and
a per-request fee. Get quotes from two before committing.

---

## Phase 3 — Ceiling and schedule (Q1–Q2 2027)

**Ceiling — gated on** interview answers from Phases 0–1 showing operators lose jobs on
price *and know it.* If they don't, cut it.

- Win / lost / ghosted from the customer accept link, no operator action needed
- Seeded price bands per service in both packs; learned bands after 25 outcomes
- Soft ceiling on the slider: *"above your win range"* with close rate at that price
- Minimum job size recommendation from breach patterns

**Schedule — built only as a margin feature.** A calendar that just shows appointments
fails the test. This one:

- Books from the accepted quote; no separate scheduling flow
- Computes drive time between jobs and feeds it into the day's overhead allocation, so a
  job 40 minutes away shows a higher floor than the same job next door
- Shows the day's total quoted-versus-floor margin, not just the day's jobs
- Reminders to the customer from the booked slot; review request on close-out

**Exit criterion**
Ceiling warnings shown to ≥50% of operators with measured change in median quoted price.
≥70% of accepted quotes booked through the platform.

---

## Phase 4 — Crew and expansion (H2 2027)

- Crew tier: multiple techs, per-tech wage and burden, job assignment, per-tech realised
  margin. Priced per tech.
- Memberships and recurring maintenance plans — realised margin per membership customer
  over time, which is the number that decides whether memberships are worth selling
- Lawn and turf pack, gated on label-rate data
- Pest, window, pool packs — each gated on the pack standard
- Distribution beyond the founder's network: supplier co-marketing, detailing forums,
  washing associations, Stripe partner listings

No date. Starts when Phase 2 payment adoption is proven and a second pack has shipped clean.

---

## What is never built

- A generic CRM. Customer records exist because quotes and invoices create them.
- Marketing automation, email campaigns, review-gating.
- A marketplace or lead-gen.
- Anything for a trade that fails the consumable test, however loudly it asks.

---

## Standing rules

1. Every feature touches the floor or the realised margin, or it is not built.
2. No vertical ships without a pack meeting 05-vertical-pack-guide.
3. No feature ships that asks the operator to author from blank.
4. No percentage appears in the UI except the target margin input.
5. Every report ends in a decision.
6. Every phase has one metric that can kill it. Watch that one.
7. Competitor parity is never a reason. If Jobber has it and it fails rule 1, it stays out.
