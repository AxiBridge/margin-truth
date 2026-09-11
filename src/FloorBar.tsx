import { usd } from './core'

/**
 * Neutral stacked bar: labour + overhead + product = the floor.
 * A single hairline marker shows where the price sits against that stack.
 * Deliberately unsaturated — the verdict block is the only coloured element
 * on the screen (design system, principle 1).
 */
export function FloorBar({ labourCost, overheadCost, consumableCost, floor, price, priceLabel }: {
  labourCost: number
  overheadCost: number
  consumableCost: number
  floor: number
  price: number
  priceLabel: string
}) {
  const scale = Math.max(floor, price, 1)
  const pct = (n: number) => `${(n / scale) * 100}%`
  const pricePct = Math.min(100, Math.max(0, (price / scale) * 100))
  const below = price < floor

  const segs = [
    { key: 'labour',   label: 'Labour',   amount: labourCost,     fill: 'var(--color-ink-2)' },
    { key: 'overhead', label: 'Overhead', amount: overheadCost,   fill: 'var(--color-ink-3)' },
    { key: 'product',  label: 'Product',  amount: consumableCost, fill: 'var(--color-rule-strong)' },
  ]

  return (
    <div className="select-none">
      {/* Marker label */}
      <div className="relative h-[18px] mb-1.5">
        <div
          className="absolute top-0 text-[12px] text-ink whitespace-nowrap transition-all duration-300 ease-out"
          style={{
            left: `${pricePct}%`,
            transform: pricePct > 62 ? 'translateX(-100%)' : 'translateX(-50%)',
          }}
        >
          {priceLabel} {usd(price)}
        </div>
      </div>

      {/* Bar */}
      <div className="relative">
        <div
          className="flex w-full overflow-hidden rounded-[3px]"
          style={{ height: 12, background: 'var(--color-rule)' }}
        >
          {segs.map(s => (
            <div
              key={s.key}
              className="transition-all duration-300 ease-out"
              style={{ width: pct(s.amount), background: s.fill }}
            />
          ))}
        </div>

        {/* Price marker — hairline through the bar */}
        <div
          className="absolute transition-all duration-300 ease-out"
          style={{
            left: `${pricePct}%`,
            top: -4,
            height: 20,
            width: 2,
            marginLeft: -1,
            background: 'var(--color-ink)',
            borderRadius: 1,
          }}
        />
      </div>

      {/* Floor caption */}
      <div className="flex justify-between items-baseline mt-2">
        <div className="flex items-center gap-3">
          {segs.map(s => (
            <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-ink-3">
              <span
                className="inline-block rounded-[1px]"
                style={{ width: 8, height: 8, background: s.fill }}
              />
              {s.label}
            </span>
          ))}
        </div>
        <span className="text-[12px] text-ink-3">
          Floor {usd(floor)}
        </span>
      </div>

      {below && (
        <p className="text-[12px] text-ink-3 mt-2 leading-[1.4]">
          The bar past your mark is cost you did not charge for.
        </p>
      )}
    </div>
  )
}
