import { useState } from "react";
import { Wifi, Server, Smartphone, Router, Camera, Thermometer, Lock, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useScanData, Device } from "@/hooks/use-scan-data";

type NodeStatus = "up" | "down" | "warning" | "critical";

const typeIcons: Record<string, typeof Wifi> = {
  Gateway: Router,
  Server: Server,
  Camera: Camera,
  Sensor: Thermometer,
  Mobile: Smartphone,
  Router: Wifi,
};

const riskToStatus = (risk: string, state: string): NodeStatus => {
  if (state === "down") return "down";
  if (risk === "CRITICAL") return "critical";
  if (risk === "HIGH") return "warning";
  return "up";
};

const statusColors: Record<NodeStatus, string> = {
  up: "#10B981",
  warning: "#F59E0B",
  critical: "#EF4444",
  down: "#6B7280",
};

const statusBg: Record<NodeStatus, string> = {
  up: "rgba(16,185,129,0.15)",
  warning: "rgba(245,158,11,0.15)",
  critical: "rgba(239,68,68,0.15)",
  down: "rgba(107,114,128,0.15)",
};

const POSITIONS: Record<string, { x: number; y: number }> = {
  "DEV-001": { x: 75, y: 20 },
  "DEV-002": { x: 88, y: 55 },
  "DEV-003": { x: 50, y: 50 },
  "DEV-004": { x: 28, y: 22 },
  "DEV-005": { x: 78, y: 80 },
  "DEV-006": { x: 18, y: 65 },
  "DEV-007": { x: 55, y: 82 },
  "DEV-008": { x: 30, y: 45 },
};

const CONNECTIONS = [
  ["DEV-003", "DEV-001"],
  ["DEV-003", "DEV-002"],
  ["DEV-003", "DEV-004"],
  ["DEV-003", "DEV-005"],
  ["DEV-003", "DEV-006"],
  ["DEV-003", "DEV-007"],
  ["DEV-003", "DEV-008"],
];

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export default function NetworkMap() {
  const { data, isLoading, isError } = useScanData();
  const [selected, setSelected] = useState<Device | null>(null);

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-primary">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm text-muted-foreground">Loading scan data...</p>
      </div>
    </div>
  );

  if (isError || !data) return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <XCircle size={32} className="text-destructive mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Failed to load mock_data.json from public folder</p>
      </div>
    </div>
  );

  const { devices, scan_metadata } = data;
  const criticalCount = devices.filter(d => d.risk_level === "CRITICAL" && d.state === "up").length;
  const warningCount = devices.filter(d => d.risk_level === "HIGH" && d.state === "up").length;

  const stats = [
    { label: "Total Devices", value: scan_metadata.total_targets, icon: Wifi, color: "text-primary" },
    { label: "Online", value: scan_metadata.total_up, icon: CheckCircle, color: "text-emerald-400" },
    { label: "High Risk", value: warningCount, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Critical", value: criticalCount, icon: XCircle, color: "text-red-400" },
  ];

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
              <h2 className="text-sm font-semibold text-foreground">Live Network Topology</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Scan ID: {scan_metadata.scan_id}</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Last scan: {relativeTime(scan_metadata.timestamp)}
            </span>
          </div>

          <div className="relative rounded-lg border border-border bg-background/50 overflow-hidden" style={{ height: 380 }}>
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              {CONNECTIONS.map(([from, to]) => {
                const a = POSITIONS[from];
                const b = POSITIONS[to];
                if (!a || !b) return null;
                const fDev = devices.find(d => d.id === from);
                const tDev = devices.find(d => d.id === to);
                const hasRisk = fDev?.risk_level === "CRITICAL" || tDev?.risk_level === "CRITICAL";
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={`${a.x}%`} y1={`${a.y}%`}
                    x2={`${b.x}%`} y2={`${b.y}%`}
                    stroke={hasRisk ? "rgba(239,68,68,0.35)" : "rgba(168,85,247,0.25)"}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                );
              })}
            </svg>

            {devices.map(device => {
              const Icon = typeIcons[device.device_type] ?? Wifi;
              const status = riskToStatus(device.risk_level, device.state);
              const pos = POSITIONS[device.id];
              if (!pos) return null;
              const isSelected = selected?.id === device.id;

              return (
                <button
                  key={device.id}
                  onClick={() => setSelected(isSelected ? null : device)}
                  className="absolute flex flex-col items-center gap-1 group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: 10 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-200"
                    style={{
                      background: isSelected ? statusBg[status] : "rgba(30,40,58,0.9)",
                      borderColor: isSelected ? statusColors[status] : "rgba(55,65,81,0.8)",
                      boxShadow: isSelected ? `0 0 16px ${statusColors[status]}60` : "none",
                    }}
                  >
                    <Icon size={18} style={{ color: statusColors[status] }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded">
                    {device.hostname}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 border border-background"
                    style={{ background: statusColors[status], boxShadow: `0 0 6px ${statusColors[status]}` }}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-5 mt-3">
            {Object.entries({ Online: "#10B981", "High Risk": "#F59E0B", Critical: "#EF4444", Offline: "#6B7280" }).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 overflow-y-auto">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            {selected ? "Device Details" : "Select a Node"}
          </h2>
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: statusBg[riskToStatus(selected.risk_level, selected.state)],
                    border: `2px solid ${statusColors[riskToStatus(selected.risk_level, selected.state)]}`,
                  }}
                >
                  {(() => { const Icon = typeIcons[selected.device_type] ?? Wifi; return <Icon size={20} style={{ color: statusColors[riskToStatus(selected.risk_level, selected.state)] }} />; })()}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{selected.hostname}</p>
                  <p className="text-xs text-muted-foreground">{selected.device_type} — {selected.ip}</p>
                </div>
              </div>

              {[
                { label: "Device ID", value: selected.id },
                { label: "MAC", value: selected.mac },
                { label: "Risk Level", value: selected.risk_level },
                { label: "Risk Score", value: `${selected.risk_score}/100` },
                { label: "Firmware", value: selected.firmware },
                { label: "Location", value: selected.location },
                { label: "Last Seen", value: relativeTime(selected.last_seen) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-mono text-foreground">{value}</span>
                </div>
              ))}

              {selected.open_ports.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Open Ports</p>
                  <div className="space-y-1">
                    {selected.open_ports.map(p => (
                      <div key={p.port} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/30 border border-border/50">
                        <span className="font-mono text-xs text-primary">{p.port}/{p.service}</span>
                        <span className="text-xs text-muted-foreground">{p.product} {p.version}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.cves.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">{selected.cves.length} CVE(s) Found</p>
                  {selected.cves.map(c => (
                    <div key={c.cve_id} className="px-2 py-2 rounded bg-red-400/10 border border-red-400/30 mb-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-red-400">{c.cve_id}</span>
                        <span className="text-xs font-bold text-red-400">CVSS {c.cvss_score}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {selected.mitre_mappings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">MITRE ATT&amp;CK</p>
                  {selected.mitre_mappings.map((m, i) => (
                    <div key={i} className="px-2 py-1.5 rounded bg-primary/10 border border-primary/30 mb-1">
                      <div className="flex items-center gap-1.5">
                        <Lock size={11} className="text-primary" />
                        <span className="text-xs font-mono text-primary">{m.technique_id}</span>
                        <span className="text-xs text-foreground">{m.technique_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-4">{m.tactic}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Router size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Click a node on the map<br />to view device details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
