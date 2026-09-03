# Margin Truth — Vertical pack authoring guide

A pack is the product's moat and its biggest liability. A wrong coverage rate produces a
wrong floor, and a wrong floor loses the account permanently. This document is the standard
a pack must meet before it ships. It exists so that the second pack is not authored from
memory the way the first one was.

---

## What a pack contains

| Section | Rows | Author |
|---|---|---|
| Operator defaults | 1 | Pack author, from typical solo operator |
| Overhead lines | 13, fixed | Fixed list; defaults per vertical |
| Consumables | 15–30 | Pack author, with provenance |
| Services | 8–12 | Pack author |
| Service consumables | 40–80 | Pack author, with provenance |
| Price bands (month 3) | 1 per service | Pack author, with provenance |

---

## Provenance standard

Every consumable and every service-consumable row carries a `source` field. Four levels:

| Level | Meaning | Ships? |
|---|---|---|
| **measured** | Author weighed or measured it on real jobs, ≥5 samples | Yes |
| **operator** | Reported by a working operator in the vertical, named in notes | Yes |
| **label** | Manufacturer dilution or coverage from the product label / SDS | Yes, for dilution only |
| **estimate** | Author's judgement, no data | Demo only. Blocks launch. |

A pack ships when **zero rows are `estimate`** on the ten highest-cost consumable lines.
Low-cost lines (glass cleaner, dressing) can ship as `estimate` because they move the floor
by cents. Rank rows by `qtyPerUnit × costPerReadyToUseUnit` across all services and check
the top ten.

The current detailing pack fails this standard. Pads, tape, applicators, gloves and drying
aid are `estimate`. Fix before launch, not before demo.

---

## Baselining

**All labour minutes and consumable quantities are for a medium unit.** For detailing,
a mid-size sedan or small crossover. For washing, a single-storey vinyl surface. For turf,
a flat quarter acre.

If the author's numbers are averages across mixed jobs, they are not baselined, and size
scaling cannot be added later without re-collecting them. Baseline at authoring time.

Ask: *"How long does this take on a Camry?"* not *"How long does this take?"*

---

## Durables

Pads, towels, tape, applicators, gloves, sandpaper. Enter `containerSize` as **jobs of life**,
`dilution` 0, and quantity as a count per job. The formula produces cost per job.

Life is measured, not guessed. A cutting pad's life depends on the operator's habits and is
the single most under-counted cost on correction and coating work. Get it from three
operators and use the median.

---

## Overhead defaults by vertical

| Line | Detailing (mobile) | Pressure washing | Notes |
|---|---|---|---|
| Vehicle payments | 650 | 700 | Washing rigs are heavier |
| Vehicle insurance | 220 | 240 | |
| Liability insurance | 85 | 150 | Property damage exposure |
| Fuel | 300 | 400 | Pump fuel too |
| Vehicle maintenance | 120 | 150 | |
| Equipment replacement | 150 | 350 | Pumps, hoses, surface cleaners wear |
| Phone/internet | 90 | 90 | |
| Software | 80 | 80 | |
| Marketing | 150 | 200 | |
| Licences/accounting | 70 | 90 | |
| Facility rent | 0 | 0 | |
| Facility utilities | 0 | 0 | |
| Water | — | 60 | Bulk fill where metered |

These are `estimate`. They are onboarding defaults the operator overwrites; the standard is
looser than for coverage rates because the operator knows their own truck payment.

---

## Pressure / soft washing pack — outline

Measure unit: **100 sq ft** for surfaces, **linear ft** for gutters, **unit** for driveways
if the author prefers a flat per-driveway model.

Services (draft):

| ID | Service | Unit | Minutes / unit |
|---|---|---|---|
| W01 | House soft wash, vinyl | 100 sq ft | measured |
| W02 | House soft wash, stucco | 100 sq ft | measured |
| W03 | Roof soft wash | 100 sq ft | measured |
| W04 | Driveway, concrete | 100 sq ft | measured |
| W05 | Deck / fence wood | 100 sq ft | measured |
| W06 | Gutter clean and brighten | linear ft | measured |
| W07 | Commercial flatwork | 100 sq ft | measured |

Consumables (draft): sodium hypochlorite (by % and gallon), surfactant, degreaser, oxalic /
gutter brightener, F9 or equivalent rust remover, neutraliser, drying aids. Plus durables:
nozzles, surface cleaner components by hours, hose by season.

Coverage is expressed as **ready-to-use oz per 100 sq ft** at a stated mix ratio. SH
consumption depends on mix strength (1%, 2%, 3%) — record the strength per service, not
just the volume.

Do not ship this pack until the seven minutes columns and the SH consumption rows are
`measured` or `operator`.

---

## Review checklist

Before any pack ships:

- [ ] Top ten consumable lines by cost have provenance `measured` or `operator`
- [ ] Every durable has a measured life from ≥3 operators
- [ ] All minutes and quantities are baselined to a stated medium unit
- [ ] Overhead defaults exist for all thirteen lines
- [ ] Every service has ≥1 consumable row
- [ ] Floor Check run against three real jobs from a working operator; floors land within
      15% of what that operator, shown the stack, agrees is right
- [ ] `packVersion` set to the ship date

The last item is the real test. A pack is right when an operator looks at the stack and
argues with one line, not with the total.
