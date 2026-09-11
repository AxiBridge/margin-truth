import { useEffect, useState } from 'react'
import {
  usd, fmtMins, computeFloor, deriveRates, loadConfig, defaultConfig,
  type Config, type Overrides, type OperatorConfig, type ServiceConfig,
} from './core'
import { Chevron, Expand, SectionLabel, FloorStack } from './FloorStack'
import { FloorBar } from './FloorBar'
import { QuoteScreen } from './QuoteScreen'

// ─── Config panel ─────────────────────────────────────────────────────────────

function ConfigPanel({ config, onChange }: { config: Config; onChange: (cfg: Config) => void }) {
  const [panelOpen, setPanelOpen]   = useState(false)
  const [overheadOpen, setOverheadOpen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)

  const { monthlyOverhead, billableHours, overheadRate, loadedRate } = deriveRates(config)

  function setOp(partial: Partial<OperatorConfig>) {
    onChange({ ...config, operator: { ...config.operator, ...partial } })
  }
  function setOverheadLine(i: number, monthly: number) {
    const next = config.overheadLines.map((l, j) => j === i ? { ...l, monthly } : l)
    onChange({ ...config, overheadLines: next })
  }
  function setSvc(i: number, partial: Partial<ServiceConfig>) {
    const next = config.services.map((s, j) => j === i ? { ...s, ...partial } : s)
    onChange({ ...config, services: next })
  }
  function handleReset() {
    onChange(defaultConfig())
    setResetConfirm(false)
  }

  return (
    <div className="bg-surface rounded-[10px] border border-rule overflow-hidden">
      {/* Header — styled as a stack row */}
      <button
        onClick={() => { setPanelOpen(p => !p); setResetConfirm(false) }}
        className={`w-full px-5 flex items-center justify-between text-left gap-3 transition-colors ${panelOpen ? 'bg-paper' : 'bg-surface'}`}
        style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
      >
        <span className="text-ink-2 text-[15px]">
          Your numbers —{' '}
          <span className="text-ink">{usd(loadedRate)}/hour loaded</span>
        </span>
        <Chevron open={panelOpen} />
      </button>

      <Expand open={panelOpen}>
        <div className="border-t border-rule divide-y divide-rule">

          {/* 1. Pay */}
          <section className="px-5 py-5 space-y-4">
            <SectionLabel>Pay</SectionLabel>
            <label className="block">
              <span className="block text-[13px] text-ink-2 mb-2">What you pay yourself, $/hr</span>
              <input type="number" min={0} value={config.operator.wagePerHour}
                onChange={e => setOp({ wagePerHour: Number(e.target.value) })}
                className="w-full h-12 px-3 bg-surface border border-rule rounded-[6px] text-ink text-[17px] focus:border-ink focus:outline-none"
              />
            </label>
          </section>

          {/* 2. Overhead */}
          <section className="px-5 py-5 space-y-4">
            <SectionLabel>Overhead</SectionLabel>
            <button
              onClick={() => setOverheadOpen(p => !p)}
              className="w-full flex items-center justify-between text-left gap-3"
              style={{ minHeight: 44 }}
            >
              <span className="text-ink-2 text-[15px]">
                Monthly overhead —{' '}
                <span className="text-ink">{usd(monthlyOverhead)}</span>
              </span>
              <Chevron open={overheadOpen} />
            </button>
            <Expand open={overheadOpen}>
              <div className="space-y-3 pt-1">
                {config.overheadLines.map((line, i) => (
                  <div key={line.label} className="flex items-center gap-3">
                    <span className="flex-1 text-[13px] text-ink-2 min-w-0 leading-snug">{line.label}</span>
                    <div className="relative shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-[13px] pointer-events-none">$</span>
                      <input type="number" min={0} value={line.monthly}
                        onChange={e => setOverheadLine(i, Number(e.target.value))}
                        className="w-28 h-12 pl-6 pr-3 bg-surface border border-rule rounded-[6px] text-ink text-[15px] text-right focus:border-ink focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-rule text-[13px] font-medium text-ink-2">
                  <span>Total</span>
                  <span>{usd(monthlyOverhead)}/mo</span>
                </div>
              </div>
            </Expand>
          </section>

          {/* 3. Capacity */}
          <section className="px-5 py-5 space-y-4">
            <SectionLabel>Capacity</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Jobs / week', key: 'jobsPerWeekPerTech' as const, step: 1 },
                { label: 'Hrs / job',   key: 'avgHoursPerJob'     as const, step: 0.5 },
                { label: 'Techs',       key: 'techs'              as const, step: 1 },
              ].map(({ label, key, step }) => (
                <label key={key} className="block">
                  <span className="block text-[12px] text-ink-3 mb-1.5">{label}</span>
                  <input type="number" min={key === 'techs' ? 1 : 0} step={step}
                    value={config.operator[key]}
                    onChange={e => setOp({ [key]: Number(e.target.value) })}
                    className="w-full h-12 px-2 bg-surface border border-rule rounded-[6px] text-ink text-[15px] text-center focus:border-ink focus:outline-none"
                  />
                </label>
              ))}
            </div>
            {billableHours === 0 ? (
              <p className="text-[13px] text-ink-3">
                Enter jobs per week to allocate overhead.
              </p>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[13px] text-ink-2">
                  <span className="font-medium">{billableHours.toFixed(1)} billable hours / month</span>
                  <span className="font-medium">{usd(overheadRate)}/hr overhead</span>
                </div>
                <p className="text-[12px] text-ink-3 leading-relaxed">
                  {config.operator.techs} tech × {config.operator.jobsPerWeekPerTech} jobs × {config.operator.avgHoursPerJob} hrs × 4.33 = {billableHours.toFixed(1)} hrs · {usd(monthlyOverhead)} ÷ {billableHours.toFixed(1)} = {usd(overheadRate)}/hr
                </p>
              </div>
            )}
          </section>

          {/* 4. Services */}
          <section className="px-5 py-5 space-y-4">
            <SectionLabel>Services</SectionLabel>
            <div className="grid text-[12px] text-ink-3 mb-1" style={{ gridTemplateColumns: '1fr 56px 80px', gap: '8px' }}>
              <span>Service</span>
              <span className="text-center">Min</span>
              <span className="text-right pr-1">You charge</span>
            </div>
            <div className="space-y-2">
              {config.services.map((svc, i) => (
                <div key={svc.id} className="grid items-center" style={{ gridTemplateColumns: '1fr 56px 80px', gap: '8px' }}>
                  <input type="text" value={svc.name}
                    onChange={e => setSvc(i, { name: e.target.value })}
                    className="h-11 px-3 bg-surface border border-rule rounded-[6px] text-ink text-[13px] focus:border-ink focus:outline-none min-w-0 w-full"
                  />
                  <input type="number" min={0} value={svc.labourMinutes}
                    onChange={e => setSvc(i, { labourMinutes: Number(e.target.value) })}
                    className="h-11 px-2 bg-surface border border-rule rounded-[6px] text-ink text-[13px] text-center focus:border-ink focus:outline-none w-full"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3 text-[12px] pointer-events-none">$</span>
                    <input type="number" min={0} value={svc.currentPrice}
                      onChange={e => setSvc(i, { currentPrice: Number(e.target.value) })}
                      className="h-11 pl-5 pr-2 bg-surface border border-rule rounded-[6px] text-ink text-[13px] text-right focus:border-ink focus:outline-none w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reset */}
          <div className="px-5 py-4">
            {resetConfirm ? (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[13px] text-ink-2 flex-1 min-w-0">Restore all numbers to defaults?</span>
                <button onClick={handleReset}
                  className="text-[13px] text-breach-em font-medium"
                  style={{ minHeight: 44 }}
                >
                  Confirm
                </button>
                <button onClick={() => setResetConfirm(false)}
                  className="text-[13px] text-ink-3"
                  style={{ minHeight: 44 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setResetConfirm(true)}
                className="text-[13px] text-ink-3"
                style={{ minHeight: 44 }}
              >
                Reset to defaults
              </button>
            )}
          </div>

        </div>
      </Expand>
    </div>
  )
}

// ─── Wordmark ─────────────────────────────────────────────────────────────────

function Wordmark() {
  return <p className="text-[12px] text-ink-3 text-center">Margin Truth</p>
}

// ─── Entry screen ─────────────────────────────────────────────────────────────

function EntryScreen({ config, onConfigChange, onBack, onSubmit }: {
  config: Config
  onConfigChange: (cfg: Config) => void
  onBack: () => void
  onSubmit: (serviceId: string, charged: number) => void
}) {
  const [serviceId, setServiceId] = useState(config.services[0].id)
  const [charged, setCharged]     = useState('')
  const [error, setError]         = useState('')

  function handleSubmit() {
    const n = parseFloat(charged)
    if (isNaN(n) || n < 0) { setError('Enter the amount you charged.'); return }
    onSubmit(serviceId, n)
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center px-5 pt-8 pb-8">
      <div className="w-full max-w-[420px] flex flex-col gap-6 flex-1">

        <button onClick={onBack}
          className="self-start text-[13px] text-ink-3 -ml-1 px-1 py-1"
        >
          ← Back
        </button>

        <ConfigPanel config={config} onChange={onConfigChange} />

        <p className="text-ink-2 text-[15px] leading-[1.4]">
          Think of a job from last week you felt good about.
        </p>

        <div className="space-y-5">
          {/* Service */}
          <div className="space-y-2">
            <label className="block text-[12px] text-ink-3 uppercase" style={{ letterSpacing: '0.04em' }}>
              Service
            </label>
            <div className="relative">
              <select value={serviceId} onChange={e => setServiceId(e.target.value)}
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
          </div>

          {/* What you charged */}
          <div className="space-y-2">
            <label className="block text-[12px] text-ink-3 uppercase" style={{ letterSpacing: '0.04em' }}>
              What you charged
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-[17px] pointer-events-none select-none">$</span>
              <input type="number" inputMode="decimal" min={0} step={0.01}
                value={charged}
                onChange={e => { setCharged(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full h-12 pl-7 pr-3 bg-surface border border-rule rounded-[6px] text-ink text-[17px] focus:border-ink focus:outline-none"
              />
            </div>
            {error && <p className="text-[13px] text-breach-ink mt-1">{error}</p>}
          </div>
        </div>

        <button onClick={handleSubmit}
          className="w-full h-12 bg-accent text-accent-ink text-[15px] font-medium rounded-[6px] mt-auto"
        >
          Show me the floor
        </button>

        <Wordmark />
      </div>
    </div>
  )
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({ serviceId, charged, config, onBack }: {
  serviceId: string
  charged: number
  config: Config
  onBack: () => void
}) {
  const [ov, setOv] = useState<Overrides>({ labourMinutes: null, wagePerHour: null, consumableQtys: {} })

  const computed = computeFloor(serviceId, config, ov)
  const { labourCost, overheadCost, consumableCost, floor, targetPrice, labourMins } = computed

  const service = config.services.find(s => s.id === serviceId)!
  const gap     = charged - floor
  const isLoss  = gap < 0

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center px-5 pt-8 pb-8">
      <div className="w-full max-w-[420px] flex flex-col gap-5 flex-1">

        <div>
          <div className="text-[18px] font-medium text-ink leading-[1.2]">{service.name}</div>
          <div className="text-ink-3 text-[13px] mt-0.5">{fmtMins(labourMins)}</div>
        </div>

        {/* Verdict */}
        <div
          className={`rounded-[8px] ${isLoss ? 'bg-breach-bg' : 'bg-clear-bg'}`}
          style={{ padding: 20, animation: 'verdict-in 200ms ease-out' }}
        >
          {isLoss ? (
            <>
              <p className="text-[13px] leading-[1.4] mb-2" style={{ color: 'var(--color-breach-ink)' }}>
                You charged {usd(charged)}. Your floor was {usd(floor)}.
              </p>
              <p className="text-[28px] font-medium leading-[1.2]" style={{ color: 'var(--color-breach-em)' }}>
                That job cost you {usd(Math.abs(gap))}.
              </p>
            </>
          ) : (
            <>
              <p className="text-[28px] font-medium leading-[1.2]" style={{ color: 'var(--color-clear-em)' }}>
                You cleared your floor by {usd(gap)}.
              </p>
              <p className="text-[13px] leading-[1.4] mt-2" style={{ color: 'var(--color-clear-ink)' }}>
                Your target margin would put it at {usd(targetPrice)}.
              </p>
            </>
          )}
        </div>

        {/* Where the money went */}
        <div className="bg-surface rounded-[10px] border border-rule px-5 py-5">
          <FloorBar
            labourCost={labourCost}
            overheadCost={overheadCost}
            consumableCost={consumableCost}
            floor={floor}
            price={charged}
            priceLabel="You charged"
          />
        </div>

        <FloorStack config={config} ov={ov} onOvChange={setOv} computed={computed} />

        <p className="text-[12px] text-ink-3 text-center leading-relaxed">
          Every number here is yours except product coverage rates.
        </p>

        <button onClick={onBack}
          className="w-full h-12 bg-accent text-accent-ink text-[15px] font-medium rounded-[6px] mt-auto"
        >
          Check another job
        </button>

        <Wordmark />
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

type Mode = 'home' | 'retro' | 'result' | 'quote'

function HomeScreen({ config, onConfigChange, onPick }: {
  config: Config
  onConfigChange: (cfg: Config) => void
  onPick: (mode: Mode) => void
}) {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center px-5 pt-8 pb-8">
      <div className="w-full max-w-[420px] flex flex-col gap-6 flex-1">

        <ConfigPanel config={config} onChange={onConfigChange} />

        <div className="mt-2">
          <h1 className="text-[18px] font-medium text-ink leading-[1.2]">
            You're underquoting and you can't see it.
          </h1>
          <p className="text-ink-2 text-[15px] leading-[1.4] mt-2">
            Every price below is built from your pay, your overhead and the product
            you actually use.
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <button onClick={() => onPick('quote')}
            className="w-full h-12 bg-accent text-accent-ink text-[15px] font-medium rounded-[6px]"
          >
            Price my next job
          </button>
          <button onClick={() => onPick('retro')}
            className="w-full h-12 bg-surface border border-rule text-ink text-[15px] font-medium rounded-[6px]"
          >
            Check a job I already did
          </button>
        </div>

        <Wordmark />
      </div>
    </div>
  )
}

export default function App() {
  const [config, setConfig] = useState<Config>(loadConfig)
  const [mode, setMode]     = useState<Mode>('home')
  const [job, setJob]       = useState<{ serviceId: string; charged: number } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem('margin-truth:config:v1', JSON.stringify(config))
    }, 300)
    return () => clearTimeout(t)
  }, [config])

  if (mode === 'quote') {
    return <QuoteScreen config={config} onBack={() => setMode('home')} />
  }

  if (mode === 'result' && job) {
    return (
      <ResultScreen serviceId={job.serviceId} charged={job.charged} config={config}
        onBack={() => { setJob(null); setMode('retro') }} />
    )
  }

  if (mode === 'retro') {
    return (
      <EntryScreen config={config} onConfigChange={setConfig}
        onBack={() => setMode('home')}
        onSubmit={(serviceId, charged) => { setJob({ serviceId, charged }); setMode('result') }} />
    )
  }

  return <HomeScreen config={config} onConfigChange={setConfig} onPick={setMode} />
}
