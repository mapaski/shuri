import { useScanData, Device } from "@/hooks/use-scan-data";
import { useDeviceDrawer } from "@/context/device-drawer-context";
import { Wifi, CheckCircle, AlertTriangle, XCircle, Loader2, Info } from "lucide-react";
import { useEffect, useRef } from "react";

const SVG_W = 800, SVG_H = 500;

function buildLayout(devices: Device[]) {
  const cx = 400, cy = 250;
  const positions: Record<string, { x: number; y: number }> = {};
  const connections: [string, string][] = [];
  if (devices.length === 0) return { positions, connections };
  const adminDev = devices.find(d => d.hostname === "gateway.local");
  const sorted = [...devices].sort((a, b) => a.risk_score - b.risk_score);
  const hub = adminDev || sorted[0];
  positions[hub.id] = { x: cx, y: cy };
  const rest = sorted.filter(d => d.id !== hub.id);
  const offsets = [
    {x: -280, y: -160}, {x: 0, y: -200}, {x: 280, y: -160},
    {x: -320, y: 0},                      {x: 320, y: 0},
    {x: -280, y: 160},  {x: 0, y: 200},  {x: 280, y: 160},
    {x: -160, y: -100}, {x: 160, y: -100},
    {x: -160, y: 100},  {x: 160, y: 100},
  ];
  const interleaved: Device[] = [];
  const highs = rest.filter(d => d.risk_score >= 45);
  const lows = rest.filter(d => d.risk_score < 45);
  const maxLen = Math.max(highs.length, lows.length);
  for (let i = 0; i < maxLen; i++) {
    if (lows[i]) interleaved.push(lows[i]);
    if (highs[i]) interleaved.push(highs[i]);
  }
  interleaved.forEach((d, i) => {
    const off = offsets[i % offsets.length];
    positions[d.id] = {
      x: Math.min(680, Math.max(20, cx + off.x)),
      y: Math.min(380, Math.max(20, cy + off.y)),
    };
    connections.push([hub.id, d.id]);
  });
  return { positions, connections };
}

function blastRadius(d: Device): number { return (d as any).blast_radius ?? 0; }

const riskColor: Record<string, string> = {
  CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#F59E0B", LOW: "#10B981", down: "#6B7280",
};

function statusColor(d: Device): string {
  if (d.state === "down") return "#6B7280";
  return riskColor[d.risk_level];
}

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

const iconPaths: Record<string, string> = {
  "IP Camera": "M12 4a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4M6 2l1.5 2H9a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h1.5L6 2z",
  "Router/AP": "M12 3C6.95 3 3 6.95 3 12s3.95 9 9 9 9-3.95 9-9-3.95-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm-1-11v2H9v2h2v6h2v-6h2v-2h-2V8h-2z",
  "IoT Device": "M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2m0 2a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8m0 3a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5m0 2a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3z",
  "IoT/MQTT Device": "M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2m0 2a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8m0 3a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5m0 2a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3z",
  "Windows Machine": "M3 5v14h18V5H3zm16 12H5v-8h14v8zm0-10H5V7h14v2z",
  "Linux Server/SBC": "M20 3H4a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2zm-5 5h-2V6h2v2zm4 0h-2V6h2v2zM4 13h16a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2zm11 4h2v-2h-2v2zm4 0h-2v-2h2v2z",
  "Mobile/Smart Device": "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z",
  "Smart Device": "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z",
  "Web-enabled Device": "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
  "Unknown": "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z",
};

