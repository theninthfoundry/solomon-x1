import { useState, useEffect } from "react";
import { TelemetryPoint } from "../types";
import { ResponsiveContainer, LineChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Activity, Zap, Play, Eye, Flame, ShieldAlert, Cpu } from "lucide-react";

const COGNITIVE_AGENTS = [
  { id: 0, name: "Ars Almadel", role: "Firewall", baseLatency: 800 },
  { id: 1, name: "Ars Notoria", role: "Memory", baseLatency: 1100 },
  { id: 2, name: "Ars Paulina", role: "Doubt", baseLatency: 1500 },
  { id: 3, name: "Ars Goetia", role: "Optimizer", baseLatency: 950 },
  { id: 4, name: "Ars Theurgia", role: "Atmospheric", baseLatency: 1300 },
  { id: 5, name: "Ars Almiras", role: "Twin", baseLatency: 1200 },
  { id: 6, name: "Ars Verum", role: "Gatekeeper", baseLatency: 1400 },
  { id: 7, name: "Ars Ephesia", role: "Dream", baseLatency: 1750 },
  { id: 8, name: "Ars Fulcanelli", role: "Auditor", baseLatency: 2100 },
  { id: 9, name: "Ars Regalis", role: "Senate", baseLatency: 1850 }
];

interface StateTrackerProps {
  telemetryData: TelemetryPoint[];
  onUpdateTelemetry: (newData: TelemetryPoint[]) => void;
  bloomThreshold: number;
  setBloomThreshold: (val: number) => void;
  bloomIntensity: number;
  setBloomIntensity: (val: number) => void;
  bloomEnabled: boolean;
  setBloomEnabled: (val: boolean) => void;
}

