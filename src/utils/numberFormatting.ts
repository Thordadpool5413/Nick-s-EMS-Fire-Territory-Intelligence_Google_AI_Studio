/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PRECISION INTELLIGENCE CENTRALIZED NUMERICAL FORMATTING ENGINE
 * Standardized numerical and financial typography formatters adhering to:
 * - Instrument Sans Variable with lining-nums and tabular-nums
 * - High-precision financial conversions ($3066K -> $3.07M, $4517K/yr -> $4.52M annually)
 * - Safe percentage handling (no NaN%, undefined%, or false zeros)
 * - Restrained scores and clear equipment/clinical metrics
 * - Preservation of machine identifiers (FDID, NPI, FIPS, ZIP)
 */

export interface CurrencyFormatOptions {
  compact?: boolean;
  perYear?: boolean;
  annuallyText?: boolean;
  showSign?: boolean;
  decimals?: number;
  fallback?: string;
}

/**
 * Standardizes currency formatting with institutional precision.
 * Examples:
 *   3066000 -> "$3.07M"
 *   4517000, { perYear: true, annuallyText: true } -> "$4.52M annually"
 *   100033200000 -> "$100.03B"
 *   45000, { compact: false } -> "$45,000"
 */
export function formatCurrency(
  value: number | string | undefined | null,
  options?: CurrencyFormatOptions
): string {
  if (value === undefined || value === null || value === '') {
    return options?.fallback ?? '—';
  }

  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return options?.fallback ?? '—';

  const {
    compact = true,
    perYear = false,
    annuallyText = false,
    showSign = false,
    decimals
  } = options || {};

  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const sign = isNegative ? '-' : showSign && num > 0 ? '+' : '';

  let formattedNumber = '';

  if (compact && absVal >= 1_000_000_000) {
    const d = decimals !== undefined ? decimals : 2;
    const billions = absVal / 1_000_000_000;
    formattedNumber = billions.toFixed(d).replace(/\.00$/, '') + 'B';
  } else if (compact && absVal >= 1_000_000) {
    const d = decimals !== undefined ? decimals : 2;
    const millions = absVal / 1_000_000;
    formattedNumber = millions.toFixed(d).replace(/\.00$/, '') + 'M';
  } else if (compact && absVal >= 10_000) {
    const d = decimals !== undefined ? decimals : 0;
    const thousands = absVal / 1_000;
    formattedNumber = (d > 0 ? thousands.toFixed(d) : Math.round(thousands).toLocaleString('en-US')) + 'K';
  } else {
    formattedNumber = Math.round(absVal).toLocaleString('en-US');
  }

  const cadence = perYear ? (annuallyText ? ' annually' : ' / yr') : '';
  return `${sign}$${formattedNumber}${cadence}`;
}

/**
 * Safe percentage formatting.
 * Eliminates NaN%, undefined%, and standalone '%'
 */
export function formatPercent(
  value: number | string | undefined | null,
  decimals = 1,
  fallback = '—'
): string {
  if (value === undefined || value === null || value === '') return fallback;
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return fallback;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats standard counts and integers with comma separators.
 */
export function formatInteger(
  value: number | string | undefined | null,
  fallback = '0'
): string {
  if (value === undefined || value === null || value === '') return fallback;
  const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9-]/g, ''), 10) : value;
  if (isNaN(num)) return fallback;
  return Math.round(num).toLocaleString('en-US');
}

/**
 * Formats decimal numbers with exact decimal places.
 */
export function formatDecimal(
  value: number | string | undefined | null,
  decimals = 1,
  fallback = '0'
): string {
  if (value === undefined || value === null || value === '') return fallback;
  const num = typeof value === 'string' ? parseFloat(String(value)) : value;
  if (isNaN(num)) return fallback;
  return num.toFixed(decimals);
}

/**
 * Formats a distance in miles.
 * Examples: 24.38 -> "24.4 mi", 0.8 -> "0.8 mi"
 */
export function formatDistanceMiles(
  miles: number | undefined | null,
  decimals = 1
): string {
  if (miles === undefined || miles === null || isNaN(miles)) return '—';
  return `${miles.toFixed(decimals)} mi`;
}

/**
 * Formats modeled priority scores (0-100) with restrained institutional typography.
 * Example: 92 -> "92/100"
 */
export function formatScore(score: number | undefined | null): string {
  if (score === undefined || score === null || isNaN(score)) return '—';
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return `${clamped}/100`;
}

/**
 * Formats human-readable dates for enterprise contracts and grants.
 * Example: "2026-11-30" -> "Nov 30, 2026"
 */
export function formatDate(
  dateString: string | undefined | null,
  fallback = '—'
): string {
  if (!dateString) return fallback;
  const parsed = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  if (isNaN(parsed.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed);
}

/**
 * Equipment presentation ensuring count, manufacturer, and age are separated cleanly.
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
    ? `Reported fleet age: ${ageYears} ${ageYears === 1 ? 'year' : 'years'}`
    : 'Active frontline equipment';

  return { primary, secondary };
}

/**
 * Formats technical identifiers preserving leading zeros and raw strings.
 */
export function formatIdentifier(
  id: string | number | undefined | null,
  prefix?: string
): string {
  if (id === undefined || id === null || id === '') return '—';
  const str = String(id).trim();
  return prefix ? `${prefix} ${str}` : str;
}
