import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TelemetryPoint } from "../types";
import { Activity, Focus, Cpu, ArrowUp, ArrowDown } from "lucide-react";

interface D3CognitiveChartProps {
  telemetryData: TelemetryPoint[];
}

export default function D3CognitiveChart({ telemetryData }: D3CognitiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 260 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take the last 10 points
  const lastTen = telemetryData.slice(-10);

  // Resize observer to handle fluid responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      // Keep dimensions within sensible boundaries
      setDimensions({
        width: Math.max(width, 280),
        height: Math.max(height, 220),
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // D3 Render Loop
  useEffect(() => {
    if (!svgRef.current || lastTen.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 35, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create main container group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale based on array index (last 10 elements)
    const xScale = d3
      .scaleLinear()
      .domain([0, lastTen.length - 1])
      .range([0, innerWidth]);

    // Y scale (0 to 100 percentage)
    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Background horizontal grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .ticks(5)
      .tickFormat(() => "");

    g.append("g")
      .attr("class", "grid")
      .style("stroke-opacity", 0.06)
      .style("stroke", "#1e293b")
      .call(yAxisGrid)
      .selectAll(".domain")
      .remove();

    // Bottom Axis (X-Axis) ticks
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(lastTen.length)
      .tickFormat((d) => {
        const idx = d as number;
        return lastTen[idx]?.timeString || "";
      });

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .attr("class", "x-axis")
      .style("color", "#64748b")
      .style("font-family", "monospace")
      .style("font-size", "9px")
      .call(xAxis)
      .selectAll(".domain, line")
      .style("stroke", "#334155")
      .style("stroke-opacity", 0.4);

    // Left Axis (Y-Axis) for percentage
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}%`);

    g.append("g")
      .attr("class", "y-axis")
      .style("color", "#64748b")
      .style("font-family", "monospace")
      .style("font-size", "9px")
      .call(yAxis)
      .selectAll(".domain, line")
      .style("stroke", "#334155")
      .style("stroke-opacity", 0.4);

    // Define Gradients for beautiful glow/areas under lines
    const defs = svg.append("defs");

    // Focus Area Gradient
    const focusGrad = defs
      .append("linearGradient")
      .attr("id", "focus-area-grad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    focusGrad.append("stop").attr("offset", "0%").attr("stop-color", "#c084fc").attr("stop-opacity", 0.12);
    focusGrad.append("stop").attr("offset", "100%").attr("stop-color", "#c084fc").attr("stop-opacity", 0.0);

    // Load Area Gradient
    const loadGrad = defs
      .append("linearGradient")
      .attr("id", "load-area-grad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    loadGrad.append("stop").attr("offset", "0%").attr("stop-color", "#f97316").attr("stop-opacity", 0.12);
    loadGrad.append("stop").attr("offset", "100%").attr("stop-color", "#f97316").attr("stop-opacity", 0.0);

    // Area Generators
    const focusArea = d3
      .area<TelemetryPoint>()
      .x((_, idx) => xScale(idx))
      .y0(innerHeight)
      .y1((d) => yScale(d.focusLevel))
      .curve(d3.curveMonotoneX);

    const loadArea = d3
      .area<TelemetryPoint>()
      .x((_, idx) => xScale(idx))
      .y0(innerHeight)
      .y1((d) => yScale(d.cognitiveLoad))
      .curve(d3.curveMonotoneX);

    // Draw Areas first
    g.append("path")
      .datum(lastTen)
      .attr("class", "area-focus")
      .attr("d", focusArea)
      .style("fill", "url(#focus-area-grad)");

    g.append("path")
      .datum(lastTen)
      .attr("class", "area-load")
      .attr("d", loadArea)
      .style("fill", "url(#load-area-grad)");

    // Line Generators
    const focusLine = d3
      .line<TelemetryPoint>()
      .x((_, idx) => xScale(idx))
      .y((d) => yScale(d.focusLevel))
      .curve(d3.curveMonotoneX);

    const loadLine = d3
      .line<TelemetryPoint>()
      .x((_, idx) => xScale(idx))
      .y((d) => yScale(d.cognitiveLoad))
      .curve(d3.curveMonotoneX);

    // Draw lines
    g.append("path")
      .datum(lastTen)
      .attr("fill", "none")
      .attr("stroke", "#c084fc")
      .attr("stroke-width", 2.2)
      .attr("d", focusLine);

    g.append("path")
      .datum(lastTen)
      .attr("fill", "none")
      .attr("stroke", "#f97316")
      .attr("stroke-width", 2.2)
      .attr("d", loadLine);

    // Add glowing shadows to lines (re-drawing wider stroke underneath with lower opacity)
    g.append("path")
      .datum(lastTen)
      .attr("fill", "none")
      .attr("stroke", "#c084fc")
      .attr("stroke-width", 6)
      .style("opacity", 0.15)
      .attr("d", focusLine);

    g.append("path")
      .datum(lastTen)
      .attr("fill", "none")
      .attr("stroke", "#f97316")
      .attr("stroke-width", 6)
      .style("opacity", 0.15)
      .attr("d", loadLine);

    // Interactive Hover Vertical Marker Line
    const hoverLine = g
      .append("line")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .style("stroke", "#ffffff")
      .style("stroke-opacity", 0.15)
      .style("stroke-dasharray", "3, 3")
      .style("pointer-events", "none")
      .style("display", "none");

    // Scatter Node Circles
    const focusCircles = g
      .selectAll(".circle-focus")
      .data(lastTen)
      .enter()
      .append("circle")
      .attr("cx", (_, idx) => xScale(idx))
      .attr("cy", (d) => yScale(d.focusLevel))
      .attr("r", 3.5)
      .style("fill", "#02010c")
      .style("stroke", "#c084fc")
      .style("stroke-width", 1.8)
      .style("transition", "r 0.1s ease");

    const loadCircles = g
      .selectAll(".circle-load")
      .data(lastTen)
      .enter()
      .append("circle")
      .attr("cx", (_, idx) => xScale(idx))
      .attr("cy", (d) => yScale(d.cognitiveLoad))
      .attr("r", 3.5)
      .style("fill", "#02010c")
      .style("stroke", "#f97316")
      .style("stroke-width", 1.8)
      .style("transition", "r 0.1s ease");

    // Overlay rect for handling mouse capture across the chart spectrum
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .style("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", (event) => {
        const [mouseX] = d3.pointer(event);
        // Find nearest point
        const rawIndex = xScale.invert(mouseX);
        const index = Math.max(0, Math.min(lastTen.length - 1, Math.round(rawIndex)));

        setHoveredIndex(index);

        // Update indicator line
        hoverLine
          .attr("x1", xScale(index))
          .attr("x2", xScale(index))
          .style("display", "block");

        // Scale up active circle node
        focusCircles.attr("r", (_, idx) => (idx === index ? 6.0 : 3.5));
        loadCircles.attr("r", (_, idx) => (idx === index ? 6.0 : 3.5));
      })
      .on("mouseleave", () => {
        setHoveredIndex(null);
        hoverLine.style("display", "none");
        focusCircles.attr("r", 3.5);
        loadCircles.attr("r", 3.5);
      });

  }, [dimensions, lastTen]);

  const activePoint = hoveredIndex !== null ? lastTen[hoveredIndex] : lastTen[lastTen.length - 1];

  // Calculate focus trend compared to the previous telemetry point
  const activeIndexInTelemetry = hoveredIndex !== null 
    ? (telemetryData.length - lastTen.length + hoveredIndex) 
    : (telemetryData.length - 1);

  const prevPoint = activeIndexInTelemetry > 0 ? telemetryData[activeIndexInTelemetry - 1] : null;

  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (activePoint && prevPoint) {
    if (activePoint.focusLevel > prevPoint.focusLevel) {
      trend = 'up';
    } else if (activePoint.focusLevel < prevPoint.focusLevel) {
      trend = 'down';
    }
  }

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col h-full relative overflow-hidden">
      
      {/* Background matrix mesh details for high tech style */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.15)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.02),_rgba(0,255,0,0.01),_rgba(0,0,255,0.02))] bg-[size:100%_4px,_6px_100%] opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-900 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Cpu className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              D3 COGNITIVE OVERLAY ENGINE
            </span>
            <span className="text-[9px] text-slate-500 font-sans mt-0.5">
              Micro-synchronized tracking of cognitive depth vs. process load
            </span>
          </div>
        </div>

        {/* Live point summary badge */}
        {activePoint && (
          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[9px] flex items-center gap-4.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-slate-400">FOCUS:</span>
              <span className="text-purple-300 font-bold flex items-center gap-1">
                {activePoint.focusLevel}%
                {trend === 'up' && (
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-400" title="Rising Focus Level" />
                )}
                {trend === 'down' && (
                  <ArrowDown className="w-3.5 h-3.5 text-red-400" title="Falling Focus Level" />
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="text-slate-400">LOAD:</span>
              <span className="text-orange-300 font-bold">{activePoint.cognitiveLoad}%</span>
            </div>
            <div className="text-slate-500 border-l border-slate-800 pl-3">
              {activePoint.timeString}
            </div>
          </div>
        )}
      </div>

      {/* D3 Canvas container */}
      <div ref={containerRef} className="flex-1 min-h-[220px] w-full relative z-10">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible"
        />
      </div>

      {/* Mini Legend & Instructions */}
      <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono mt-3.5 border-t border-slate-900/60 pt-2 relative z-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Focus Depth
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Cognitive Load
          </span>
        </div>
        <span>Hover grid to inspect micro-second telemetry intervals</span>
      </div>
    </div>
  );
}