export default function StateTracker({ 
  telemetryData, 
  onUpdateTelemetry,
  bloomThreshold,
  setBloomThreshold,
  bloomIntensity,
  setBloomIntensity,
  bloomEnabled,
  setBloomEnabled
}: StateTrackerProps) {
  const [activeSimulationMode, setActiveSimulationMode] = useState<"Quiet" | "HeavyCode" | "Distracted">("Quiet");
  
  // Real-time API Latencies for cognitive agents
  const [agentLatencies, setAgentLatencies] = useState<Record<number, number>>({
    0: 840,
    1: 1150,
    2: 1420,
    3: 980,
    4: 1280,
    5: 1190,
    6: 1450,
    7: 1810,
    8: 2200,
    9: 1910
  });

  const [pingingAgent, setPingingAgent] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setAgentLatencies(prev => {
        const next = { ...prev };
        COGNITIVE_AGENTS.forEach(agent => {
          if (pingingAgent === agent.id) return;
          
          let multiplier = 1.0;
          let variance = 150;
          if (activeSimulationMode === "Quiet") {
            multiplier = 0.75;
            variance = 80;
          } else if (activeSimulationMode === "HeavyCode") {
            multiplier = 1.6;
            variance = 400;
          } else {
            multiplier = 1.1;
            variance = 200;
          }
          const randomShift = (Math.random() - 0.5) * variance;
          next[agent.id] = Math.max(250, Math.round(agent.baseLatency * multiplier + randomShift));
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [activeSimulationMode, pingingAgent]);

  const handleManualPing = (agentId: number) => {
    setPingingAgent(agentId);
    setAgentLatencies(prev => ({
      ...prev,
      [agentId]: 120 // Simulated quick ping latency
    }));
    setTimeout(() => {
      setPingingAgent(null);
    }, 1200);
  };

  // Interactive visibility state for line trends
  const [visibleLines, setVisibleLines] = useState({
    focus: true,
    load: true,
    momentum: true,
    latency: true
  });

  // User adjustable warning thresholds
  const [focusThreshold, setFocusThreshold] = useState<number>(75);
  const [loadThreshold, setLoadThreshold] = useState<number>(60);
  const [latencyThreshold, setLatencyThreshold] = useState<number>(2500);

  // Custom interactive tooltip with dynamic threshold-triggered alerts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl space-y-1.5 font-mono text-[10px]">
          <p className="text-slate-400 font-bold border-b border-slate-900 pb-1 mb-1">{label}</p>
          {payload.map((entry: any) => {
            const isFocus = entry.dataKey === "focusLevel";
            const isLoad = entry.dataKey === "cognitiveLoad";
            const isMomentum = entry.dataKey === "momentum";
            const isLatency = entry.dataKey === "geminiLatency";
            
            const color = entry.color;
            const labelText = entry.name;
            const value = entry.value;
            const suffix = isLatency ? " ms" : "%";
            
            let alertMsg = "";
            if (isFocus && value < focusThreshold) {
              alertMsg = " ⚠️ Below Target";
            } else if (isLoad && value > loadThreshold) {
              alertMsg = " 🚨 Overloaded";
            } else if (isLatency && value > latencyThreshold) {
              alertMsg = " ⚡ Latency Spiked";
            }
            
            return (
              <div key={entry.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5" style={{ color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {labelText}:
                </span>
                <span className="font-bold text-slate-100">
                  {value}{suffix}
                  {alertMsg && <span className="text-red-400 font-semibold text-[9px] ml-1">{alertMsg}</span>}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Calculate current averages
  const latestPoint = telemetryData[telemetryData.length - 1] || { focusLevel: 80, cognitiveLoad: 40, momentum: 75 };
  
  const avgFocus = Math.round(
    telemetryData.reduce((acc, p) => acc + p.focusLevel, 0) / telemetryData.length
  );
  const avgLoad = Math.round(
    telemetryData.reduce((acc, p) => acc + p.cognitiveLoad, 0) / telemetryData.length
  );
  const avgMomentum = Math.round(
    telemetryData.reduce((acc, p) => acc + p.momentum, 0) / telemetryData.length
  );

  const triggerSimulation = (mode: "Quiet" | "HeavyCode" | "Distracted") => {
    setActiveSimulationMode(mode);

    // Re-seed telemetry points based on selected activity type
    const baseData = [] as TelemetryPoint[];
    let focus = 80;
    let load = 30;
    let momentum = 70;

    for (let i = 0; i < 10; i++) {
      const minutesAgo = (9 - i) * 5;
      const timeString = `${minutesAgo}m ago`;

      if (mode === "Quiet") {
        focus = Math.max(70, Math.min(100, 85 + Math.random() * 12 - 5));
        load = Math.max(15, Math.min(60, 25 + Math.random() * 15 - 5));
        momentum = Math.max(50, Math.min(95, 75 + Math.random() * 10 - 5));
      } else if (mode === "HeavyCode") {
        focus = Math.max(80, Math.min(100, 92 + Math.random() * 8 - 4));
        load = Math.max(55, Math.min(98, 82 + Math.random() * 14 - 7));
        momentum = Math.max(80, Math.min(100, 90 + Math.random() * 10 - 4));
      } else {
        focus = Math.max(20, Math.min(65, 42 + Math.random() * 20 - 10));
        load = Math.max(10, Math.min(50, 20 + Math.random() * 10 - 5));
        momentum = Math.max(15, Math.min(55, 30 + Math.random() * 15 - 10));
      }

      let simulatedLatency = 1000;
      if (mode === "Quiet") {
        simulatedLatency = Math.round(400 + load * 10 + Math.random() * 200);
      } else if (mode === "HeavyCode") {
        simulatedLatency = Math.round(1500 + load * 22 + Math.random() * 600);
      } else {
        simulatedLatency = Math.round(800 + load * 12 + Math.random() * 300);
      }

      baseData.push({
        timeIndex: i,
        timeString,
        focusLevel: Math.round(focus),
        cognitiveLoad: Math.round(load),
        momentum: Math.round(momentum),
        geminiLatency: simulatedLatency,
      });
    }

    onUpdateTelemetry(baseData);
  };

  return (
    <div id="state-tracker-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-300 font-mono">
      
      {/* Simulation Selector and Live stats cards */}
      <div id="telemetry-sidebar" className="lg:col-span-4 space-y-4">
        {/* Simulation Selector */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold text-slate-100 font-sans">Laptop I/O Feed</h3>
          </div>
          
          <p className="text-[11px] text-slate-400 leading-normal">
            Interact with your local application workspace layout to simulate real physical input/focus streams automatically.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => triggerSimulation("Quiet")}
              className={`w-full h-10 px-4 rounded-xl text-xs font-semibold flex items-center justify-between border transition ${
                activeSimulationMode === "Quiet"
                  ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                  : "bg-slate-950 border-slate-800/80 hover:border-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-400" />
                Quiet Deep Flow
              </span>
              <Play className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => triggerSimulation("HeavyCode")}
              className={`w-full h-10 px-4 rounded-xl text-xs font-semibold flex items-center justify-between border transition ${
                activeSimulationMode === "HeavyCode"
                  ? "bg-orange-500/10 border-orange-500/40 text-orange-300"
                  : "bg-slate-950 border-slate-800/80 hover:border-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                Heavy Code Engineering
              </span>
              <Play className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => triggerSimulation("Distracted")}
              className={`w-full h-10 px-4 rounded-xl text-xs font-semibold flex items-center justify-between border transition ${
                activeSimulationMode === "Distracted"
                  ? "bg-red-500/10 border-red-500/40 text-red-300"
                  : "bg-slate-950 border-slate-800/80 hover:border-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Distracted Browsing
              </span>
              <Play className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* Solomon Ring Ethereal Glow Calibration Sliders */}
        <div id="glow-config-card" className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-purple-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-100 font-sans">Ethereal Glow Calibration</h3>
          </div>
          
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            Calibrate the real-time bloom processing filters of the Solomon rings to accommodate custom screen resolutions.
          </p>

          {/* Quick Toggle for Bloom Post-Processing */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 text-left">
              <span className="text-slate-200 font-bold tracking-wide block font-sans">Unreal Bloom Filter</span>
              <span className="text-[9px] text-slate-500 block font-sans">Optimize FPS on lower-end devices</span>
            </div>
            <button
              onClick={() => setBloomEnabled(!bloomEnabled)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all tracking-wider text-[9px] border cursor-pointer ${
                bloomEnabled 
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30" 
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300 hover:bg-slate-850"
              }`}
            >
              {bloomEnabled ? "ENABLED" : "DISABLED"}
            </button>
          </div>

          <div className={`space-y-4 pt-1 font-mono transition-opacity duration-300 ${bloomEnabled ? "" : "opacity-35 pointer-events-none"}`}>
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 font-mono">
                <span>Bloom Threshold</span>
                <span className="text-purple-400 font-mono">{(bloomThreshold).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={bloomThreshold}
                onChange={(e) => setBloomThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 border border-slate-800 focus:outline-none"
              />
              <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-mono">
                <span>0.0 (Max glow)</span>
                <span>1.0 (Narrow keys)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 font-mono">
                <span>Bloom Intensity</span>
                <span className="text-purple-400 font-mono">{(bloomIntensity).toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.05"
                value={bloomIntensity}
                onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 border border-slate-800 focus:outline-none"
              />
              <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-mono">
                <span>0.0 (Off)</span>
                <span>5.0 (Extreme)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cognitive Twin Metrics Details */}
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-3.5">
          <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between h-[100px]">
            <span className="text-[10px] text-slate-500 font-bold uppercase">FOCUS ENTRAIN</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">{latestPoint.focusLevel}%</span>
              <span className="text-[9px] text-purple-400">AVG: {avgFocus}%</span>
            </div>
          </div>

          <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between h-[100px]">
            <span className="text-[10px] text-slate-500 font-bold uppercase">METRIC LOAD</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">{latestPoint.cognitiveLoad}%</span>
              <span className="text-[9px] text-orange-400">AVG: {avgLoad}%</span>
            </div>
          </div>

          <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between h-[100px]">
            <span className="text-[10px] text-slate-500 font-bold uppercase">WORK MASS</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">{latestPoint.momentum}%</span>
              <span className="text-[9px] text-yellow-400">AVG: {avgMomentum}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Graphical Pane Column */}
      <div className="lg:col-span-8 space-y-6 flex flex-col">
        {/* Main Telemetry Chart */}
        <div id="chart-panel" className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300">COGNITIVE MANIFOLD SEQUENCES (30m SLIDING)</span>
            </div>
            
            {/* Metric Interactive Legend Switches */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, focus: !prev.focus }))}
                className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  visibleLines.focus 
                    ? "bg-purple-500/15 border-purple-500/35 text-purple-300" 
                    : "bg-slate-950 border-slate-900 text-slate-500 opacity-60 hover:opacity-100"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${visibleLines.focus ? "bg-purple-400" : "bg-slate-600"}`} />
                Focus Depth
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, load: !prev.load }))}
                className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  visibleLines.load 
                    ? "bg-orange-500/15 border-orange-500/35 text-orange-300" 
                    : "bg-slate-950 border-slate-900 text-slate-500 opacity-60 hover:opacity-100"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${visibleLines.load ? "bg-orange-400" : "bg-slate-600"}`} />
                Cognitive Load
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, momentum: !prev.momentum }))}
                className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  visibleLines.momentum 
                    ? "bg-yellow-500/15 border-yellow-500/35 text-yellow-300" 
                    : "bg-slate-950 border-slate-900 text-slate-500 opacity-60 hover:opacity-100"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${visibleLines.momentum ? "bg-yellow-400" : "bg-slate-600"}`} />
                Work Momentum
              </button>
            </div>
          </div>

          {/* Interactive Reference Threshold Control Sliders */}
          <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-[10px] font-sans">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  FOCUS MINIMUM TARGET:
                </span>
                <span className="text-purple-400 font-mono font-bold">{focusThreshold}%</span>
              </div>
              <input 
                type="range"
                min="50"
                max="95"
                step="5"
                value={focusThreshold}
                onChange={(e) => setFocusThreshold(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500 border-none focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  COGNITIVE OVERLOAD LIMIT:
                </span>
                <span className="text-orange-400 font-mono font-bold">{loadThreshold}%</span>
              </div>
              <input 
                type="range"
                min="40"
                max="90"
                step="5"
                value={loadThreshold}
                onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-orange-500 border-none focus:outline-none"
              />
            </div>
          </div>

          {/* Telemetry charts */}
          <div className="flex-1 min-h-[260px] w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={telemetryData}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                <XAxis 
                  dataKey="timeString" 
                  stroke="#64748b" 
                  tick={{ fontSize: 9 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 9 }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference line for interactive Focus Threshold */}
                {visibleLines.focus && (
                  <ReferenceLine 
                    y={focusThreshold} 
                    stroke="#c084fc" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: `Target Focus (${focusThreshold}%)`, 
                      fill: "#c084fc", 
                      fontSize: 8, 
                      position: "insideBottomRight",
                      offset: 5
                    }} 
                  />
                )}

                {/* Reference line for interactive Cognitive Load threshold */}
                {visibleLines.load && (
                  <ReferenceLine 
                    y={loadThreshold} 
                    stroke="#f97316" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: `Overload Cap (${loadThreshold}%)`, 
                      fill: "#f97316", 
                      fontSize: 8, 
                      position: "insideTopRight",
                      offset: 5
                    }} 
                  />
                )}

                {visibleLines.focus && (
                  <Line
                    name="Focus Depth"
                    type="monotone"
                    dataKey="focusLevel"
                    stroke="#c084fc"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5, stroke: "#c084fc", fill: "#02010c" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#c084fc" }}
                    animationDuration={400}
                  />
                )}
                {visibleLines.load && (
                  <Line
                    name="Cognitive Load"
                    type="monotone"
                    dataKey="cognitiveLoad"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5, stroke: "#f97316", fill: "#02010c" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#f97316" }}
                    animationDuration={400}
                  />
                )}
                {visibleLines.momentum && (
                  <Line
                    name="Work Momentum"
                    type="monotone"
                    dataKey="momentum"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1.5, stroke: "#eab308", fill: "#02010c" }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#eab308" }}
                    animationDuration={400}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Gemini API Latency Heatmap Grid */}
        <div id="latency-heatmap-panel" className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Gemini API Latency Heatmap</span>
                <span className="text-[9px] text-slate-500 font-sans mt-0.5">Real-time model performance diagnostic matrix per agent interface</span>
              </div>
            </div>
            
            {/* Heatmap Legend */}
            <div className="flex items-center gap-3 text-[9px] font-sans">
              <span className="text-slate-500">LEGEND:</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-950 border border-emerald-500/50" />
                <span className="text-emerald-400">&lt; 1000ms</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-950 border border-amber-500/50" />
                <span className="text-amber-400">1000ms - 2000ms</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-rose-950 border border-rose-500/50" />
                <span className="text-rose-400">&gt; 2000ms</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-normal">
            Every cognitive ring triggers parallel asynchronous streaming context loops. Click on any agent node to execute a manual diagnostic ping sequence and measure localized request propagation.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {COGNITIVE_AGENTS.map((agent) => {
              const latency = agentLatencies[agent.id] || agent.baseLatency;
              const isPinging = pingingAgent === agent.id;
              
              // Determine status colors based on latency
              let colorClasses = "bg-emerald-950/25 border-emerald-500/30 text-emerald-400 hover:border-emerald-400";
              let badgeColor = "bg-emerald-500/10 text-emerald-300";
              let statusLabel = "OPTIMAL";
              
              if (latency >= 2000) {
                colorClasses = "bg-rose-950/25 border-rose-500/30 text-rose-400 hover:border-rose-400";
                badgeColor = "bg-rose-500/10 text-rose-300";
                statusLabel = "CRITICAL";
              } else if (latency >= 1000) {
                colorClasses = "bg-amber-950/25 border-amber-500/30 text-amber-400 hover:border-amber-400";
                badgeColor = "bg-amber-500/10 text-amber-300";
                statusLabel = "WARNING";
              }

              if (isPinging) {
                colorClasses = "bg-purple-950/40 border-purple-500 text-purple-300 animate-pulse scale-[1.02]";
                badgeColor = "bg-purple-500/20 text-purple-200 animate-bounce";
                statusLabel = "PINGING";
              }

              return (
                <button
                  type="button"
                  key={agent.id}
                  onClick={() => handleManualPing(agent.id)}
                  className={`p-3 rounded-xl border text-left font-mono transition-all duration-300 flex flex-col justify-between h-[96px] cursor-pointer relative overflow-hidden group select-none ${colorClasses}`}
                >
                  {/* Grid overlay for futuristic style */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] opacity-15 pointer-events-none group-hover:opacity-25" />
                  
                  {/* Subtle shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  
                  <div className="space-y-0.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold truncate tracking-wider max-w-[80%]">{agent.name}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isPinging ? "bg-purple-400 animate-ping" :
                        latency >= 2000 ? "bg-rose-500 animate-pulse" :
                        latency >= 1000 ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                    </div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-sans block">{agent.role}</span>
                  </div>

                  <div className="flex items-end justify-between pt-1 relative z-10">
                    <span className="text-xs font-bold font-mono tracking-tighter">
                      {isPinging ? "Scanning..." : `${latency}ms`}
                    </span>
                    <span className={`text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded ${badgeColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-1">
            <span>Grid state refreshed automatically every 3.0 seconds</span>
            <span className="text-purple-400/80">Average overall network latency: <span className="font-bold">{Math.round((Object.values(agentLatencies) as number[]).reduce((a, b) => a + b, 0) / 10)}ms</span></span>
          </div>
        </div>

        {/* System Bottleneck diagnostics overlay chart */}
        <div id="bottleneck-overlay-panel" className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300 uppercase">System Latency Correlation & Cognitive Bottlenecks</span>
            </div>
            
            {/* Metric Interactive Legend Switches */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, load: !prev.load }))}
                className={`px-2 py-0.5 rounded-md text-[8px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  visibleLines.load 
                    ? "bg-orange-500/15 border-orange-500/35 text-orange-300" 
                    : "bg-slate-950 border-slate-900 text-slate-500 opacity-60 hover:opacity-100"
                }`}
              >
                <div className={`w-1 h-1 rounded-full ${visibleLines.load ? "bg-orange-400" : "bg-slate-600"}`} />
                Load Curve
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, latency: !prev.latency }))}
                className={`px-2 py-0.5 rounded-md text-[8px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  visibleLines.latency 
                    ? "bg-purple-500/15 border-purple-500/35 text-purple-300" 
                    : "bg-slate-950 border-slate-900 text-slate-500 opacity-60 hover:opacity-100"
                }`}
              >
                <div className={`w-1 h-1 rounded-full ${visibleLines.latency ? "bg-purple-400" : "bg-slate-600"}`} />
                Latency Curve
              </button>
            </div>
          </div>

          {/* Interactive Latency Warning Slider */}
          <div className="grid grid-cols-1 gap-4 mb-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 text-[10px] font-sans">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  LATENCY CRITICAL TRIGGER:
                </span>
                <span className="text-purple-400 font-mono font-bold">{latencyThreshold} ms</span>
              </div>
              <input 
                type="range"
                min="1000"
                max="4000"
                step="250"
                value={latencyThreshold}
                onChange={(e) => setLatencyThreshold(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500 border-none focus:outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-normal mb-4">
            This live diagnostic overlay maps <span className="text-orange-400 font-semibold">User Cognitive Load</span> against <span className="text-purple-400 font-semibold">Gemini Response Latency</span> to isolate deep cognitive bottlenecks in high-frequency reasoning loops.
          </p>

          <div className="h-[210px] w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                <XAxis dataKey="timeString" stroke="#64748b" tick={{ fontSize: 9 }} />
                
                {/* Left Y-Axis for Cognitive Load (%) */}
                <YAxis 
                  yAxisId="left" 
                  stroke="#f97316" 
                  tick={{ fontSize: 9 }} 
                  domain={[0, 100]}
                />
                
                {/* Right Y-Axis for Gemini Latency (ms) */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#a855f7" 
                  tick={{ fontSize: 9 }} 
                  domain={[0, 5000]}
                />

                <Tooltip content={<CustomTooltip />} />
                
                {visibleLines.latency && (
                  <ReferenceLine 
                    yAxisId="right" 
                    y={latencyThreshold} 
                    stroke="#a855f7" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: `Alert Trigger (${latencyThreshold}ms)`, 
                      fill: "#a855f7", 
                      fontSize: 8, 
                      position: "insideBottomRight",
                      offset: 5
                    }} 
                  />
                )}

                {visibleLines.load && (
                  <Line
                    yAxisId="left"
                    name="Cognitive Load"
                    type="monotone"
                    dataKey="cognitiveLoad"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 2.5, strokeWidth: 1.5, stroke: "#f97316", fill: "#02010c" }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#f97316" }}
                    animationDuration={400}
                  />
                )}
                
                {visibleLines.latency && (
                  <Line
                    yAxisId="right"
                    name="Gemini Latency"
                    type="monotone"
                    dataKey="geminiLatency"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5, stroke: "#a855f7", fill: "#02010c" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#a855f7" }}
                    animationDuration={400}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Diagnostic Metrics Correlation Row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-900 text-center font-mono text-[9px]">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
              <span className="text-slate-500 uppercase block">Bottleneck Risk</span>
              <span className="text-orange-400 font-bold block mt-1 uppercase">
                {avgLoad > 70 ? "HIGH OVERLOAD" : avgLoad > 45 ? "MODERATE LAG" : "STABLE/OPTIMAL"}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
              <span className="text-slate-500 uppercase block">Avg Gemini Latency</span>
              <span className="text-purple-400 font-bold block mt-1">
                {Math.round(telemetryData.reduce((acc, p) => acc + (p.geminiLatency || 1200), 0) / telemetryData.length)} ms
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
              <span className="text-slate-500 uppercase block">Latency Coupling Ratio</span>
              <span className="text-slate-200 font-bold block mt-1">
                {(0.82 + (avgLoad / 400)).toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
