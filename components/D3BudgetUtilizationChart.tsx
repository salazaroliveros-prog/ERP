'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Project, CompanySettings } from '@/lib/types';
import { formatGTQ, formatUSD } from '@/lib/data';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart2,
  Info,
} from 'lucide-react';

export interface D3BudgetUtilizationChartProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  currency: 'GTQ' | 'USD';
  company: CompanySettings;
  className?: string;
}

export const D3BudgetUtilizationChart: React.FC<D3BudgetUtilizationChartProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  currency,
  company,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 320,
  });
  const [viewType, setViewType] = useState<'bars' | 'gauge'>('bars');
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    code: string;
    budget: number;
    spent: number;
    pct: number;
    variance: number;
    status: string;
  } | null>(null);

  const formatMoney = (val: number) => {
    return currency === 'GTQ' ? formatGTQ(val) : formatUSD(val, company.exchangeRate);
  };

  const totalBudget = projects.reduce((sum, p) => sum + p.budgetTotal, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spentTotal, 0);
  const globalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingBudget = Math.max(0, totalBudget - totalSpent);

  // ResizeObserver for responsive SVG dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0) {
        setDimensions({
          width: Math.max(300, rect.width),
          height: viewType === 'bars' ? Math.max(340, Math.min(420, projects.length * 52 + 70)) : 340,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [projects.length, viewType]);

  // Main D3 Rendering Logic
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear previous render

    const { width, height } = dimensions;

    if (viewType === 'bars') {
      // -------------------------------------------------------------
      // VIEW A: D3 Real-Time Grouped & Bullet Budget vs Spend Chart
      // -------------------------------------------------------------
      const margin = { top: 25, right: 40, bottom: 45, left: 110 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Color Defs & Gradients
      const defs = svg.append('defs');

      // Gradient for budget base
      const budgetGrad = defs
        .append('linearGradient')
        .attr('id', 'd3-budget-grad')
        .attr('x1', '0%')
        .attr('x2', '100%');
      budgetGrad.append('stop').attr('offset', '0%').attr('stop-color', '#334155');
      budgetGrad.append('stop').attr('offset', '100%').attr('stop-color', '#475569');

      // Gradient for actual spend (normal/cyan)
      const spendGradNormal = defs
        .append('linearGradient')
        .attr('id', 'd3-spend-normal')
        .attr('x1', '0%')
        .attr('x2', '100%');
      spendGradNormal.append('stop').attr('offset', '0%').attr('stop-color', '#0284c7');
      spendGradNormal.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8');

      // Gradient for active project spend
      const spendGradActive = defs
        .append('linearGradient')
        .attr('id', 'd3-spend-active')
        .attr('x1', '0%')
        .attr('x2', '100%');
      spendGradActive.append('stop').attr('offset', '0%').attr('stop-color', '#0ea5e9');
      spendGradActive.append('stop').attr('offset', '100%').attr('stop-color', '#67e8f9');

      // Gradient for over-budget projects
      const spendGradOver = defs
        .append('linearGradient')
        .attr('id', 'd3-spend-over')
        .attr('x1', '0%')
        .attr('x2', '100%');
      spendGradOver.append('stop').attr('offset', '0%').attr('stop-color', '#e11d48');
      spendGradOver.append('stop').attr('offset', '100%').attr('stop-color', '#fb7185');

      // Scales
      const maxVal = d3.max(projects, (p) => Math.max(p.budgetTotal, p.spentTotal)) || 1000000;
      const xScale = d3.scaleLinear().domain([0, maxVal * 1.08]).range([0, innerWidth]);

      const yScale = d3
        .scaleBand()
        .domain(projects.map((p) => p.code))
        .range([0, innerHeight])
        .padding(0.28);

      // Background gridlines
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(width < 450 ? 3 : 5)
            .tickSize(-innerHeight)
            .tickFormat(() => '')
        )
        .selectAll('.tick line')
        .attr('stroke', 'rgba(255, 255, 255, 0.07)')
        .attr('stroke-dasharray', '3,3');

      g.select('.grid .domain').remove();

      // Bottom X Axis
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(width < 450 ? 3 : 5)
        .tickFormat((d) => {
          const val = Number(d);
          return currency === 'GTQ'
            ? `Q${(val / 1000000).toFixed(1)}M`
            : `$${(val / company.exchangeRate / 1000000).toFixed(1)}M`;
        });

      const xAxisGroup = g
        .append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);

      xAxisGroup.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.15)');
      xAxisGroup.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px');

      // Left Y Axis (Project Codes)
      const yAxis = d3.axisLeft(yScale).tickSize(0);
      const yAxisGroup = g.append('g').call(yAxis);
      yAxisGroup.select('.domain').remove();
      yAxisGroup
        .selectAll('text')
        .attr('fill', (d) => {
          const proj = projects.find((p) => p.code === d);
          return proj?.id === activeProjectId ? '#38bdf8' : '#cbd5e1';
        })
        .attr('font-weight', (d) => {
          const proj = projects.find((p) => p.code === d);
          return proj?.id === activeProjectId ? 'bold' : '600';
        })
        .attr('font-size', '11px')
        .attr('dx', '-8px')
        .style('cursor', 'pointer')
        .on('click', (_, d) => {
          const proj = projects.find((p) => p.code === d);
          if (proj) onSelectProject(proj.id);
        });

      // Render Each Project Row
      projects.forEach((proj) => {
        const y = yScale(proj.code);
        if (y === undefined) return;
        const rowHeight = yScale.bandwidth();
        const isSelected = proj.id === activeProjectId;
        const isOverBudget = proj.spentTotal > proj.budgetTotal;
        const budgetWidth = xScale(proj.budgetTotal);
        const spentWidth = xScale(proj.spentTotal);
        const utilPct = proj.budgetTotal > 0 ? (proj.spentTotal / proj.budgetTotal) * 100 : 0;

        const rowG = g
          .append('g')
          .attr('class', 'project-row')
          .attr('cursor', 'pointer')
          .on('click', () => {
            onSelectProject(proj.id);
          })
          .on('mouseenter', (event) => {
            const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
            setTooltipData({
              visible: true,
              x: mouseX,
              y: mouseY,
              title: proj.name,
              code: proj.code,
              budget: proj.budgetTotal,
              spent: proj.spentTotal,
              pct: Math.round(utilPct * 10) / 10,
              variance: proj.budgetTotal - proj.spentTotal,
              status: proj.status,
            });
          })
          .on('mousemove', (event) => {
            const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
            setTooltipData((prev) => (prev ? { ...prev, x: mouseX, y: mouseY } : null));
          })
          .on('mouseleave', () => {
            setTooltipData(null);
          });

        // Background highlight if selected
        if (isSelected) {
          rowG
            .append('rect')
            .attr('x', -margin.left + 10)
            .attr('y', y - 4)
            .attr('width', innerWidth + margin.left)
            .attr('height', rowHeight + 8)
            .attr('rx', 8)
            .attr('fill', 'rgba(56, 189, 248, 0.08)')
            .attr('stroke', 'rgba(56, 189, 248, 0.25)')
            .attr('stroke-width', 1);
        }

        // 1. Budget Bar (Outer Track)
        rowG
          .append('rect')
          .attr('x', 0)
          .attr('y', y)
          .attr('width', budgetWidth)
          .attr('height', rowHeight)
          .attr('rx', 5)
          .attr('fill', 'url(#d3-budget-grad)')
          .attr('opacity', 0.85);

        // 2. Spent Bar (Inner Active Track)
        const fillGrad = isOverBudget
          ? 'url(#d3-spend-over)'
          : isSelected
          ? 'url(#d3-spend-active)'
          : 'url(#d3-spend-normal)';

        rowG
          .append('rect')
          .attr('x', 0)
          .attr('y', y + rowHeight * 0.15)
          .attr('width', 0) // Start at 0 for transition
          .attr('height', rowHeight * 0.7)
          .attr('rx', 4)
          .attr('fill', fillGrad)
          .transition()
          .duration(700)
          .ease(d3.easeCubicOut)
          .attr('width', spentWidth);

        // 3. 100% Target Tick Marker
        rowG
          .append('line')
          .attr('x1', budgetWidth)
          .attr('x2', budgetWidth)
          .attr('y1', y - 2)
          .attr('y2', y + rowHeight + 2)
          .attr('stroke', isOverBudget ? '#f43f5e' : '#38bdf8')
          .attr('stroke-width', 2.5)
          .attr('stroke-dasharray', isOverBudget ? '0' : '2,2');

        // 4. Percentage label to the right of the bar
        const labelX = Math.max(budgetWidth, spentWidth) + 8;
        rowG
          .append('text')
          .attr('x', labelX)
          .attr('y', y + rowHeight / 2 + 4)
          .attr('fill', isOverBudget ? '#fb7185' : isSelected ? '#38bdf8' : '#e2e8f0')
          .attr('font-size', '10.5px')
          .attr('font-weight', '700')
          .attr('font-family', 'monospace')
          .text(`${utilPct.toFixed(0)}%`);
      });
    } else {
      // -------------------------------------------------------------
      // VIEW B: D3 Radial Arc Gauge & Real-Time Financial Donut
      // -------------------------------------------------------------
      const centerX = width / 2;
      const centerY = height / 2 + 10;
      const radius = Math.min(width, height) / 2 - 25;

      const g = svg
        .append('g')
        .attr('transform', `translate(${centerX},${centerY})`);

      // Define Arc generators (semi-circle gauge from -Math.PI*0.75 to Math.PI*0.75)
      const startAngle = -Math.PI * 0.75;
      const endAngle = Math.PI * 0.75;
      const totalAngleSpan = endAngle - startAngle;

      const currentProgressRatio = Math.min(1.2, globalPct / 100);
      const activeAngle = startAngle + totalAngleSpan * (currentProgressRatio / 1.2);

      const backgroundArc = d3
        .arc<any>()
        .innerRadius(radius - 24)
        .outerRadius(radius)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .cornerRadius(8);

      const progressArc = d3
        .arc<any>()
        .innerRadius(radius - 24)
        .outerRadius(radius)
        .startAngle(startAngle)
        .cornerRadius(8);

      // Background Track
      g.append('path')
        .attr('d', backgroundArc({}))
        .attr('fill', '#1e293b')
        .attr('stroke', 'rgba(255, 255, 255, 0.08)')
        .attr('stroke-width', 1);

      // Determine color based on threshold
      const gaugeColor =
        globalPct > 100 ? '#f43f5e' : globalPct >= 85 ? '#fbbf24' : '#38bdf8';

      // Gradient for active gauge
      const defs = svg.append('defs');
      const gaugeGrad = defs
        .append('linearGradient')
        .attr('id', 'd3-gauge-grad')
        .attr('x1', '0%')
        .attr('x2', '100%');
      gaugeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0284c7');
      gaugeGrad.append('stop').attr('offset', '100%').attr('stop-color', gaugeColor);

      // Animated Progress Arc
      g.append('path')
        .datum({ endAngle: startAngle })
        .attr('fill', 'url(#d3-gauge-grad)')
        .transition()
        .duration(900)
        .ease(d3.easeCubicOut)
        .attrTween('d', (d) => {
          const interpolate = d3.interpolate(d.endAngle, activeAngle);
          return (t) => {
            d.endAngle = interpolate(t);
            return progressArc(d) || '';
          };
        });

      // Threshold ticks on gauge
      [0.25, 0.5, 0.75, 1.0].forEach((fraction) => {
        const tickAngle = startAngle + totalAngleSpan * (fraction / 1.2);
        const x1 = Math.sin(tickAngle) * (radius - 28);
        const y1 = -Math.cos(tickAngle) * (radius - 28);
        const x2 = Math.sin(tickAngle) * (radius - 3);
        const y2 = -Math.cos(tickAngle) * (radius - 3);

        g.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', fraction === 1.0 ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)')
          .attr('stroke-width', fraction === 1.0 ? 2 : 1);
      });

      // Center Percentage Text
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -12)
        .attr('fill', '#ffffff')
        .attr('font-size', '34px')
        .attr('font-weight', '900')
        .attr('font-family', 'sans-serif')
        .text(`${globalPct.toFixed(1)}%`);

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 14)
        .attr('fill', '#94a3b8')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text('Ejecución Presupuestaria');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 36)
        .attr('fill', gaugeColor)
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .text(
          globalPct > 100
            ? '⚠ ALERTA DE SOBRECOSTO'
            : globalPct >= 85
            ? 'EN REVISIÓN PREVENTIVA'
            : '✓ DENTRO DE MARGEN PROGRAMADO'
        );
    }
  }, [dimensions, projects, activeProjectId, viewType, currency, company.exchangeRate]);

  return (
    <div
      ref={containerRef}
      className={`glass-panel p-5 space-y-4 relative select-none ${className}`}
    >
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">
                Monitoreo D3.js: Utilización Presupuestaria & Gasto Real
              </h3>
              <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/25">
                D3 v7 Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Análisis comparativo en tiempo real del presupuesto asignado vs. desembolsos ejecutados
            </p>
          </div>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewType('bars')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewType === 'bars'
                ? 'bg-sky-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Barras por Obra</span>
          </button>
          <button
            type="button"
            onClick={() => setViewType('gauge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewType === 'gauge'
                ? 'bg-sky-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Medidor Global</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Presupuesto Global</span>
          <div className="text-sm sm:text-base font-bold text-white mt-0.5">{formatMoney(totalBudget)}</div>
          <span className="text-[10px] text-slate-400">{projects.length} Obras en curso</span>
        </div>

        <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Gasto Real Ejecutado</span>
          <div className="text-sm sm:text-base font-bold text-sky-400 mt-0.5">{formatMoney(totalSpent)}</div>
          <span className="text-[10px] text-sky-300 font-semibold">{globalPct.toFixed(1)}% utilizado</span>
        </div>

        <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Remanente Disponible</span>
          <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
            {formatMoney(remainingBudget)}
          </div>
          <span className="text-[10px] text-emerald-300">{(100 - globalPct).toFixed(1)}% disponible</span>
        </div>

        <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Control de Desvío</span>
          <div className="text-sm sm:text-base font-bold text-amber-400 mt-0.5">
            {globalPct > 100 ? 'Sobrecosto' : 'Control Óptimo'}
          </div>
          <span className="text-[10px] text-slate-300">Tolerancia ±5%</span>
        </div>
      </div>

      {/* SVG Canvas for D3 */}
      <div className="w-full relative min-h-[300px] flex items-center justify-center">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible block max-w-full"
        />

        {/* D3 Interactive Tooltip Overlay */}
        {tooltipData && tooltipData.visible && (
          <div
            className="absolute pointer-events-none z-30 p-3 bg-slate-900/95 backdrop-blur-md border border-sky-400/40 rounded-xl shadow-2xl text-xs space-y-1 text-white min-w-[210px] animate-in fade-in duration-150"
            style={{
              left: Math.min(dimensions.width - 230, Math.max(10, tooltipData.x + 15)),
              top: Math.max(10, tooltipData.y - 45),
            }}
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-mono text-[10px] font-bold text-sky-400">{tooltipData.code}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  tooltipData.pct > 100
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {tooltipData.pct}%
              </span>
            </div>
            <p className="font-bold text-slate-100 truncate max-w-[190px]">{tooltipData.title}</p>
            <div className="text-[11px] text-slate-300 space-y-0.5 pt-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Presupuesto:</span>
                <span className="font-mono">{formatMoney(tooltipData.budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inversión Real:</span>
                <span className="font-mono text-sky-300 font-bold">{formatMoney(tooltipData.spent)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="text-slate-400">
                  {tooltipData.variance >= 0 ? 'Saldo a Favor:' : 'Exceso:'}
                </span>
                <span
                  className={`font-mono font-bold ${
                    tooltipData.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatMoney(Math.abs(tooltipData.variance))}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 italic">Haga clic para seleccionar obra</p>
          </div>
        )}
      </div>

      {/* Legend & Guidance Footer */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-600 inline-block" />
            <span>Presupuesto Programado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
            <span>Gasto Real Ejecutado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
            <span>Sobrecosto &gt;100%</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          Obra activa:{' '}
          <strong className="text-sky-300">
            {projects.find((p) => p.id === activeProjectId)?.name || 'Todas'}
          </strong>
        </span>
      </div>
    </div>
  );
};
export default D3BudgetUtilizationChart;
