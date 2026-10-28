/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standardized numerical and financial typography formatters.
 * Adheres to Precision Intelligence requirements:
 * - Tabular lining figures for financial tables and columns
 * - Proportional numbers for running body text
 * - Clean unit separations (e.g., "$4.52M per year" instead of "+$4517K/yr")
 * - Professional device presentation (e.g., "103 Philips devices", "Reported equipment age: 11 years")
 * - Concise, restrained priority indicators
 */

/**
 * Formats a currency amount into a professional financial readout.
 * Examples:
 *   4517000, { perYear: true, compact: true } -> "$4.52M per year"
 *   45000, { compact: false } -> "$45,000"
 *   -15000, { compact: false } -> "-$15,000"
 */
export function formatCurrency(
  value: number | undefined | null,
  options?: {
    compact?: boolean;
    perYear?: boolean;
    showSign?: boolean;
    decimals?: number;
  }
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '$0';
  }

  const { compact = true, perYear = false, showSign = false, decimals } = options || {};
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const sign = isNegative ? '-' : showSign && value > 0 ? '+' : '';

  let formattedNumber = '';

  if (compact && absVal >= 1000000000) {
    const d = decimals !== undefined ? decimals : 1;
    const billions = absVal / 1000000000;
    formattedNumber = billions.toFixed(d).replace(/\.0$/, '') + 'B';
  } else if (compact && absVal >= 1000000) {
    const d = decimals !== undefined ? decimals : 2;
    const millions = absVal / 1000000;
    formattedNumber = millions.toFixed(d).replace(/\.00$/, '') + 'M';
  } else if (compact && absVal >= 1000) {
    const d = decimals !== undefined ? decimals : 0;
    const thousands = absVal / 1000;
    formattedNumber = (d > 0 ? thousands.toFixed(d) : Math.round(thousands).toLocaleString('en-US')) + 'K';
  } else {
    formattedNumber = Math.round(absVal).toLocaleString('en-US');
  }

  const result = `${sign}$${formattedNumber}${perYear ? ' / yr' : ''}`;
  return result;
}

/**
 * Formats ISO or calendar date strings into clean, human-readable dates.
 * Example: "2026-11-30" -> "Nov 30, 2026"
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  // If it's a standard YYYY-MM-DD or date string
  const parsed = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  if (isNaN(parsed.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed);
}

/**
 * Formats equipment fleet count and age into clear, human-readable primary & secondary copy.
 * Instead of: "103x Philips (11 yrs)"
 * Returns: { primary: "103 Philips devices", secondary: "Reported equipment age: 11 years" }
 */
export function formatEquipmentDisplay(
  count: number | undefined | null,
  brand: string | undefined | null,
  ageYears?: number | null
): { primary: string; secondary: string } {
  const safeCount = Math.max(1, count || 1);
  const cleanBrand = (brand || 'Defibrillator').replace(/ monitor/i, '').replace(/ fleet/i, '').trim();
  const unitNoun = safeCount === 1 ? 'device' : 'devices';

  const primary = `${safeCount} ${cleanBrand} ${unitNoun}`;
  const secondary = ageYears !== undefined && ageYears !== null
    ? `Reported equipment age: ${ageYears} ${ageYears === 1 ? 'year' : 'years'}`
    : 'Active frontline equipment';

  return { primary, secondary };
}

/**
 * Formats a percentage value with consistent decimal precision.
 * Examples: 14.2 -> "14.2%", 16 -> "16.0%"
 */
export function formatPercent(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null || isNaN(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats integers with comma separation for clean tabular presentation.
 */
export function formatInteger(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Formats a priority score concisely without shouting.
 * Example: 92 -> "Priority score: 92/100"
 */
export function formatPriorityScore(score: number | undefined | null): string {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  return `${safeScore}/100`;
}
