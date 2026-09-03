import { useState } from 'react'
import pack from './data/pack-detailing.json'

type VehicleSize = string
type ExpandedRow = 'labour' | 'overhead' | 'product' | 'size' | null

interface Overrides {
  labourMinutes: number | null
  wagePerHour: number | null
  consumableQtys: Record<string, number>
}

type SCRow = typeof pack.serviceConsumables[number]

function usd(n: number): string {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtMins(m: number): string {
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}

function computeFloor(serviceId: string, size: VehicleSize, ov: Overrides) {
  const service = pack.services.find(s => s.id === serviceId)!
  const sizeRow = pack.sizeMultipliers.find(s => s.size === size)!
  const scRows = pack.serviceConsumables.filter(sc => sc.serviceId === serviceId)

  const labourMins = ov.labourMinutes ?? service.labourMinutes
  const wage = ov.wagePerHour ?? pack.operator.wagePerHour
  const burdened = wage * (1 + pack.operator.labourBurden)
  const hrs = labourMins / 60

  const labourCost = hrs * burdened
  const overheadCost = hrs * pack.operator.overheadRatePerHour

  const consumableCost = scRows.reduce((sum, sc) => {
    const c = pack.consumables.find(c => c.id === sc.consumableId)!
    const qty = ov.consumableQtys[sc.consumableId] ?? sc.qtyPerMediumUnit
    return sum + qty * c.costPerReadyToUseUnit
  }, 0)

  const multiplier = sizeRow.multiplier
  const floor = (labourCost + overheadCost + consumableCost) * multiplier
  const targetPrice = floor / (1 - pack.operator.targetMargin)

  return { labourCost, overheadCost, consumableCost, multiplier, floor, targetPrice, burdened, wage, labourMins, scRows }
}

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
  wage, labourMins, burdened, labourCost, onWageChange, onMinsChange,
}: {
  wage: number
  labourMins: number
  burdened: number
  labourCost: number
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
        <div className="flex justify-between">
          <span>Burden ({(pack.operator.labourBurden * 100).toFixed(0)}%)</span>
          <span className="tabular-nums">+{usd(wage * pack.operator.labourBurden)}/hr</span>
        </div>
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

function OverheadDetail({ labourMins }: { labourMins: number }) {
  const totalMonthly = pack.overheadLines.reduce((s, l) => s + l.monthly, 0)
  const rate = pack.operator.overheadRatePerHour
  const cost = (labourMins / 60) * rate

  return (
    <div className="pt-3 space-y-2 text-[13px]">
      <div className="space-y-1">
        {pack.overheadLines.map(line => (
          <div key={line.label} className="flex justify-between">
            <span className="text-stone-600">{line.label}</span>
            <span className="text-stone-500 tabular-nums">{usd(line.monthly)}/mo</span>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-200 pt-2 space-y-1.5">
        <div className="flex justify-between text-stone-700 font-medium">
          <span>Total monthly</span>
          <span className="tabular-nums">{usd(totalMonthly)}/mo</span>
        </div>
        <div className="flex justify-between text-stone-500">
          <span>Billable hours / month</span>
          <span className="tabular-nums">{pack.operator.billableHoursPerMonth.toFixed(2)} hrs</span>
        </div>
        <div className="flex justify-between text-stone-700 font-medium border-t border-stone-200 pt-1.5">
          <span>Coverage rate</span>
          <span className="tabular-nums">{usd(rate)}/hr</span>
        </div>
        <div className="flex justify-between text-stone-500 border-t border-stone-100 pt-1.5">
          <span>{labourMins} min ÷ 60 × {usd(rate)}</span>
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

function SizeDetail({ currentSize }: { currentSize: VehicleSize }) {
  return (
    <div className="pt-3 space-y-0.5 text-[13px]">
      {pack.sizeMultipliers.map(row => (
        <div
          key={row.size}
          className={`flex items-start gap-3 px-2 py-2 rounded ${row.size === currentSize ? 'bg-stone-200' : ''}`}
        >
          <div className="w-28 shrink-0 flex gap-2 items-baseline">
            <span className={`font-medium ${row.size === currentSize ? 'text-stone-900' : 'text-stone-600'}`}>
              {row.size}
            </span>
            <span className="text-stone-500 tabular-nums">×{row.multiplier.toFixed(2)}</span>
          </div>
          <span className="text-stone-400 text-[12px] leading-relaxed">{row.example}</span>
        </div>
      ))}
    </div>
  )
}

function EntryScreen({ onSubmit }: {
  onSubmit: (serviceId: string, size: VehicleSize, charged: number) => void
}) {
  const SIZES = pack.sizeMultipliers.map(s => s.size)
  const defaultSize = SIZES.includes('Medium') ? 'Medium' : SIZES[0]

  const [serviceId, setServiceId] = useState(pack.services[0].id)
  const [size, setSize] = useState<VehicleSize>(defaultSize)
  const [charged, setCharged] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    const n = parseFloat(charged)
    if (isNaN(n) || n < 0) {
      setError('Enter the amount you charged.')
      return
    }
    onSubmit(serviceId, size, n)
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center px-5 pt-14 pb-12">
      <div className="w-full max-w-[440px] space-y-8">
        <p className="text-stone-500 text-[17px] leading-relaxed">
          Think of a job from last week you felt good about.
        </p>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-stone-600">Service</label>
            <div className="relative">
              <select
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                className="w-full h-11 pl-3 pr-9 bg-white border border-stone-200 rounded-md text-stone-900 text-[15px] appearance-none"
              >
                {pack.services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                width="12" height="12" viewBox="0 0 12 12" fill="none"
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {SIZES.length > 1 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-stone-600">Vehicle size</label>
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${Math.min(SIZES.length, 4)}, 1fr)` }}
              >
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    style={{ minHeight: 44 }}
                    className={`text-[14px] font-medium rounded-md border transition-colors ${
                      size === s
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-600 border-stone-200'
                    }`}
                  >
                    {s === 'Extra large' ? 'XL' : s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-stone-600">What you charged</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[15px] pointer-events-none select-none">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
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

function ResultScreen({ serviceId, size, charged, onBack }: {
  serviceId: string
  size: VehicleSize
  charged: number
  onBack: () => void
}) {
  const [expanded, setExpanded] = useState<ExpandedRow>(null)
  const [ov, setOv] = useState<Overrides>({ labourMinutes: null, wagePerHour: null, consumableQtys: {} })

  const { labourCost, overheadCost, consumableCost, multiplier, floor, targetPrice, burdened, wage, labourMins, scRows } =
    computeFloor(serviceId, size, ov)

  const service = pack.services.find(s => s.id === serviceId)!
  const gap = charged - floor
  const isLoss = gap < 0

  function toggle(row: ExpandedRow) {
    setExpanded(prev => (prev === row ? null : row))
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center px-5 pt-8 pb-12">
      <div className="w-full max-w-[440px] space-y-5">

        {/* Subhead */}
        <div>
          <div className="text-[19px] font-semibold text-stone-900 leading-snug">{service.name}</div>
          <div className="text-stone-500 text-[14px] mt-0.5">{size} · {fmtMins(labourMins)}</div>
        </div>

        {/* Verdict block */}
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

        {/* Floor stack */}
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <div className="divide-y divide-stone-100">
            <FloorRow
              label="Labour" meta={fmtMins(labourMins)} amount={labourCost}
              open={expanded === 'labour'} onToggle={() => toggle('labour')}
            >
              <LabourDetail
                wage={wage} labourMins={labourMins} burdened={burdened} labourCost={labourCost}
                onWageChange={v => setOv(p => ({ ...p, wagePerHour: v }))}
                onMinsChange={v => setOv(p => ({ ...p, labourMinutes: v }))}
              />
            </FloorRow>

            <FloorRow
              label="Overhead" meta={fmtMins(labourMins)} amount={overheadCost}
              open={expanded === 'overhead'} onToggle={() => toggle('overhead')}
            >
              <OverheadDetail labourMins={labourMins} />
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

            <FloorRow
              label="Size" meta={`×${multiplier.toFixed(2)}`} amount={null}
              open={expanded === 'size'} onToggle={() => toggle('size')}
            >
              <SizeDetail currentSize={size} />
            </FloorRow>
          </div>

          {/* Total */}
          <div className="border-t-2 border-stone-200 px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-stone-900 text-[15px]">Floor</span>
            <span className="font-semibold text-stone-900 text-[15px] tabular-nums">{usd(floor)}</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-stone-400 text-[13px] text-center leading-relaxed">
          Every number here is yours except coverage rates. Tap any line to change it.
        </p>

        {/* Back */}
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

export default function App() {
  const [job, setJob] = useState<{ serviceId: string; size: VehicleSize; charged: number } | null>(null)

  return job ? (
    <ResultScreen {...job} onBack={() => setJob(null)} />
  ) : (
    <EntryScreen onSubmit={(serviceId, size, charged) => setJob({ serviceId, size, charged })} />
  )
}
