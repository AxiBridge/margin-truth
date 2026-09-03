import { useEffect, useState } from 'react'
import pack from './data/pack-detailing.json'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OperatorConfig {
  wagePerHour: number
  labourBurden: number
  techs: number
  jobsPerWeekPerTech: number
  avgHoursPerJob: number
  targetMargin: number
}

interface OverheadLineConfig {
  label: string
  monthly: number
}

interface ServiceConfig {
  id: string
  name: string
  measureUnit: string
  labourMinutes: number
  currentPrice: number
}

interface Config {
  operator: OperatorConfig
  overheadLines: OverheadLineConfig[]
  services: ServiceConfig[]
}

type ExpandedRow = 'labour' | 'overhead' | 'product' | null

interface Overrides {
  labourMinutes: number | null
  wagePerHour: number | null
  consumableQtys: Record<string, number>
}

type SCRow = typeof pack.serviceConsumables[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function usd(n: number): string {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtMins(m: number): string {
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}

function defaultConfig(): Config {
  return {
    operator: {
      wagePerHour:        pack.operator.wagePerHour,
      labourBurden:       pack.operator.labourBurden,
      techs:              pack.operator.techs,
      jobsPerWeekPerTech: pack.operator.jobsPerWeekPerTech,
      avgHoursPerJob:     pack.operator.avgHoursPerJob,
      targetMargin:       pack.operator.targetMargin,
    },
    overheadLines: pack.overheadLines.map(l => ({ label: l.label, monthly: l.monthly })),
    services: pack.services.map(s => ({
      id: s.id, name: s.name, measureUnit: s.measureUnit,
      labourMinutes: s.labourMinutes, currentPrice: s.currentPrice,
    })),
  }
}

function loadConfig(): Config {
  try {
    const raw = localStorage.getItem('margin-truth:config:v1')
    if (raw) return JSON.parse(raw) as Config
  } catch { /* fall through */ }
  return defaultConfig()
}

function deriveRates(cfg: Config) {
  const monthlyOverhead = cfg.overheadLines.reduce((s, l) => s + l.monthly, 0)
  const billableHours   = cfg.operator.techs * cfg.operator.jobsPerWeekPerTech * cfg.operator.avgHoursPerJob * 4.33
  const overheadRate    = billableHours > 0 ? monthlyOverhead / billableHours : 0
  const burdened        = cfg.operator.wagePerHour * (1 + cfg.operator.labourBurden)
  return { monthlyOverhead, billableHours, overheadRate, burdened, loadedRate: burdened + overheadRate }
}

// ─── Computation ──────────────────────────────────────────────────────────────

function computeFloor(serviceId: string, config: Config, ov: Overrides) {
  const service  = config.services.find(s => s.id === serviceId)!
  const { overheadRate, billableHours, monthlyOverhead } = deriveRates(config)
  const scRows   = pack.serviceConsumables.filter(sc => sc.serviceId === serviceId)

  const labourMins = ov.labourMinutes ?? service.labourMinutes
  const wage       = ov.wagePerHour  ?? config.operator.wagePerHour
  const burdened   = wage * (1 + config.operator.labourBurden)
  const hrs        = labourMins / 60

  const labourCost   = hrs * burdened
  const overheadCost = hrs * overheadRate
  const consumableCost = scRows.reduce((sum, sc) => {
    const c   = pack.consumables.find(c => c.id === sc.consumableId)!
    const qty = ov.consumableQtys[sc.consumableId] ?? sc.qtyPerMediumUnit
    return sum + qty * c.costPerReadyToUseUnit
  }, 0)

  const floor       = labourCost + overheadCost + consumableCost
  const targetPrice = floor / (1 - config.operator.targetMargin)

  return { labourCost, overheadCost, consumableCost, floor, targetPrice,
           burdened, wage, labourMins, scRows, overheadRate, billableHours, monthlyOverhead }
}

// ─── Chevron ──────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      className="shrink-0 text-ink-3"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 180ms ease-out' }}
    >
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Animated expand wrapper ──────────────────────────────────────────────────

function Expand({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: open ? '1fr' : '0fr',
      transition: 'grid-template-rows 180ms ease-out',
    }}>
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] text-ink-3 uppercase font-normal" style={{ letterSpacing: '0.04em' }}>
      {children}
    </div>
  )
}

// ─── Floor stack rows ─────────────────────────────────────────────────────────

