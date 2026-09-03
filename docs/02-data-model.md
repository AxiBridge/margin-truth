# Margin Truth — Data model and computation

For Claude Code. Every number in the app derives from this document. If the UI and this
document disagree, this document wins.

---

## Entities

### Operator

```ts
type Operator = {
  techs: number;                 // ≥ 1
  wagePerHour: number;           // what they pay themselves or their tech
  labourBurden: number;          // 0 for solo owner draw; 0.10–0.20 with employees
  jobsPerWeekPerTech: number;
  avgHoursPerJob: number;
  monthlyOverhead: number;       // derived: Σ overheadLines.monthly
  targetMargin: number;          // 0 < x < 1, default 0.5
};
```

Derived, never stored as input:

```ts
burdenedLabourRate   = wagePerHour * (1 + labourBurden)
billableHoursPerMonth = techs * jobsPerWeekPerTech * avgHoursPerJob * 4.33
overheadRatePerHour  = monthlyOverhead / billableHoursPerMonth
loadedRatePerHour    = burdenedLabourRate + overheadRatePerHour
```

**Invariant:** there is no utilisation or billable-share multiplier. Jobs × hours is already
billable time. Applying a factor here double-counts.

### OverheadLine

```ts
type OverheadLine = { id: string; label: string; monthly: number; note?: string };
```

Fixed set of thirteen in the pack. Editable amounts. No add/delete in demo.

### Consumable

```ts
type Consumable = {
  id: string;                    // "C01"
  product: string;
  supplier?: string;
  containerSize: number;         // oz of concentrate, OR jobs-of-life for durables
  containerPrice: number;
  dilution: number;              // parts water : 1 part product. 0 = ready to use
  source?: string;               // provenance — required for packs, see 05
};
```

Derived:

```ts
costPerOzConcentrate    = containerPrice / containerSize
costPerReadyToUseUnit   = costPerOzConcentrate / (dilution + 1)
```

**Durables** (pads, towels, tape, applicators, gloves): `containerSize` is the number of jobs
one unit survives, `dilution` is 0, and the service-consumable quantity is a count. The same
formula produces cost per job. Do not build a separate durable type.

### Service

```ts
type Service = {
  id: string;                    // "S01"
  name: string;
  measureUnit: "vehicle" | "boat" | "100 sq ft" | "linear ft" | "unit" | "acre";
  labourMinutes: number;         // per measure unit
  currentPrice: number;          // what the operator charges today
  targetMargin?: number;         // per-service override; falls back to operator.targetMargin
};
```

### ServiceConsumable

```ts
type ServiceConsumable = {
  serviceId: string;
  consumableId: string;
  qtyPerUnit: number;            // ready-to-use oz, or count for durables
};
```

Derived: `cost = qtyPerUnit * consumable.costPerReadyToUseUnit`

### Job (retro-priced or quoted)

```ts
type Job = {
  serviceId: string;
  units: number;                 // 1 for a vehicle; sq ft ÷ 100 for washing
  chargedPrice?: number;         // retro-pricing input
  overrides?: {                  // per-job edits, do not write back to pack
    labourMinutes?: number;
    consumableQty?: Record<string, number>;
  };
};
```

---

## Computation

```ts
function floor(job, pack): FloorBreakdown {
  const svc = pack.services[job.serviceId];
  const minutes = job.overrides?.labourMinutes ?? svc.labourMinutes;
  const hours = minutes / 60 * job.units;

  const labour   = hours * burdenedLabourRate;
  const overhead = hours * overheadRatePerHour;

  const lines = pack.serviceConsumables
    .filter(r => r.serviceId === job.serviceId)
    .map(r => {
      const c = pack.consumables[r.consumableId];
      const qty = job.overrides?.consumableQty?.[r.consumableId] ?? r.qtyPerUnit;
      return { consumable: c, qty: qty * job.units, cost: qty * job.units * costPerReadyToUseUnit(c) };
    });
  const product = sum(lines.map(l => l.cost));

  const floor = labour + overhead + product;
  const target = floor / (1 - (svc.targetMargin ?? pack.operator.targetMargin));
  const gap = job.chargedPrice != null ? job.chargedPrice - floor : null;
  const realisedMargin = job.chargedPrice ? (job.chargedPrice - floor) / job.chargedPrice : null;

  return { labour, overhead, product, lines, floor, target, gap, realisedMargin, minutes, hours };
}
```

---

## Invariants and edge cases

- `billableHoursPerMonth` = 0 → overhead rate is 0, and the panel shows a warning:
  *"Enter jobs per week and hours per job to allocate overhead."* Never divide by zero silently.
- `containerSize` = 0 → consumable cost is 0 and the row shows *"no price"*. Never NaN.
- A `serviceConsumable` referencing a missing consumable → skip the row, log once. Never crash.
- `chargedPrice` blank → verdict block is hidden; stack still renders.
- `gap` exactly 0 → treat as cleared, not breached.
- Rounding: compute in full precision, round only at display. Currency to cents. Never round
  intermediate values.
- Currency display: `$1,234.56`. Under $1,000 still shows cents. Never show `$1.2k`.
- Percentages appear in exactly one place: the target margin input. Nowhere else in the UI.

---

## Persistence (demo)

```ts
localStorage["margin-truth:config:v1"] = JSON.stringify({
  operator, overheadLines, services  // user-editable set only
});
```

Consumables and serviceConsumables are edited per-job via `overrides` and are not persisted
in the demo. `Reset to defaults` deletes the key.

Version the key. A schema change bumps `v1` → `v2` and ignores stale data rather than
migrating it.

---

## Pack file

`pack-<vertical>.json`. One per vertical. Shape:

```json
{
  "vertical": "detailing",
  "packVersion": "2026-09-03",
  "operator": { ...defaults },
  "overheadLines": [...],
  "consumables": [...],
  "services": [...],
  "serviceConsumables": [...]
}
```

`packVersion` is a date. The app displays it in the config panel footer so a stale pack is
visible. Provenance rules for pack contents are in 05-vertical-pack-guide.md.

---

## Deferred, with the model to add when ready

**Size class.** Add `sizeClass: "S"|"M"|"L"|"XL"` to Job and `sizeMultipliers` to the pack
**only** after `labourMinutes` and `qtyPerUnit` are re-baselined to a medium vehicle.
Multiplier applies to hours and to every consumable quantity, not to the summed floor.

**Ceiling.** Add `priceBands: { serviceId, low, high, source }[]` to the pack (seeded) and
`quoteOutcomes: { jobId, price, outcome: "won"|"lost"|"ghosted", at }[]` (learned).

**Realised.** Add `actualMinutes` and `actualConsumableQty` to Job; realised floor uses those
in place of planned values.
