import { useState } from "react";
import { Wifi, Server, Smartphone, Router, Camera, Thermometer, Lock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type NodeType = "gateway" | "server" | "camera" | "sensor" | "mobile" | "router";
type NodeStatus = "online" | "warning" | "critical" | "offline";

interface NetworkNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  ip: string;
  x: number;
  y: number;
  connections: string[];
}

const nodes: NetworkNode[] = [
  { id: "gw1", label: "Gateway-01", type: "gateway", status: "online", ip: "192.168.1.1", x: 50, y: 50, connections: ["srv1", "cam1", "cam2", "sens1", "mob1"] },
  { id: "srv1", label: "MQTT Broker", type: "server", status: "online", ip: "192.168.1.10", x: 20, y: 25, connections: ["sens1", "sens2"] },
  { id: "cam1", label: "Cam-Lobby", type: "camera", status: "warning", ip: "192.168.1.21", x: 75, y: 20, connections: [] },
  { id: "cam2", label: "Cam-Server", type: "camera", status: "critical", ip: "192.168.1.22", x: 80, y: 75, connections: [] },
  { id: "sens1", label: "Temp-A1", type: "sensor", status: "online", ip: "192.168.1.31", x: 25, y: 70, connections: [] },
  { id: "sens2", label: "Temp-B2", type: "sensor", status: "online", ip: "192.168.1.32", x: 10, y: 50, connections: [] },
  { id: "mob1", label: "Mobile-01", type: "mobile", status: "warning", ip: "192.168.1.50", x: 60, y: 85, connections: [] },
  { id: "rtr1", label: "Switch-01", type: "router", status: "online", ip: "192.168.1.2", x: 40, y: 30, connections: ["gw1", "srv1"] },
];

const typeIcons: Record<NodeType, typeof Wifi> = {
  gateway: Router,
  server: Server,
  camera: Camera,
  sensor: Thermometer,
  mobile: Smartphone,
  router: Wifi,
};

const statusColors: Record<NodeStatus, string> = {
  online: "#10B981",
  warning: "#F59E0B",
  critical: "#EF4444",
  offline: "#6B7280",
};

const statusBg: Record<NodeStatus, string> = {
  online: "rgba(16,185,129,0.15)",
  warning: "rgba(245,158,11,0.15)",
  critical: "rgba(239,68,68,0.15)",
  offline: "rgba(107,114,128,0.15)",
};

const stats = [
  { label: "Total Devices", value: "8", icon: Wifi, color: "text-primary" },
  { label: "Online", value: "5", icon: CheckCircle, color: "text-emerald-400" },
  { label: "Warnings", value: "2", icon: AlertTriangle, color: "text-amber-400" },
  { label: "Critical", value: "1", icon: XCircle, color: "text-red-400" },
];

export default function NetworkMap() {
  const [selected, setSelected] = useState<NetworkNode | null>(null);

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
            <h2 className="text-sm font-semibold text-foreground">Live Network Topology</h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <div
            className="relative rounded-lg border border-border bg-background/50 overflow-hidden"
            style={{ height: 380 }}
          >
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              {nodes.map(node =>
                node.connections.map(targetId => {
                  const target = nodes.find(n => n.id === targetId);
                  if (!target) return null;
                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke="rgba(168,85,247,0.25)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  );
                })
              )}
            </svg>
            {nodes.map(node => {
              const Icon = typeIcons[node.type];
              const isSelected = selected?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelected(isSelected ? null : node)}
                  className="absolute flex flex-col items-center gap-1 group"
                  style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)", zIndex: 10 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-200"
                    style={{
                      background: isSelected ? statusBg[node.status] : "rgba(30,40,58,0.9)",
                      borderColor: isSelected ? statusColors[node.status] : "rgba(55,65,81,0.8)",
                      boxShadow: isSelected ? `0 0 16px ${statusColors[node.status]}60` : "none",
                    }}
                  >
                    <Icon size={18} style={{ color: statusColors[node.status] }} />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded text-[10px]">
                    {node.label}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 border border-background"
                    style={{ background: statusColors[node.status], boxShadow: `0 0 6px ${statusColors[node.status]}` }}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {status}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            {selected ? "Node Details" : "Select a Node"}
          </h2>
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: statusBg[selected.status], border: `2px solid ${statusColors[selected.status]}` }}
                >
                  {(() => { const Icon = typeIcons[selected.type]; return <Icon size={20} style={{ color: statusColors[selected.status] }} />; })()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selected.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selected.type}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "IP Address", value: selected.ip },
                  { label: "Status", value: selected.status.toUpperCase() },
                  { label: "Connections", value: selected.connections.length.toString() },
                  { label: "Node ID", value: selected.id.toUpperCase() },
                  { label: "Protocol", value: "MQTT / TLS 1.3" },
                  { label: "Last Seen", value: "2 sec ago" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-mono text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={12} className="text-primary" />
                  <span className="text-xs text-muted-foreground">Encryption</span>
                </div>
                <p className="text-xs text-foreground font-mono">AES-256-GCM enabled</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Router size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Click a node on the<br />map to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
