import type { Measurements, PhysicalProgress } from '$lib/types'

export const MEASUREMENT_KEYS = [
  'weight',
  'height',
  'chest',
  'underbust',
  'waist',
  'hips',
  'shoulders',
] as const satisfies readonly (keyof Measurements)[]

export const MEASUREMENT_UNITS: Record<keyof Measurements, string> = {
  weight: 'kg',
  height: 'cm',
  chest: 'cm',
  underbust: 'cm',
  waist: 'cm',
  hips: 'cm',
  shoulders: 'cm',
}

export const MEASUREMENT_LABEL_KEY: Record<keyof Measurements, string> = {
  weight: 'progress.measurements.weight',
  height: 'progress.measurements.height',
  chest: 'progress.measurements.chest',
  underbust: 'progress.measurements.underChest',
  waist: 'progress.waistLabel',
  hips: 'progress.measurements.hips',
  shoulders: 'progress.measurements.shoulders',
}

export const MEASUREMENT_FIELD_KEY: Record<keyof Measurements, string> = {
  weight: 'progress.new.weightField',
  height: 'progress.new.heightField',
  chest: 'progress.new.chestField',
  underbust: 'progress.new.underChestField',
  waist: 'progress.new.waistField',
  hips: 'progress.new.hipsField',
  shoulders: 'progress.new.shouldersField',
}

export const BODY_MEASUREMENT_KEYS = ['chest', 'underbust', 'waist', 'hips'] as const

/** Colors for the measurements actually charted (weight + body measurements). */
export const MEASUREMENT_CHART_COLOR: Partial<Record<keyof Measurements, string>> = {
  chest: 'var(--pink-deep)',
  underbust: 'var(--pink)',
  waist: 'var(--blue)',
  hips: 'var(--blue-deep)',
  weight: 'var(--gold)',
}

/** Ordered ascending by date (input entries are typically date-desc from getPhysicalProgress). */
export function chronological(entries: PhysicalProgress[]): PhysicalProgress[] {
  return [...entries].reverse()
}

/** Measurement keys with at least one recorded value, in fixed display order. */
export function availableMeasurements(entries: PhysicalProgress[]): (keyof Measurements)[] {
  return MEASUREMENT_KEYS.filter((key) => entries.some((e) => e.measurements?.[key] !== undefined))
}

export function measurementDiff(first: number | undefined, last: number | undefined) {
  if (first === undefined || last === undefined) return undefined
  return last - first
}

/** Index of the entry whose date is closest to target. */
export function closestEntryIndex(entries: { date: Date }[], target: Date): number {
  return entries.reduce(
    (closest, entry, index) =>
      Math.abs(entry.date.getTime() - target.getTime()) <
      Math.abs(entries[closest]!.date.getTime() - target.getTime())
        ? index
        : closest,
    0
  )
}
