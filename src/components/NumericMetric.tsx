/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type MetricHierarchySize = 
  | 'hero'        // Primary executive metric (28–32px, 600–650)
  | 'large'       // Important account value (22–26px, 600)
  | 'card'        // Provider card primary value (17–20px, 600)
  | 'standard'    // Standard metric (15–17px, 550–600)
  | 'table'       // Table numerical value (14–16px, 500–600)
  | 'supporting'  // Supporting numerical value (13–14px, 500)
  | 'id';         // Technical identifier (12–14px, mono)

export interface NumericMetricProps {
  value: React.ReactNode;
  label?: React.ReactNode;
  context?: React.ReactNode;
  size?: MetricHierarchySize;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
  };
  alignment?: 'left' | 'center' | 'right';
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  contextClassName?: string;
}

const SIZE_CLASS_MAP: Record<MetricHierarchySize, string> = {
  hero: 'pi-metric-hero text-[#14283F] dark:text-[#F1F5F9]',
  large: 'pi-metric-lg text-[#14283F] dark:text-[#F1F5F9]',
  card: 'pi-metric-card text-[#14283F] dark:text-[#F1F5F9]',
  standard: 'pi-metric-standard text-[#14283F] dark:text-[#F1F5F9]',
  table: 'pi-metric-table text-[#14283F] dark:text-[#F1F5F9]',
  supporting: 'pi-metric-sm text-[#53657B] dark:text-[#94A3B8]',
  id: 'pi-metric-id text-[#53657B] dark:text-[#94A3B8]'
};

export const NumericMetric: React.FC<NumericMetricProps> = ({
  value,
  label,
  context,
  size = 'standard',
  trend,
  alignment = 'left',
  className = '',
  valueClassName = '',
  labelClassName = '',
  contextClassName = ''
}) => {
  const alignClass = alignment === 'center' ? 'items-center text-center' : alignment === 'right' ? 'items-end text-right' : 'items-start text-left';
  const sizeClass = SIZE_CLASS_MAP[size];

  return (
    <div className={`flex flex-col gap-0.5 ${alignClass} ${className}`}>
      {/* 1. Value (Primary Measurement) */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`${sizeClass} ${valueClassName}`}>
          {value}
        </span>
        {trend && (
          <span className={`pi-data-inline text-xs font-semibold ${
            trend.direction === 'up' 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : trend.direction === 'down' 
              ? 'text-rose-600 dark:text-rose-400' 
              : 'text-slate-500 dark:text-slate-400'
          }`}>
            {trend.text}
          </span>
        )}
      </div>

      {/* 2. Label (What the measurement means) */}
      {label && (
        <span className={`text-xs font-medium text-[#53657B] dark:text-[#94A3B8] leading-tight ${labelClassName}`}>
          {label}
        </span>
      )}

      {/* 3. Context (Unit, reporting period, evidence, or scenario) */}
      {context && (
        <span className={`text-[11px] text-[#6E8096] dark:text-[#64748B] leading-tight ${contextClassName}`}>
          {context}
        </span>
      )}
    </div>
  );
};
