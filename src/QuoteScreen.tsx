import { useMemo, useState } from 'react'
import {
  usd, usd0, fmtMins, computeFloor, REASON_CODES,
  type Config, type Overrides,
} from './core'
import { FloorStack } from './FloorStack'
import { FloorBar } from './FloorBar'

/**
 * Quote screen — spec §4.1.
 * The slider will not pass below the floor. Going below requires a reason code,
 * and the reason is recorded against the dollars given away.
 */
export function QuoteScreen({ config, onBack, onAccept }: {
  config: Config
  onBack: () => void
  onAccept: (job: { serviceId: string; price: number; reason: string; ov: Overrides }) => void
}) {
  const [serviceId, setServiceId] = useState(config.services[0].id)
  const [ov, setOv] = useState<Overrides>({ labourMinutes: null, wagePerHour: null, consumableQtys: {} })
  const [price, setPrice] = useState<number | null>(null)
  const [reason, setReason] = useState<string>('')
  const [askingReason, setAskingReason] = useState(false)

  const computed = useMemo(
    () => computeFloor(serviceId, config, ov),
    [serviceId, config, ov],
  )
  const { labourCost, overheadCost, consumableCost, floor, targetPrice, labourMins } = computed

  const service = config.services.find(s => s.id === serviceId)!

  // Slider domain. Always covers floor and target with headroom on each side.
  const min = Math.max(0, Math.floor(floor * 0.5))
  const max = Math.ceil(Math.max(targetPrice * 1.35, floor * 1.6))

  // Default the slider to the target price for the current service.
  const current = price ?? Math.round(targetPrice)
  const unlocked = reason !== ''
  const railMin = unlocked ? min : Math.round(floor)
  const shown = Math.max(railMin, Math.min(max, current))

  const margin = shown - floor
  const below = shown < floor - 0.005
  const atRail = !unlocked && Math.abs(shown - Math.round(floor)) < 0.5

  function changeService(id: string) {
    setServiceId(id)
    setPrice(null)
    setReason('')
    setAskingReason(false)
  }

  function handleSlide(v: number) {
    if (!unlocked && v <= Math.round(floor)) {
      setPrice(Math.round(floor))
      setAskingReason(true)
      return
    }
    setPrice(v)
  }

  function pct(n: number) {
    return `${((n - min) / (max - min)) * 100}%`
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center px-5 pt-8 pb-8">
      <div className="w-full max-w-[420px] flex flex-col gap-5 flex-1">

        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-[13px] text-ink-3 -ml-1 px-1 py-1">← Back</button>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(i => (
              <span key={i} className="rounded-full"
                style={{ width: i === 1 ? 18 : 6, height: 6,
                         background: i <= 1 ? 'var(--color-ink)' : 'var(--color-rule)' }} />
            ))}
          </div>
        </div>

        {/* Service */}
        <div className="space-y-2">
          <label className="block text-[12px] text-ink-3 uppercase" style={{ letterSpacing: '0.04em' }}>
            Service
          </label>
          <div className="relative">
            <select value={serviceId} onChange={e => changeService(e.target.value)}
              className="w-full h-12 pl-3 pr-9 bg-surface border border-rule rounded-[6px] text-ink text-[17px] appearance-none focus:border-ink focus:outline-none"
            >
              {config.services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
              width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[12px] text-ink-3">{fmtMins(labourMins)} of labour · {service.measureUnit}</p>
        </div>

        {/* Verdict block — the one saturated element */}
        <div
          className={`rounded-[8px] ${below ? 'bg-breach-bg' : 'bg-clear-bg'}`}
          style={{ padding: 20, animation: 'verdict-in 200ms ease-out' }}
        >
          <p className="text-[12px] uppercase mb-2" style={{
            letterSpacing: '0.04em',
            color: below ? 'var(--color-breach-ink)' : 'var(--color-clear-ink)',
          }}>
            Quote
          </p>
          <p className="text-[28px] font-medium leading-[1.2]" style={{
            color: below ? 'var(--color-breach-em)' : 'var(--color-clear-em)',
          }}>
            {usd(shown)}
          </p>
          <p className="text-[13px] leading-[1.4] mt-2" style={{
            color: below ? 'var(--color-breach-ink)' : 'var(--color-clear-ink)',
          }}>
            {below
              ? `Below your floor. This job costs you ${usd(Math.abs(margin))}.`
              : margin < 0.005
                ? 'Exactly at your floor. This job pays you nothing.'
                : `Keeps ${usd(margin)} after every cost of doing it.`}
          </p>
        </div>

        {/* Slider */}
        <div className="bg-surface rounded-[10px] border border-rule px-5 py-5 space-y-3">
          <div className="relative h-[26px]">
            {/* target tick */}
            <div className="absolute top-[9px] w-[2px] h-[14px] rounded-[1px]"
              style={{ left: pct(targetPrice), background: 'var(--color-rule-strong)' }} />
            {/* floor tick */}
            <div className="absolute top-[7px] w-[2px] h-[18px] rounded-[1px]"
              style={{ left: pct(floor), background: 'var(--color-ink)' }} />
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={shown}
              onChange={e => handleSlide(Number(e.target.value))}
              className="mt-quote-slider absolute inset-0 w-full"
              aria-label="Quote price"
            />
          </div>

          <div className="flex justify-between text-[12px] text-ink-3">
            <span>Floor {usd0(floor)}</span>
            <span>Target {usd0(targetPrice)}</span>
          </div>

          {atRail && !unlocked && (
            <p className="text-[12px] leading-[1.4]" style={{ color: 'var(--color-breach-ink)' }}>
              The slider stops here. Below this price the job costs you money.
            </p>
          )}
        </div>

        {/* Reason code — required to pass the rail */}
        {(askingReason || unlocked) && (
          <div className="bg-surface rounded-[10px] border border-rule px-5 py-4 space-y-2"
            style={{ animation: 'verdict-in 200ms ease-out' }}>
            <label className="block text-[12px] text-ink-3 uppercase" style={{ letterSpacing: '0.04em' }}>
              Why are you going below floor?
            </label>
            <div className="relative">
              <select value={reason} onChange={e => setReason(e.target.value)}
                className="w-full h-12 pl-3 pr-9 bg-paper border border-rule rounded-[6px] text-ink text-[17px] appearance-none focus:border-ink focus:outline-none"
              >
                <option value="">Choose a reason…</option>
                {REASON_CODES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
                width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {unlocked && below && (
              <p className="text-[12px] text-ink-3 leading-[1.4]">
                Recorded: {usd(Math.abs(margin))} given away to “{reason}”.
              </p>
            )}
            {!unlocked && (
              <p className="text-[12px] text-ink-3 leading-[1.4]">
                Pick one and the slider will go below your floor.
              </p>
            )}
          </div>
        )}

        {/* Where the money goes */}
        <div className="bg-surface rounded-[10px] border border-rule px-5 py-5">
          <FloorBar
            labourCost={labourCost}
            overheadCost={overheadCost}
            consumableCost={consumableCost}
            floor={floor}
            price={shown}
            priceLabel="Quote"
          />
        </div>

        <FloorStack config={config} ov={ov} onOvChange={setOv} computed={computed} />

        <p className="text-[12px] text-ink-3 text-center leading-relaxed">
          Every number here is yours except product coverage rates.
        </p>

        <button
          onClick={() => onAccept({ serviceId, price: shown, reason: below ? reason : '', ov })}
          className="w-full h-12 bg-accent text-accent-ink text-[15px] font-medium rounded-[6px] mt-auto"
        >
          Send quote &amp; book it
        </button>

        <Wordmark />
      </div>
    </div>
  )
}

function Wordmark() {
  return <p className="text-[12px] text-ink-3 text-center mt-auto pt-2">Margin Truth</p>
}