function FloorRow({ label, meta, amount, open, onToggle, children }: {
  label: string
  meta: string
  amount: number | null
  open: boolean
  onToggle: () => void
  children?: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full px-5 flex items-center justify-between text-left gap-3 transition-colors ${open ? 'bg-paper' : 'bg-surface'}`}
        style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-ink-2 text-[15px]">{label}</span>
          <span className="text-ink-3 text-[13px] truncate">{meta}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {amount !== null && (
            <span className="text-ink text-[15px]">{usd(amount)}</span>
          )}
          <Chevron open={open} />
        </div>
      </button>
      <Expand open={open}>
        <div className="bg-paper border-t border-rule" style={{ paddingLeft: 16, paddingRight: 20, paddingBottom: 20, paddingTop: 16 }}>
          {children}
        </div>
      </Expand>
    </div>
  )
}

// ─── Labour detail ────────────────────────────────────────────────────────────

function LabourDetail({ wage, labourMins, burdened, labourCost, labourBurden, onWageChange, onMinsChange }: {
  wage: number
  labourMins: number
  burdened: number
  labourCost: number
  labourBurden: number
  onWageChange: (v: number) => void
  onMinsChange: (v: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[12px] text-ink-3 mb-1.5" style={{ letterSpacing: '0.04em' }}>WAGE $/HR</span>
          <input type="number" min={0} value={wage}
            onChange={e => onWageChange(Number(e.target.value))}
            className="w-full h-12 px-3 bg-surface border border-rule rounded-[6px] text-ink text-[17px] focus:border-ink focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-[12px] text-ink-3 mb-1.5" style={{ letterSpacing: '0.04em' }}>MINUTES</span>
          <input type="number" min={0} value={labourMins}
            onChange={e => onMinsChange(Number(e.target.value))}
            className="w-full h-12 px-3 bg-surface border border-rule rounded-[6px] text-ink text-[17px] focus:border-ink focus:outline-none"
          />
        </label>
      </div>
      <div className="text-[13px] space-y-2 text-ink-3">
        {labourBurden > 0 && (
          <div className="flex justify-between">
            <span>Burden ({(labourBurden * 100).toFixed(0)}%)</span>
            <span>+{usd(wage * labourBurden)}/hr</span>
          </div>
        )}
        <div className="flex justify-between text-ink-2">
          <span>Burdened rate</span>
          <span>{usd(burdened)}/hr</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-rule text-ink-2">
          <span>{labourMins} min ÷ 60 × {usd(burdened)}</span>
          <span className="font-medium text-ink">{usd(labourCost)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Overhead detail ──────────────────────────────────────────────────────────

function OverheadDetail({ overheadLines, overheadRate, billableHours, monthlyOverhead, labourMins }: {
  overheadLines: OverheadLineConfig[]
  overheadRate: number
  billableHours: number
  monthlyOverhead: number
  labourMins: number
}) {
  const cost = (labourMins / 60) * overheadRate
  return (
    <div className="space-y-3 text-[13px]">
      <div className="space-y-1.5">
        {overheadLines.map(line => (
          <div key={line.label} className="flex justify-between">
            <span className="text-ink-2">{line.label}</span>
            <span className="text-ink-3">{usd(line.monthly)}/mo</span>
          </div>
        ))}
      </div>
      <div className="border-t border-rule pt-3 space-y-2">
        <div className="flex justify-between text-ink-2 font-medium">
          <span>Total monthly</span>
          <span>{usd(monthlyOverhead)}/mo</span>
        </div>
        <div className="flex justify-between text-ink-3">
          <span>Billable hours / month</span>
          <span>{billableHours.toFixed(2)} hrs</span>
        </div>
        <div className="flex justify-between text-ink-2 font-medium pt-2 border-t border-rule">
          <span>Coverage rate</span>
          <span>{usd(overheadRate)}/hr</span>
        </div>
        <div className="flex justify-between text-ink-3 pt-1 border-t border-rule">
          <span>{labourMins} min ÷ 60 × {usd(overheadRate)}</span>
          <span className="font-medium text-ink">{usd(cost)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Product detail ───────────────────────────────────────────────────────────

function ProductDetail({ scRows, overrides, onQtyChange }: {
  scRows: SCRow[]
  overrides: Record<string, number>
  onQtyChange: (id: string, qty: number) => void
}) {
  return (
    <div className="space-y-0 text-[13px]">
      {scRows.map((sc, i) => {
        const c        = pack.consumables.find(c => c.id === sc.consumableId)!
        const qty      = overrides[sc.consumableId] ?? sc.qtyPerMediumUnit
        const lineCost = qty * c.costPerReadyToUseUnit
        return (
          <div key={sc.consumableId}
            className={`flex items-center gap-3 py-2 ${i < scRows.length - 1 ? 'border-b border-rule' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-ink-2 truncate">{c.product}</div>
              <div className="text-ink-3 text-[12px]">{usd(c.costPerReadyToUseUnit)} ea</div>
            </div>
            <input type="number" min={0} step={0.5} value={qty}
              onChange={e => onQtyChange(sc.consumableId, Number(e.target.value))}
              className="w-14 bg-surface border border-rule rounded-[6px] text-ink text-[13px] text-center focus:border-ink focus:outline-none"
              style={{ height: 36 }}
            />
            <div className="w-16 text-right text-ink shrink-0">{usd(lineCost)}</div>
          </div>
        )
      })}
      <p className="pt-3 text-[12px] text-ink-3">
        Quantities are our estimates for a mid-size vehicle.
      </p>
    </div>
  )
}

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

