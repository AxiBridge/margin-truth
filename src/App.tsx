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
      wagePerHour: pack.operator.wagePerHour,
      labourBurden: pack.operator.labourBurden,
      techs: pack.operator.techs,
      jobsPerWeekPerTech: pack.operator.jobsPerWeekPerTech,
      avgHoursPerJob: pack.operator.avgHoursPerJob,
      targetMargin: pack.operator.targetMargin,
    },
    overheadLines: pack.overheadLines.map(l => ({ label: l.label, monthly: l.monthly })),
    services: pack.services.map(s => ({
      id: s.id,
      name: s.name,
      measureUnit: s.measureUnit,
      labourMinutes: s.labourMinutes,
      currentPrice: s.currentPrice,
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
  const billableHours = cfg.operator.techs * cfg.operator.jobsPerWeekPerTech * cfg.operator.avgHoursPerJob * 4.33
  const overheadRate = billableHours > 0 ? monthlyOverhead / billableHours : 0
  const burdened = cfg.operator.wagePerHour * (1 + cfg.operator.labourBurden)
  const loadedRate = burdened + overheadRate
  return { monthlyOverhead, billableHours, overheadRate, burdened, loadedRate }
}

// ─── Computation ──────────────────────────────────────────────────────────────

function computeFloor(serviceId: string, config: Config, ov: Overrides) {
  const service = config.services.find(s => s.id === serviceId)!
  const { overheadRate, billableHours, monthlyOverhead } = deriveRates(config)
  const scRows = pack.serviceConsumables.filter(sc => sc.serviceId === serviceId)

  const labourMins = ov.labourMinutes ?? service.labourMinutes
  const wage = ov.wagePerHour ?? config.operator.wagePerHour
  const burdened = wage * (1 + config.operator.labourBurden)
  const hrs = labourMins / 60

  const labourCost = hrs * burdened
  const overheadCost = hrs * overheadRate

  const consumableCost = scRows.reduce((sum, sc) => {
    const c = pack.consumables.find(c => c.id === sc.consumableId)!
    const qty = ov.consumableQtys[sc.consumableId] ?? sc.qtyPerMediumUnit
    return sum + qty * c.costPerReadyToUseUnit
  }, 0)

  const floor = labourCost + overheadCost + consumableCost
  const targetPrice = floor / (1 - config.operator.targetMargin)

  return {
    labourCost, overheadCost, consumableCost, floor, targetPrice,
    burdened, wage, labourMins, scRows,
    overheadRate, billableHours, monthlyOverhead,
  }
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      className={`shrink-0 transition-transform duration-150 text-stone-400 ${open ? 'rotate-90' : ''}`}
    >
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Floor stack rows ─────────────────────────────────────────────────────────

function FloorRow({
  label, meta, amount, open, onToggle, children,
}: {
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
        className="w-full px-4 py-3 flex items-center justify-between text-left gap-2"
        style={{ minHeight: 44 }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-stone-900 text-[15px]">{label}</span>
          <span className="text-stone-400 text-[13px] truncate">{meta}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {amount !== null && (
            <span className="text-stone-900 text-[15px] tabular-nums">{usd(amount)}</span>
          )}
          <Chevron open={open} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 bg-stone-50 border-t border-stone-100">
          {children}
        </div>
      )}
    </div>
  )
}

function LabourDetail({
  wage, labourMins, burdened, labourCost, labourBurden, onWageChange, onMinsChange,
}: {
  wage: number
  labourMins: number
  burdened: number
  labourCost: number
  labourBurden: number
  onWageChange: (v: number) => void
  onMinsChange: (v: number) => void
}) {
  return (
    <div className="pt-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[11px] text-stone-500 uppercase tracking-wide mb-1">Wage $/hr</span>
          <input
            type="number" min={0} value={wage}
            onChange={e => onWageChange(Number(e.target.value))}
            className="w-full h-9 px-2 border border-stone-200 rounded text-stone-900 text-sm bg-white"
            style={{ minHeight: 44 }}
          />
        </label>
        <label className="block">
          <span className="block text-[11px] text-stone-500 uppercase tracking-wide mb-1">Minutes</span>
          <input
            type="number" min={0} value={labourMins}
            onChange={e => onMinsChange(Number(e.target.value))}
            className="w-full h-9 px-2 border border-stone-200 rounded text-stone-900 text-sm bg-white"
            style={{ minHeight: 44 }}
          />
        </label>
      </div>
      <div className="text-[13px] space-y-1.5 text-stone-500">
        {labourBurden > 0 && (
          <div className="flex justify-between">
            <span>Burden ({(labourBurden * 100).toFixed(0)}%)</span>
            <span className="tabular-nums">+{usd(wage * labourBurden)}/hr</span>
          </div>
        )}
        <div className="flex justify-between text-stone-700 font-medium">
          <span>Burdened rate</span>
          <span className="tabular-nums">{usd(burdened)}/hr</span>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-1.5 text-stone-600">
          <span>{labourMins} min ÷ 60 × {usd(burdened)}</span>
          <span className="font-medium tabular-nums">{usd(labourCost)}</span>
        </div>
      </div>
    </div>
  )
}

function OverheadDetail({
  overheadLines, overheadRate, billableHours, monthlyOverhead, labourMins,
}: {
  overheadLines: OverheadLineConfig[]
  overheadRate: number
  billableHours: number
  monthlyOverhead: number
  labourMins: number
}) {
  const cost = (labourMins / 60) * overheadRate
  return (
    <div className="pt-3 space-y-2 text-[13px]">
      <div className="space-y-1">
        {overheadLines.map(line => (
          <div key={line.label} className="flex justify-between">
            <span className="text-stone-600">{line.label}</span>
            <span className="text-stone-500 tabular-nums">{usd(line.monthly)}/mo</span>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-200 pt-2 space-y-1.5">
        <div className="flex justify-between text-stone-700 font-medium">
          <span>Total monthly</span>
          <span className="tabular-nums">{usd(monthlyOverhead)}/mo</span>
        </div>
        <div className="flex justify-between text-stone-500">
          <span>Billable hours / month</span>
          <span className="tabular-nums">{billableHours.toFixed(2)} hrs</span>
        </div>
        <div className="flex justify-between text-stone-700 font-medium border-t border-stone-200 pt-1.5">
          <span>Coverage rate</span>
          <span className="tabular-nums">{usd(overheadRate)}/hr</span>
        </div>
        <div className="flex justify-between text-stone-500 border-t border-stone-100 pt-1.5">
          <span>{labourMins} min ÷ 60 × {usd(overheadRate)}</span>
          <span className="text-stone-700 font-medium tabular-nums">{usd(cost)}</span>
        </div>
      </div>
    </div>
  )
}

function ProductDetail({
  scRows, overrides, onQtyChange,
}: {
  scRows: SCRow[]
  overrides: Record<string, number>
  onQtyChange: (id: string, qty: number) => void
}) {
  return (
    <div className="pt-3 text-[13px]">
      {scRows.map((sc, i) => {
        const c = pack.consumables.find(c => c.id === sc.consumableId)!
        const qty = overrides[sc.consumableId] ?? sc.qtyPerMediumUnit
        const lineCost = qty * c.costPerReadyToUseUnit
        return (
          <div
            key={sc.consumableId}
            className={`flex items-center gap-3 py-2 ${i < scRows.length - 1 ? 'border-b border-stone-100' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-stone-700 truncate">{c.product}</div>
              <div className="text-stone-400 text-[12px] tabular-nums">{usd(c.costPerReadyToUseUnit)} ea</div>
            </div>
            <input
              type="number" min={0} step={0.5} value={qty}
              onChange={e => onQtyChange(sc.consumableId, Number(e.target.value))}
              className="w-14 h-8 px-1 border border-stone-200 rounded text-stone-900 text-sm bg-white text-center"
            />
            <div className="w-16 text-right tabular-nums text-stone-700 shrink-0">{usd(lineCost)}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Config panel ─────────────────────────────────────────────────────────────

function ConfigPanel({ config, onChange }: { config: Config; onChange: (cfg: Config) => void }) {
  const [panelOpen, setPanelOpen] = useState(false)
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
    <div className="rounded-md border border-stone-200 bg-white overflow-hidden">
      <button
        onClick={() => { setPanelOpen(p => !p); setResetConfirm(false) }}
        className="w-full px-4 py-3 flex items-center justify-between text-left gap-2"
        style={{ minHeight: 44 }}
      >
        <span className="text-stone-600 text-[14px]">
          Your numbers —{' '}
          <span className="text-stone-900 font-medium tabular-nums">{usd(loadedRate)}/hour loaded</span>
        </span>
        <Chevron open={panelOpen} />
      </button>

      {panelOpen && (
        <div className="border-t border-stone-100 divide-y divide-stone-100">

          {/* 1. Pay */}
          <section className="px-4 py-4 space-y-3">
            <div className="text-[11px] text-stone-400 uppercase tracking-wide">Pay</div>
            <label className="block">
              <span className="block text-[13px] text-stone-600 mb-1.5">What you pay yourself, $/hr</span>
              <input
                type="number" min={0} value={config.operator.wagePerHour}
                onChange={e => setOp({ wagePerHour: Number(e.target.value) })}
                className="w-full h-11 px-3 border border-stone-200 rounded-md text-stone-900 text-[15px] bg-white"
              />
            </label>
          </section>

          {/* 2. Overhead */}
          <section className="px-4 py-4 space-y-3">
            <div className="text-[11px] text-stone-400 uppercase tracking-wide">Overhead</div>
            <button
              onClick={() => setOverheadOpen(p => !p)}
              className="w-full flex items-center justify-between text-left gap-2"
              style={{ minHeight: 44 }}
            >
              <span className="text-[14px] text-stone-700">
                Monthly overhead —{' '}
                <span className="font-medium tabular-nums">{usd(monthlyOverhead)}</span>
              </span>
              <Chevron open={overheadOpen} />
            </button>
            {overheadOpen && (
              <div className="space-y-2">
                {config.overheadLines.map((line, i) => (
                  <div key={line.label} className="flex items-center gap-2">
                    <span className="flex-1 text-[13px] text-stone-600 min-w-0 leading-tight">{line.label}</span>
                    <div className="relative shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-[13px] pointer-events-none">$</span>
                      <input
                        type="number" min={0} value={line.monthly}
                        onChange={e => setOverheadLine(i, Number(e.target.value))}
                        className="w-24 h-9 pl-5 pr-2 border border-stone-200 rounded text-stone-900 text-sm bg-white text-right"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-stone-100 text-[13px] font-medium text-stone-700">
                  <span>Total</span>
                  <span className="tabular-nums">{usd(monthlyOverhead)}/mo</span>
                </div>
              </div>
            )}
          </section>

          {/* 3. Capacity */}
          <section className="px-4 py-4 space-y-3">
            <div className="text-[11px] text-stone-400 uppercase tracking-wide">Capacity</div>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="block text-[12px] text-stone-500 mb-1">Jobs / week</span>
                <input
                  type="number" min={1} value={config.operator.jobsPerWeekPerTech}
                  onChange={e => setOp({ jobsPerWeekPerTech: Number(e.target.value) })}
                  className="w-full h-11 px-2 border border-stone-200 rounded-md text-stone-900 text-[14px] bg-white text-center"
                />
              </label>
              <label className="block">
                <span className="block text-[12px] text-stone-500 mb-1">Hrs / job</span>
                <input
                  type="number" min={0} step={0.5} value={config.operator.avgHoursPerJob}
                  onChange={e => setOp({ avgHoursPerJob: Number(e.target.value) })}
                  className="w-full h-11 px-2 border border-stone-200 rounded-md text-stone-900 text-[14px] bg-white text-center"
                />
              </label>
              <label className="block">
                <span className="block text-[12px] text-stone-500 mb-1">Techs</span>
                <input
                  type="number" min={1} value={config.operator.techs}
                  onChange={e => setOp({ techs: Number(e.target.value) })}
                  className="w-full h-11 px-2 border border-stone-200 rounded-md text-stone-900 text-[14px] bg-white text-center"
                />
              </label>
            </div>
            {billableHours === 0 ? (
              <p className="text-[12px] text-amber-700">
                Enter jobs per week and hours per job to allocate overhead.
              </p>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[13px] text-stone-700">
                  <span className="font-medium">{billableHours.toFixed(1)} billable hours / month</span>
                  <span className="font-medium tabular-nums">{usd(overheadRate)}/hr overhead</span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {config.operator.techs} tech × {config.operator.jobsPerWeekPerTech} jobs × {config.operator.avgHoursPerJob} hrs × 4.33 = {billableHours.toFixed(1)} hrs
                  &nbsp;·&nbsp;
                  {usd(monthlyOverhead)} ÷ {billableHours.toFixed(1)} = {usd(overheadRate)}/hr
                </p>
              </div>
            )}
          </section>

          {/* 4. Services */}
          <section className="px-4 py-4 space-y-2">
            <div className="text-[11px] text-stone-400 uppercase tracking-wide mb-1">Services</div>
            <div
              className="grid text-[11px] text-stone-400 uppercase tracking-wide mb-1"
              style={{ gridTemplateColumns: '1fr 52px 76px' }}
            >
              <span>Service</span>
              <span className="text-center">Min</span>
              <span className="text-right pr-1">You charge</span>
            </div>
            <div className="space-y-1.5">
              {config.services.map((svc, i) => (
                <div key={svc.id} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: '1fr 52px 76px' }}>
                  <input
                    type="text" value={svc.name}
                    onChange={e => setSvc(i, { name: e.target.value })}
                    className="h-9 px-2 border border-stone-200 rounded text-stone-900 text-[13px] bg-white w-full min-w-0"
                  />
                  <input
                    type="number" min={0} value={svc.labourMinutes}
                    onChange={e => setSvc(i, { labourMinutes: Number(e.target.value) })}
                    className="h-9 px-1 border border-stone-200 rounded text-stone-900 text-[13px] bg-white text-center w-full"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-[12px] pointer-events-none">$</span>
                    <input
                      type="number" min={0} value={svc.currentPrice}
                      onChange={e => setSvc(i, { currentPrice: Number(e.target.value) })}
                      className="h-9 pl-4 pr-1 border border-stone-200 rounded text-stone-900 text-[13px] bg-white text-right w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reset */}
          <div className="px-4 py-4">
            {resetConfirm ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[13px] text-stone-600 flex-1 min-w-0">Restore all numbers to defaults?</span>
                <button
                  onClick={handleReset}
                  className="h-9 px-3 bg-red-600 text-white text-[13px] font-medium rounded shrink-0"
                  style={{ minHeight: 44 }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="h-9 px-3 border border-stone-200 text-stone-600 text-[13px] rounded shrink-0"
                  style={{ minHeight: 44 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setResetConfirm(true)}
                className="text-[13px] text-stone-400 underline underline-offset-2"
              >
                Reset to defaults
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Entry screen ─────────────────────────────────────────────────────────────

function EntryScreen({
  config, onConfigChange, onSubmit,
}: {
  config: Config
  onConfigChange: (cfg: Config) => void
  onSubmit: (serviceId: string, charged: number) => void
}) {
  const [serviceId, setServiceId] = useState(config.services[0].id)
  const [charged, setCharged] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    const n = parseFloat(charged)
    if (isNaN(n) || n < 0) { setError('Enter the amount you charged.'); return }
    onSubmit(serviceId, n)
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center px-5 pt-8 pb-12">
      <div className="w-full max-w-[440px] space-y-6">

        <ConfigPanel config={config} onChange={onConfigChange} />

        <p className="text-stone-500 text-[17px] leading-relaxed">
          Think of a job from last week you felt good about.
        </p>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-stone-600">Service</label>
            <div className="relative">
              <select
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                className="w-full h-11 pl-3 pr-9 bg-white border border-stone-200 rounded-md text-stone-900 text-[15px] appearance-none"
              >
                {config.services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-stone-600">What you charged</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[15px] pointer-events-none select-none">$</span>
              <input
                type="number" inputMode="decimal" min={0} step={0.01}
                value={charged}
                onChange={e => { setCharged(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="0"
                className="w-full h-11 pl-7 pr-3 bg-white border border-stone-200 rounded-md text-stone-900 text-[15px] placeholder:text-stone-300"
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          style={{ minHeight: 48 }}
          className="w-full bg-stone-900 text-white font-medium rounded-md text-[15px] active:bg-stone-700 transition-colors"
        >
          See the floor
        </button>
      </div>
    </div>
  )
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({
  serviceId, charged, config, onBack,
}: {
  serviceId: string
  charged: number
  config: Config
  onBack: () => void
}) {
  const [expanded, setExpanded] = useState<ExpandedRow>(null)
  const [ov, setOv] = useState<Overrides>({ labourMinutes: null, wagePerHour: null, consumableQtys: {} })

  const {
    labourCost, overheadCost, consumableCost, floor, targetPrice,
    burdened, wage, labourMins, scRows, overheadRate, billableHours, monthlyOverhead,
  } = computeFloor(serviceId, config, ov)

  const service = config.services.find(s => s.id === serviceId)!
  const gap = charged - floor
  const isLoss = gap < 0

  function toggle(row: ExpandedRow) {
    setExpanded(prev => prev === row ? null : row)
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center px-5 pt-8 pb-12">
      <div className="w-full max-w-[440px] space-y-5">

        <div>
          <div className="text-[19px] font-semibold text-stone-900 leading-snug">{service.name}</div>
          <div className="text-stone-500 text-[14px] mt-0.5">{fmtMins(labourMins)}</div>
        </div>

        <div className={`rounded-lg border px-4 py-4 ${isLoss ? 'bg-red-50 border-red-100' : 'bg-stone-100 border-stone-200'}`}>
          {isLoss ? (
            <>
              <div className="text-stone-500 text-[14px] mb-1">
                You charged {usd(charged)}. Your floor was {usd(floor)}.
              </div>
              <div className="text-[28px] font-semibold leading-tight text-red-700">
                That job cost you {usd(Math.abs(gap))}.
              </div>
            </>
          ) : (
            <>
              <div className="text-[28px] font-semibold leading-tight text-stone-900">
                You cleared your floor by {usd(gap)}.
              </div>
              <div className="text-stone-500 text-[14px] mt-1">
                Your target margin would put it at {usd(targetPrice)}.
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <div className="divide-y divide-stone-100">
            <FloorRow
              label="Labour" meta={fmtMins(labourMins)} amount={labourCost}
              open={expanded === 'labour'} onToggle={() => toggle('labour')}
            >
              <LabourDetail
                wage={wage} labourMins={labourMins} burdened={burdened} labourCost={labourCost}
                labourBurden={config.operator.labourBurden}
                onWageChange={v => setOv(p => ({ ...p, wagePerHour: v }))}
                onMinsChange={v => setOv(p => ({ ...p, labourMinutes: v }))}
              />
            </FloorRow>

            <FloorRow
              label="Overhead" meta={fmtMins(labourMins)} amount={overheadCost}
              open={expanded === 'overhead'} onToggle={() => toggle('overhead')}
            >
              <OverheadDetail
                overheadLines={config.overheadLines}
                overheadRate={overheadRate}
                billableHours={billableHours}
                monthlyOverhead={monthlyOverhead}
                labourMins={labourMins}
              />
            </FloorRow>

            <FloorRow
              label="Product" meta={`${scRows.length} items`} amount={consumableCost}
              open={expanded === 'product'} onToggle={() => toggle('product')}
            >
              <ProductDetail
                scRows={scRows} overrides={ov.consumableQtys}
                onQtyChange={(id, qty) => setOv(p => ({ ...p, consumableQtys: { ...p.consumableQtys, [id]: qty } }))}
              />
            </FloorRow>
          </div>

          <div className="border-t-2 border-stone-200 px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-stone-900 text-[15px]">Floor</span>
            <span className="font-semibold text-stone-900 text-[15px] tabular-nums">{usd(floor)}</span>
          </div>
        </div>

        <p className="text-stone-400 text-[13px] text-center leading-relaxed">
          Every number here is yours except coverage rates. Tap any line to change it.
        </p>

        <button
          onClick={onBack}
          style={{ minHeight: 48 }}
          className="w-full border border-stone-200 bg-white text-stone-700 font-medium rounded-md text-[15px] active:bg-stone-50 transition-colors"
        >
          Price another one
        </button>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [config, setConfig] = useState<Config>(loadConfig)
  const [job, setJob] = useState<{ serviceId: string; charged: number } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem('margin-truth:config:v1', JSON.stringify(config))
    }, 300)
    return () => clearTimeout(t)
  }, [config])

  return job ? (
    <ResultScreen
      serviceId={job.serviceId}
      charged={job.charged}
      config={config}
      onBack={() => setJob(null)}
    />
  ) : (
    <EntryScreen
      config={config}
      onConfigChange={setConfig}
      onSubmit={(serviceId, charged) => setJob({ serviceId, charged })}
    />
  )
}
