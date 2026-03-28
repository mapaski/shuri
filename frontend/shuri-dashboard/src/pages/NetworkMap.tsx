import { useScanData, Device } from "@/hooks/use-scan-data";
import { useDeviceDrawer } from "@/context/device-drawer-context";
import { Wifi, CheckCircle, AlertTriangle, XCircle, Loader2, Info } from "lucide-react";

const SVG_W = 700, SVG_H = 400;

const POSITIONS: Record<string, { x: number; y: number }> = {
  "DEV-001": { x: 555, y: 80  },
  "DEV-002": { x: 590, y: 210 },
  "DEV-003": { x: 340, y: 200 },
  "DEV-004": { x: 145, y: 85  },
  "DEV-005": { x: 540, y: 340 },
  "DEV-006": { x: 110, y: 275 },
  "DEV-007": { x: 340, y: 355 },
  "DEV-008": { x: 150, y: 190 },
};

const CONNECTIONS = [
  ["DEV-003", "DEV-001"], ["DEV-003", "DEV-002"],
  ["DEV-003", "DEV-004"], ["DEV-003", "DEV-005"],
  ["DEV-003", "DEV-006"], ["DEV-003", "DEV-007"],
  ["DEV-003", "DEV-008"],
];

function blastRadius(d: Device): number {
  const maxCvss = d.cves.length > 0 ? Math.max(...d.cves.map(c => c.cvss_score)) : 0;
  return Math.min(10, Math.round(d.risk_score / 15 + d.open_ports.length + maxCvss / 4));
}

const riskColor: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH:     "#F97316",
  MEDIUM:   "#F59E0B",
  LOW:      "#10B981",
  down:     "#6B7280",
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
      <span className="text-sm text-muted-foreground">Failed to load mock_data.json</span>
    </div>
  );

  const { devices, scan_metadata } = data;
  const criticalCount = devices.filter(d => d.risk_level === "CRITICAL" && d.state === "up").length;
  const highCount = devices.filter(d => d.risk_level === "HIGH" && d.state === "up").length;

  const stats = [
    { label: "Total Devices", value: scan_metadata.total_targets, icon: Wifi, color: "text-primary" },
    { label: "Online", value: scan_metadata.total_up, icon: CheckCircle, color: "text-emerald-400" },
    { label: "High Risk", value: highCount, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Critical", value: criticalCount, icon: XCircle, color: "text-red-400" },
  ];

  const maxBR = Math.max(...devices.map(blastRadius));

  return (
    <div className="space-y-6">
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
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              width="100%"
              style={{ display: "block", cursor: "default" }}
            >
              <defs>
                <filter id="glow-red">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-orange">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-purple">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

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
                    stroke={isCritical ? "rgba(239,68,68,0.5)" : isHigh ? "rgba(249,115,22,0.4)" : "rgba(168,85,247,0.2)"}
                    strokeWidth={isCritical ? 2 : 1.5}
                    strokeDasharray={isCritical ? "6 3" : "4 4"}
                  />
                );
              })}

              {devices.map(device => {
                const pos = POSITIONS[device.id];
                if (!pos) return null;

                const br = blastRadius(device);
                const nodeR = 14 + (br / maxBR) * 22;
                const ringR = nodeR + 6;
                const color = statusColor(device);
                const isCritical = device.risk_level === "CRITICAL" && device.state === "up";
                const filterId = isCritical ? "url(#glow-red)" : device.risk_level === "HIGH" ? "url(#glow-orange)" : "";

                return (
                  <g
                    key={device.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openDrawer(device)}
                  >
                    {isCritical && (
                      <circle
                        cx={pos.x} cy={pos.y} r={ringR}
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        strokeOpacity="0.35"
                        strokeDasharray="3 3"
                      >
                        <animateTransform
                          attributeName="transform" type="rotate"
                          from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`}
                          dur="8s" repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    <circle
                      cx={pos.x} cy={pos.y} r={nodeR}
                      fill={`${color}18`}
                      stroke={color}
                      strokeWidth={isCritical ? 2 : 1.5}
                      filter={filterId}
                    />

                    <text
                      x={pos.x} y={pos.y + 4}
                      textAnchor="middle"
                      fontSize={nodeR * 0.55}
                      fill={color}
                      fontWeight="bold"
                    >
                      {br}
                    </text>

                    <circle
                      cx={pos.x + nodeR - 4} cy={pos.y - nodeR + 4} r={4}
                      fill={color}
                      stroke="#111827"
                      strokeWidth="1.5"
                    />

                    <text
                      x={pos.x} y={pos.y + nodeR + 13}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#9CA3AF"
                    >
                      {device.hostname}
                    </text>

                    <text
                      x={pos.x} y={pos.y + nodeR + 24}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#6B7280"
                    >
                      {device.ip}
                    </text>
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
              <Info size={11} />
              Number inside node = blast radius
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 overflow-y-auto">
          <h2 className="text-sm font-semibold text-foreground mb-4">Blast Radius Ranking</h2>
          <div className="space-y-2">
            {[...devices]
              .sort((a, b) => blastRadius(b) - blastRadius(a))
              .map((device, i) => {
                const br = blastRadius(device);
                const color = statusColor(device);
                return (
                  <button
                    key={device.id}
                    onClick={() => openDrawer(device)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors text-left"
                  >
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
