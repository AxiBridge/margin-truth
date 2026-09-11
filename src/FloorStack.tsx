import { useState } from 'react'
import {
  usd, fmtMins, pack,
  type Config, type Overrides, type ExpandedRow, type SCRow, type OverheadLineConfig,
} from './core'

// ─── Chevron ──────────────────────────────────────────────────────────────────

export function Chevron({ open }: { open: boolean }) {
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

export function Expand({ open, children }: { open: boolean; children: React.ReactNode }) {
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

export function SectionLabel({ children }: { children: React.ReactNode }) {
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

// ─── Floor stack card ─────────────────────────────────────────────────────────

/**
 * The floor shown as arithmetic on the operator's own inputs, every line
 * tappable and editable. Launch requirement, spec §4.2 — a black-box number
 * they disagree with is a cancellation.
 */
export function FloorStack({ config, ov, onOvChange, computed }: {
  config: Config
  ov: Overrides
  onOvChange: (next: Overrides) => void
  computed: ReturnType<typeof import('./core').computeFloor>
}) {
  const [expanded, setExpanded] = useState<ExpandedRow>(null)
  const { labourCost, overheadCost, consumableCost, floor,
          burdened, wage, labourMins, scRows, overheadRate,
          billableHours, monthlyOverhead } = computed

  function toggle(row: ExpandedRow) {
    setExpanded(prev => (prev === row ? null : row))
  }

  return (
    <div className="bg-surface rounded-[10px] border border-rule overflow-hidden divide-y divide-rule">
      <FloorRow label="Labour" meta={fmtMins(labourMins)} amount={labourCost}
        open={expanded === 'labour'} onToggle={() => toggle('labour')}
      >
        <LabourDetail wage={wage} labourMins={labourMins} burdened={burdened}
          labourCost={labourCost} labourBurden={config.operator.labourBurden}
          onWageChange={v => onOvChange({ ...ov, wagePerHour: v })}
          onMinsChange={v => onOvChange({ ...ov, labourMinutes: v })}
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
          onQtyChange={(id, qty) => onOvChange({ ...ov, consumableQtys: { ...ov.consumableQtys, [id]: qty } })}
        />
      </FloorRow>

      <div className="px-5 py-3 flex justify-between items-center"
        style={{ borderTop: '1px solid var(--color-rule-strong)' }}>
        <span className="text-ink text-[15px] font-medium">Floor</span>
        <span className="text-ink text-[15px] font-medium">{usd(floor)}</span>
      </div>
    </div>
  )
}
