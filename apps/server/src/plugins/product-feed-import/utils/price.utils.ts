/**
 * Convert feed RRP (major currency units, e.g. pounds) to Vendure minor units (pence).
 */
export function toMinorUnits(majorUnits: number): number {
    return Math.round(majorUnits * 100);
}