export default function NetworkMap() {
  const { data, isLoading, isError } = useScanData();
  const { openDrawer } = useDeviceDrawer();

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );
  if (isError || !data) return (
    <div className="h-full flex items-center justify-center">
      <XCircle size={24} className="text-destructive mr-2" />
      <span className="text-sm text-muted-foreground">Failed to load data</span>
    </div>
  );

  const { devices, scan_metadata, honeypot_alerts } = data;
  const criticalCount = devices.filter(d => d.risk_level === "CRITICAL" && d.state === "up").length;
  const highCount = devices.filter(d => d.risk_level === "HIGH" && d.state === "up").length;

  const stats = [
    { label: "Total Devices", value: scan_metadata.total_targets, icon: Wifi, color: "text-primary" },
    { label: "Online", value: scan_metadata.total_up, icon: CheckCircle, color: "text-emerald-400" },
    { label: "High Risk", value: highCount, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Critical", value: criticalCount, icon: XCircle, color: "text-red-400" },
  ];

  const { positions: POSITIONS, connections: CONNECTIONS } = buildLayout(devices);
  const maxBR = Math.max(...devices.map(blastRadius), 1);
  const latestAlerts = (honeypot_alerts || []).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Network Topology — Blast Radius View</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Node size = blast radius · click any node to inspect</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Last scan: {relativeTime(scan_metadata.timestamp)}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-background/40 overflow-hidden">
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: "block" }}>
              <defs>
                <filter id="glow-red">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-orange">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <style>{`
                  .dash-anim { animation: dash 3s linear infinite; }
                  .dash-anim-fast { animation: dash 1.5s linear infinite; }
                  @keyframes dash { to { stroke-dashoffset: -20; } }
                  .pulse-ring { animation: pulseRing 2s ease-out infinite; }
                  @keyframes pulseRing { 0% { r: 28; opacity: 0.6; } 100% { r: 42; opacity: 0; } }
                  .pulse-ring-slow { animation: pulseRing 3s ease-out infinite; }
                `}</style>
              </defs>

              {/* Connections */}
              {CONNECTIONS.map(([from, to]) => {
                const a = POSITIONS[from], b = POSITIONS[to];
                if (!a || !b) return null;
                const fromDev = devices.find(d => d.id === from);
                const toDev = devices.find(d => d.id === to);
                const isCritical = fromDev?.risk_level === "CRITICAL" || toDev?.risk_level === "CRITICAL";
                const isHigh = fromDev?.risk_level === "HIGH" || toDev?.risk_level === "HIGH";
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isCritical ? "rgba(239,68,68,0.6)" : isHigh ? "rgba(249,115,22,0.4)" : "rgba(168,85,247,0.2)"}
                    strokeWidth={isCritical ? 2 : 1.5}
                    strokeDasharray="6 4"
                    className={isCritical ? "dash-anim-fast" : "dash-anim"}
                  />
                );
              })}

              {/* Nodes */}
              {devices.map(device => {
                const pos = POSITIONS[device.id];
                if (!pos) return null;
                const color = statusColor(device);
                const isCritical = device.risk_level === "CRITICAL" && device.state === "up";
                const isHigh = device.risk_level === "HIGH" && device.state === "up";
                const filterId = isCritical ? "url(#glow-red)" : isHigh ? "url(#glow-orange)" : "";
                const boxSize = 44;
                const half = boxSize / 2;
                const iconPath = iconPaths[device.device_type] || iconPaths["Unknown"];
                return (
                  <g key={device.id} style={{ cursor: "pointer" }} onClick={() => openDrawer(device)} filter={filterId}>
                    {/* Pulse ring for critical */}
                    {isCritical && (
                      <circle cx={pos.x} cy={pos.y} r={28} fill="none" stroke="#EF4444" strokeWidth="1.5" className="pulse-ring" />
                    )}
                    {isHigh && !isCritical && (
                      <circle cx={pos.x} cy={pos.y} r={26} fill="none" stroke="#F97316" strokeWidth="1" className="pulse-ring-slow" />
                    )}
                    <rect x={pos.x - half} y={pos.y - half} width={boxSize} height={boxSize} rx={10} ry={10}
                      fill={`${color}18`} stroke={color} strokeWidth={isCritical ? 2 : 1.5} />
                    <g transform={`translate(${pos.x - 10}, ${pos.y - 10}) scale(0.85)`}>
                      <path d={iconPath} fill={color} opacity="0.9" />
                    </g>
                    <circle cx={pos.x + half - 5} cy={pos.y - half + 5} r={5}
                      fill={device.state === "up" ? color : "#6B7280"} stroke="#111827" strokeWidth="1.5" />
                    {(device as any).firewall_detected && (
                      <text x={pos.x - half + 6} y={pos.y - half + 10} textAnchor="middle" fontSize="10">🛡</text>
                    )}
                    <text x={pos.x} y={pos.y + half + 14} textAnchor="middle" fontSize="9" fill="#e5e7eb" fontWeight="500">{device.hostname}</text>
                    <text x={pos.x} y={pos.y + half + 25} textAnchor="middle" fontSize="8" fill="#6b7280">{device.ip}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center gap-5 mt-3">
            {[
              { label: "Critical", color: "#EF4444" }, { label: "High", color: "#F97316" },
              { label: "Medium", color: "#F59E0B" }, { label: "Low", color: "#10B981" },
              { label: "Offline", color: "#6B7280" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info size={11} /> Number inside node = blast radius
            </div>
          </div>

          {/* Live alert ticker */}
          {latestAlerts.length > 0 && (
            <div className="mt-3 border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Live Honeypot Activity
              </p>
              <div className="space-y-1">
                {latestAlerts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-red-400 font-mono">{a.attacker_ip}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-foreground">{a.honeypot_type?.replace("fake_", "")}</span>
                    <span className="text-muted-foreground ml-auto">{relativeTime(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Blast Radius Ranking */}
        <div className="bg-card border border-border rounded-xl p-5 overflow-y-auto">
          <h2 className="text-sm font-semibold text-foreground mb-4">Blast Radius Ranking</h2>
          <div className="space-y-2">
            {[...devices].sort((a, b) => blastRadius(b) - blastRadius(a)).map((device, i) => {
              const br = blastRadius(device);
              const color = statusColor(device);
              return (
                <button key={device.id} onClick={() => openDrawer(device)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors text-left">
                  <span className="text-xs text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground truncate">{device.hostname}</span>
                      <span className="text-xs font-mono font-bold ml-2 flex-shrink-0" style={{ color }}>{br}/10</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(br / maxBR) * 100}%`, background: color }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Blast radius = risk score + open port count + max CVSS. Highest-impact devices to remediate first.
          </p>
        </div>
      </div>
    </div>
  );
}