function EntryScreen({ config, onConfigChange, onSubmit }: {
  config: Config
  onConfigChange: (cfg: Config) => void
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
  const [expanded, setExpanded] = useState<ExpandedRow>(null)
  const [ov, setOv] = useState<Overrides>({ labourMinutes: null, wagePerHour: null, consumableQtys: {} })

  const { labourCost, overheadCost, consumableCost, floor, targetPrice,
          burdened, wage, labourMins, scRows, overheadRate, billableHours, monthlyOverhead }
    = computeFloor(serviceId, config, ov)

  const service = config.services.find(s => s.id === serviceId)!
  const gap     = charged - floor
  const isLoss  = gap < 0

  function toggle(row: ExpandedRow) {
    setExpanded(prev => prev === row ? null : row)
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center px-5 pt-8 pb-8">
      <div className="w-full max-w-[420px] flex flex-col gap-5 flex-1">

        {/* Subhead */}
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

        {/* Floor stack */}
        <div className="bg-surface rounded-[10px] border border-rule overflow-hidden divide-y divide-rule">
          <FloorRow label="Labour" meta={fmtMins(labourMins)} amount={labourCost}
            open={expanded === 'labour'} onToggle={() => toggle('labour')}
          >
            <LabourDetail wage={wage} labourMins={labourMins} burdened={burdened}
              labourCost={labourCost} labourBurden={config.operator.labourBurden}
              onWageChange={v => setOv(p => ({ ...p, wagePerHour: v }))}
              onMinsChange={v => setOv(p => ({ ...p, labourMinutes: v }))}
            />
          </FloorRow>

          <FloorRow label="Overhead" meta={fmtMins(labourMins)} amount={overheadCost}
            open={expanded === 'overhead'} onToggle={() => toggle('overhead')}
          >
            <OverheadDetail overheadLines={config.overheadLines} overheadRate={overheadRate}
              billableHours={billableHours} monthlyOverhead={monthlyOverhead} labourMins={labourMins}
            />
          </FloorRow>

          <FloorRow label="Product" meta={`${scRows.length} items`} amount={consumableCost}
            open={expanded === 'product'} onToggle={() => toggle('product')}
          >
            <ProductDetail scRows={scRows} overrides={ov.consumableQtys}
              onQtyChange={(id, qty) => setOv(p => ({ ...p, consumableQtys: { ...p.consumableQtys, [id]: qty } }))}
            />
          </FloorRow>

          {/* Floor total */}
          <div className="px-5 py-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--color-rule-strong)' }}>
            <span className="text-ink text-[15px] font-medium">Floor</span>
            <span className="text-ink text-[15px] font-medium">{usd(floor)}</span>
          </div>
        </div>

        {/* Disclosure */}
        <p className="text-[12px] text-ink-3 text-center leading-relaxed">
          Every number here is yours except product coverage rates.
        </p>

        <button onClick={onBack}
          className="w-full h-12 bg-accent text-accent-ink text-[15px] font-medium rounded-[6px] mt-auto"
        >
          Price my next one
        </button>

        <Wordmark />
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [config, setConfig] = useState<Config>(loadConfig)
  const [job, setJob]       = useState<{ serviceId: string; charged: number } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem('margin-truth:config:v1', JSON.stringify(config))
    }, 300)
    return () => clearTimeout(t)
  }, [config])

  return job ? (
    <ResultScreen serviceId={job.serviceId} charged={job.charged} config={config} onBack={() => setJob(null)} />
  ) : (
    <EntryScreen config={config} onConfigChange={setConfig}
      onSubmit={(serviceId, charged) => setJob({ serviceId, charged })} />
  )
}
