import { useState } from 'react'
import {
  usd, fmtMins, computeFloor, deriveRates,
  type Config, type Overrides,
} from './core'
import { FloorBar } from './FloorBar'

export interface Job {
  serviceId: string
  price: number
  reason: string
  ov: Overrides
}

export interface CloseOut {
  actualMins: number
  productFactor: number   // 1 = exactly as planned
  discount: number        // given on site, after the quote
}

function Wordmark() {
  return <p className="text-[12px] text-ink-3 text-center mt-auto pt-3 pb-1">Margin Truth</p>
}

function Stepper({ n }: { n: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map(i => (
        <span key={i} className="rounded-full transition-all duration-200"
          style={{
            width: i === n ? 18 : 6, height: 6,
            background: i <= n ? 'var(--color-ink)' : 'var(--color-rule)',
          }} />
      ))}
    </div>
  )
}

// ─── Close-out — spec §5, must stay under 20 seconds ──────────────────────────

export function CloseOutScreen({ config, job, onDone, onBack }: {
  config: Config
  job: Job
  onDone: (c: CloseOut) => void
  onBack: () => void
}) {
  const { labourMins } = computeFloor(job.serviceId, config, job.ov)
  const service = config.services.find(s => s.id === job.serviceId)!

  const [actualMins, setActualMins] = useState(labourMins)
  const [productFactor, setProductFactor] = useState(1)
  const [discount, setDiscount] = useState(0)
  const [touched, setTouched] = useState(false)

  const deltaMins = actualMins - labourMins

  function field(label: string, value: string, onDown: () => void, onUp: () => void, hint?: string) {
    return (
      <div className="px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-ink text-[15px]">{label}</div>
          {hint && <div className="text-ink-3 text-[12px] mt-0.5">{hint}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { onDown(); setTouched(true) }}
            className="w-11 h-11 rounded-[6px] border border-rule bg-paper text-ink text-[18px] leading-none">−</button>
          <span className="text-ink text-[15px] min-w-[68px] text-right tabular-nums">{value}</span>
          <button onClick={() => { onUp(); setTouched(true) }}
            className="w-11 h-11 rounded-[6px] border border-rule bg-paper text-ink text-[18px] leading-none">+</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-screen min-h-screen bg-paper flex flex-col items-center px-5">
      <div className="w-full max-w-[420px] flex flex-col gap-5 flex-1">

        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-[13px] text-ink-3 -ml-1 px-1 py-1">← Back</button>
          <Stepper n={2} />
        </div>

        <div>
          <div className="text-[18px] font-medium text-ink leading-[1.2]">Close out</div>
          <div className="text-ink-3 text-[13px] mt-0.5">
            {service.name} · quoted {usd(job.price)}
          </div>
        </div>

        {/* The fast path */}
        <button
          onClick={() => onDone({ actualMins: labourMins, productFactor: 1, discount: 0 })}
          className="w-full h-14 bg-accent text-accent-ink text-[15px] font-medium rounded-[6px]"
        >
          Went exactly as quoted
        </button>

        <p className="text-[12px] text-ink-3 text-center">
          Or correct only what changed.
        </p>

        <div className="bg-surface rounded-[10px] border border-rule overflow-hidden divide-y divide-rule">
          {field(
            'Time on the job',
            fmtMins(actualMins),
            () => setActualMins(m => Math.max(15, m - 15)),
            () => setActualMins(m => m + 15),
            deltaMins === 0 ? `Planned ${fmtMins(labourMins)}`
              : deltaMins > 0 ? `${fmtMins(deltaMins)} over plan` : `${fmtMins(-deltaMins)} under plan`,
          )}
          {field(
            'Product used',
            productFactor === 1 ? 'As planned' : `${productFactor > 1 ? '+' : ''}${Math.round((productFactor - 1) * 100)}%`,
            () => setProductFactor(f => Math.max(0.5, Math.round((f - 0.1) * 10) / 10)),
            () => setProductFactor(f => Math.min(2.5, Math.round((f + 0.1) * 10) / 10)),
          )}
          {field(
            'Discount given on site',
            discount === 0 ? 'Nothing' : usd(discount),
            () => setDiscount(d => Math.max(0, d - 10)),
            () => setDiscount(d => d + 10),
          )}
        </div>

        <button
          onClick={() => onDone({ actualMins, productFactor, discount })}
          disabled={!touched}
          className="w-full h-12 bg-surface border border-rule text-ink text-[15px] font-medium rounded-[6px] mt-auto disabled:opacity-40"
        >
          Save close-out
        </button>

        <Wordmark />
      </div>
    </div>
  )
}

// ─── Quoted vs realised — the retention screen ────────────────────────────────

export function RealisedScreen({ config, job, close, onNext, onBack }: {
  config: Config
  job: Job
  close: CloseOut
  onNext: () => void
  onBack: () => void
}) {
  const quoted = computeFloor(job.serviceId, config, job.ov)
  const service = config.services.find(s => s.id === job.serviceId)!
  const { overheadRate } = deriveRates(config)

  const hrs = close.actualMins / 60
  const rLabour   = hrs * quoted.burdened
  const rOverhead = hrs * overheadRate
  const rProduct  = quoted.consumableCost * close.productFactor
  const rFloor    = rLabour + rOverhead + rProduct
  const collected = job.price - close.discount

  const quotedMargin   = job.price - quoted.floor
  const realisedMargin = collected - rFloor
  const slip = quotedMargin - realisedMargin
  const worse = slip > 0.005
  const lost  = realisedMargin < 0

  const causes: { label: string; amount: number }[] = []
  const timeCost = (close.actualMins - quoted.labourMins) / 60 * (quoted.burdened + overheadRate)
  if (Math.abs(timeCost) > 0.005) {
    causes.push({
      label: close.actualMins > quoted.labourMins
        ? `${fmtMins(close.actualMins - quoted.labourMins)} over plan`
        : `${fmtMins(quoted.labourMins - close.actualMins)} under plan`,
      amount: timeCost,
    })
  }
  if (Math.abs(rProduct - quoted.consumableCost) > 0.005) {
    causes.push({ label: 'Product over plan', amount: rProduct - quoted.consumableCost })
  }
  if (close.discount > 0) {
    causes.push({ label: 'Discount given on site', amount: close.discount })
  }

  return (
    <div className="mt-screen min-h-screen bg-paper flex flex-col items-center px-5">
      <div className="w-full max-w-[420px] flex flex-col gap-5 flex-1">

        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-[13px] text-ink-3 -ml-1 px-1 py-1">← Back</button>
          <Stepper n={3} />
        </div>

        <div>
          <div className="text-[18px] font-medium text-ink leading-[1.2]">What you actually made</div>
          <div className="text-ink-3 text-[13px] mt-0.5">{service.name}</div>
        </div>

        {/* Verdict — the one saturated element */}
        <div className={`rounded-[8px] ${lost || worse ? 'bg-breach-bg' : 'bg-clear-bg'}`}
          style={{ padding: 20, animation: 'verdict-in 200ms ease-out' }}>
          <p className="text-[13px] leading-[1.4] mb-2" style={{
            color: lost || worse ? 'var(--color-breach-ink)' : 'var(--color-clear-ink)',
          }}>
            You quoted {usd(quotedMargin)} of margin.
          </p>
          <p className="mt-display text-[28px] font-medium leading-[1.2]" style={{
            color: lost || worse ? 'var(--color-breach-em)' : 'var(--color-clear-em)',
          }}>
            {lost
              ? `You lost ${usd(Math.abs(realisedMargin))}.`
              : `You kept ${usd(realisedMargin)}.`}
          </p>
          {worse && !lost && (
            <p className="text-[13px] leading-[1.4] mt-2" style={{ color: 'var(--color-breach-ink)' }}>
              {usd(slip)} less than the quote promised.
            </p>
          )}
        </div>

        {/* Bar against the realised floor */}
        <div className="bg-surface rounded-[10px] border border-rule px-5 py-5">
          <FloorBar
            labourCost={rLabour}
            overheadCost={rOverhead}
            consumableCost={rProduct}
            floor={rFloor}
            price={collected}
            priceLabel="Collected"
          />
        </div>

        {/* Where it went */}
        {causes.length > 0 && (
          <div className="bg-surface rounded-[10px] border border-rule overflow-hidden divide-y divide-rule">
            <div className="px-5 py-2.5">
              <span className="text-[12px] text-ink-3 uppercase" style={{ letterSpacing: '0.04em' }}>
                Where the margin went
              </span>
            </div>
            {causes.map(c => (
              <div key={c.label} className="px-5 py-3 flex justify-between items-center">
                <span className="text-ink text-[15px]">{c.label}</span>
                <span className="text-ink text-[15px] tabular-nums">
                  {c.amount >= 0 ? '−' : '+'}{usd(Math.abs(c.amount))}
                </span>
              </div>
            ))}
            {job.reason && (
              <div className="px-5 py-3 flex justify-between items-center gap-3">
                <span className="text-ink text-[15px]">Quoted below floor: {job.reason}</span>
                <span className="text-ink text-[15px] tabular-nums shrink-0">
                  −{usd(Math.abs(Math.min(0, quotedMargin)))}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="text-[12px] text-ink-3 text-center leading-relaxed">
          Quoted margin is a promise. This is the truth.
        </p>

        <button onClick={onNext}
          className="w-full h-12 bg-accent text-accent-ink text-[15px] font-medium rounded-[6px] mt-auto"
        >
          What happens next
        </button>

        <Wordmark />
      </div>
    </div>
  )
}

// ─── What comes after — deliberately not built ────────────────────────────────

export function NextScreen({ onRestart }: { onRestart: () => void }) {
  const steps = [
    { t: 'Invoice', d: 'One tap from close-out, carrying the real numbers, not the quoted ones.' },
    { t: 'Payment', d: 'Interac request from the invoice. Paid marks the job closed.' },
    { t: 'Sunday digest', d: 'Three lines: jobs closed, quoted vs realised in dollars, one decision.' },
  ]
  return (
    <div className="mt-screen min-h-screen bg-paper flex flex-col items-center px-5">
      <div className="w-full max-w-[420px] flex flex-col gap-5 flex-1">

        <div>
          <div className="text-[18px] font-medium text-ink leading-[1.2]">Then it gets you paid</div>
          <p className="text-ink-2 text-[15px] leading-[1.4] mt-2">
            The floor is the part nobody else has. The rest is the plumbing that keeps
            every job running through it.
          </p>
        </div>

        <div className="bg-surface rounded-[10px] border border-rule overflow-hidden divide-y divide-rule">
          {steps.map(s => (
            <div key={s.t} className="px-5 py-4">
              <div className="text-ink text-[15px] font-medium">{s.t}</div>
              <div className="text-ink-2 text-[13px] mt-1 leading-[1.4]">{s.d}</div>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-ink-3 text-center leading-relaxed">
          Not built yet. Shown so you can see the shape.
        </p>

        <button onClick={onRestart}
          className="w-full h-12 bg-accent text-accent-ink text-[15px] font-medium rounded-[6px] mt-auto"
        >
          Start over
        </button>

        <Wordmark />
      </div>
    </div>
  )
}
