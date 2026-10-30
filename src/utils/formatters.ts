/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standardized numerical and financial typography formatters.
 * Re-exports and aliases from the centralized numberFormatting module.
 */

export * from './numberFormatting';

import {
  formatCurrency,
  formatDate,
  formatEquipmentDisplay,
  formatPercent,
  formatInteger,
  formatScore
} from './numberFormatting';

export {
  formatCurrency,
  formatDate,
  formatEquipmentDisplay,
  formatPercent,
  formatInteger,
  formatScore as formatPriorityScore
};
