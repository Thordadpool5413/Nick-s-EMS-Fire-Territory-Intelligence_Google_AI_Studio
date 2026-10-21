/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';

export interface SparklinePoint {
  label: string;
  value: number;
}

interface InteractiveSparklineProps {
  data: number[] | SparklinePoint[];
  width?: number | string;
  height?: number;
  color?: 'rose' | 'emerald' | 'amber' | 'sky' | 'indigo';
  showArea?: boolean;
  showPoints?: boolean;
  benchmarkValue?: number;
  benchmarkLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  className?: string;
}

export const InteractiveSparkline: React.FC<InteractiveSparklineProps> = ({
  data,
  width = '100%',
  height = 36,
  color = 'sky',
  showArea = true,
  showPoints = true,
  benchmarkValue,
  benchmarkLabel = 'Benchmark',
  valuePrefix = '',
  valueSuffix = '',
  className = ''
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const rawId = useId();
  const gradientId = `spark-grad-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const normalizedPoints: SparklinePoint[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (typeof data[0] === 'number') {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - data.length + 1;
      return (data as number[]).map((val, idx) => ({
        label: `${startYear + idx}`,
        value: val
      }));
    }
    return data as SparklinePoint[];
  }, [data]);

  if (normalizedPoints.length === 0) {
    return <div className="h-9 flex items-center justify-center text-[10px] text-slate-400">No data</div>;
  }

  const values = normalizedPoints.map(p => p.value);
  const allValuesForBounds = benchmarkValue !== undefined ? [...values, benchmarkValue] : values;
  const rawMin = Math.min(...allValuesForBounds);
  const rawMax = Math.max(...allValuesForBounds);
  const padding = (rawMax - rawMin) * 0.15 || (rawMax * 0.1) || 1;
  const minY = Math.max(0, rawMin - padding);
  const maxY = rawMax + padding;
  const rangeY = maxY - minY || 1;

  const svgWidth = 160;
  const svgHeight = typeof height === 'number' ? height : 36;
  const padX = 8;
  const padY = 6;
  const usableWidth = svgWidth - padX * 2;
  const usableHeight = svgHeight - padY * 2;

  const coordinates = normalizedPoints.map((p, idx) => {
    const x = padX + (idx / Math.max(1, normalizedPoints.length - 1)) * usableWidth;
    const y = padY + usableHeight - ((p.value - minY) / rangeY) * usableHeight;
    return { x, y, ...p };
  });

  // Generate smooth path command
  let pathD = '';
  if (coordinates.length === 1) {
    pathD = `M ${coordinates[0].x} ${coordinates[0].y} L ${usableWidth + padX} ${coordinates[0].y}`;
  } else {
    pathD = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const current = coordinates[i];
      const next = coordinates[i + 1];
      const controlX = (current.x + next.x) / 2;
      pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
  }

  // Area fill path
  const lastX = coordinates[coordinates.length - 1].x;
  const firstX = coordinates[0].x;
  const bottomY = svgHeight;
  const areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  // Benchmark line Y
  const benchmarkY = benchmarkValue !== undefined
    ? padY + usableHeight - ((benchmarkValue - minY) / rangeY) * usableHeight
    : null;

  // Color tokens
  const colorStyles = {
    rose: {
      stroke: '#e11d48',
      fillStart: '#be123c',
      fillEnd: '#f43f5e',
      dot: '#9f1239',
      glow: 'rgba(225, 29, 72, 0.2)'
    },
    emerald: {
      stroke: '#059669',
      fillStart: '#047857',
      fillEnd: '#10b981',
      dot: '#065f46',
      glow: 'rgba(5, 150, 105, 0.2)'
    },
    amber: {
      stroke: '#d97706',
      fillStart: '#b45309',
      fillEnd: '#f59e0b',
      dot: '#92400e',
      glow: 'rgba(217, 119, 6, 0.2)'
    },
    sky: {
      stroke: '#0284c7',
      fillStart: '#0369a1',
      fillEnd: '#38bdf8',
      dot: '#075985',
      glow: 'rgba(2, 132, 199, 0.2)'
    },
    indigo: {
      stroke: '#6366f1',
      fillStart: '#4f46e5',
      fillEnd: '#818cf8',
      dot: '#3730a3',
      glow: 'rgba(99, 102, 241, 0.2)'
    }
  }[color];

  const hoveredPoint = hoverIndex !== null ? coordinates[hoverIndex] : null;

  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full overflow-visible"
        style={{ height }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorStyles.fillStart} stopOpacity="0.32" />
            <stop offset="70%" stopColor={colorStyles.fillEnd} stopOpacity="0.08" />
            <stop offset="100%" stopColor={colorStyles.fillEnd} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Optional Benchmark dashed line */}
        {benchmarkY !== null && (
          <line
            x1={padX}
            y1={benchmarkY}
            x2={usableWidth + padX}
            y2={benchmarkY}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
          />
        )}

        {/* Area Fill */}
        {showArea && (
          <path
            d={areaD}
            fill={`url(#${gradientId})`}
          />
        )}

        {/* Line Curve */}
        <path
          d={pathD}
          fill="none"
          stroke={colorStyles.stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start / End Highlight Dot */}
        {showPoints && (
          <>
            <circle
              cx={coordinates[coordinates.length - 1].x}
              cy={coordinates[coordinates.length - 1].y}
              r="2.5"
              fill={colorStyles.stroke}
              stroke="#ffffff"
              strokeWidth="1"
            />
          </>
        )}

        {/* Interactive Hover Hit Zones */}
        {coordinates.map((pt, idx) => (
          <g
            key={`hit-${idx}`}
            onMouseEnter={() => setHoverIndex(idx)}
            className="cursor-pointer"
          >
            <rect
              x={pt.x - usableWidth / (coordinates.length * 2)}
              y="0"
              width={usableWidth / coordinates.length}
              height={svgHeight}
              fill="transparent"
            />
            {hoverIndex === idx && (
              <>
                <line
                  x1={pt.x}
                  y1={padY}
                  x2={pt.x}
                  y2={usableHeight + padY}
                  stroke={colorStyles.stroke}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.8"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke={colorStyles.stroke}
                  strokeWidth="2"
                />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Floating Hover Tooltip HUD */}
      {hoveredPoint && (
        <div 
          className="absolute -top-7 z-30 pointer-events-none transform -translate-x-1/2 bg-slate-900 text-white font-mono text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap border border-slate-700 animate-in fade-in duration-100"
          style={{ left: `${(hoveredPoint.x / svgWidth) * 100}%` }}
        >
          <span className="text-slate-400 mr-1">{hoveredPoint.label}:</span>
          <span className="font-bold text-white">
            {valuePrefix}{typeof hoveredPoint.value === 'number' ? hoveredPoint.value.toLocaleString() : hoveredPoint.value}{valueSuffix}
          </span>
        </div>
      )}
    </div>
  );
};
