import pack from './data/pack-detailing.json'

export { pack }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OperatorConfig {
  wagePerHour: number
  labourBurden: number
  techs: number
  jobsPerWeekPerTech: number
  avgHoursPerJob: number
  targetMargin: number
}

export interface OverheadLineConfig {
  label: string
  monthly: number
}

export interface ServiceConfig {
  id: string
  name: string
  measureUnit: string
  labourMinutes: number
  currentPrice: number
}

export interface Config {
  operator: OperatorConfig
  overheadLines: OverheadLineConfig[]
  services: ServiceConfig[]
}

export type ExpandedRow = 'labour' | 'overhead' | 'product' | null

export interface Overrides {
  labourMinutes: number | null
  wagePerHour: number | null
  consumableQtys: Record<string, number>
}

export type SCRow = typeof pack.serviceConsumables[number]

export const REASON_CODES = [
  'Matched a competitor',
  'Repeat customer',
  'Filling a slow day',
  'Foot in the door on a commercial account',
  'Other',
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function usd(n: number): string {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function usd0(n: number): string {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function fmtMins(m: number): string {
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h === 0) return `${rem}m`
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}

export function defaultConfig(): Config {
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

export function loadConfig(): Config {
  try {
    const raw = localStorage.getItem('margin-truth:config:v1')
    if (raw) return JSON.parse(raw) as Config
  } catch { /* fall through */ }
  return defaultConfig()
}

export function deriveRates(cfg: Config) {
  const monthlyOverhead = cfg.overheadLines.reduce((s, l) => s + l.monthly, 0)
  const billableHours   = cfg.operator.techs * cfg.operator.jobsPerWeekPerTech * cfg.operator.avgHoursPerJob * 4.33
  const overheadRate    = billableHours > 0 ? monthlyOverhead / billableHours : 0
  const burdened        = cfg.operator.wagePerHour * (1 + cfg.operator.labourBurden)
  return { monthlyOverhead, billableHours, overheadRate, burdened, loadedRate: burdened + overheadRate }
}

// ─── Computation ──────────────────────────────────────────────────────────────

export function computeFloor(serviceId: string, config: Config, ov: Overrides) {
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
