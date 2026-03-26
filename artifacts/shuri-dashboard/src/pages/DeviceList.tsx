import { useState } from "react";
import { Search, Filter, Cpu, Camera, Thermometer, Smartphone, Router, Server, ChevronUp, ChevronDown } from "lucide-react";

type Status = "online" | "warning" | "critical" | "offline";
type DeviceType = "Camera" | "Sensor" | "Gateway" | "Mobile" | "Server" | "Router";

interface Device {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  mac: string;
  status: Status;
  lastSeen: string;
  firmware: string;
  threats: number;
  location: string;
}

const devices: Device[] = [
  { id: "DEV-001", name: "Cam-Lobby-01", type: "Camera", ip: "192.168.1.21", mac: "AA:BB:CC:11:22:33", status: "warning", lastSeen: "2s ago", firmware: "v2.1.4", threats: 2, location: "Building A" },
  { id: "DEV-002", name: "Cam-Server-01", type: "Camera", ip: "192.168.1.22", mac: "AA:BB:CC:11:22:44", status: "critical", lastSeen: "5s ago", firmware: "v2.0.1", threats: 5, location: "Server Room" },
  { id: "DEV-003", name: "Gateway-Main", type: "Gateway", ip: "192.168.1.1", mac: "AA:BB:CC:00:11:22", status: "online", lastSeen: "1s ago", firmware: "v4.3.2", threats: 0, location: "NOC" },
  { id: "DEV-004", name: "MQTT-Broker", type: "Server", ip: "192.168.1.10", mac: "AA:BB:CC:00:22:33", status: "online", lastSeen: "1s ago", firmware: "v3.5.0", threats: 0, location: "Server Room" },
  { id: "DEV-005", name: "Temp-A1", type: "Sensor", ip: "192.168.1.31", mac: "AA:BB:CC:33:44:55", status: "online", lastSeen: "10s ago", firmware: "v1.0.3", threats: 0, location: "Floor 1" },
  { id: "DEV-006", name: "Temp-B2", type: "Sensor", ip: "192.168.1.32", mac: "AA:BB:CC:33:44:66", status: "online", lastSeen: "8s ago", firmware: "v1.0.3", threats: 0, location: "Floor 2" },
  { id: "DEV-007", name: "Mobile-Admin", type: "Mobile", ip: "192.168.1.50", mac: "AA:BB:CC:55:66:77", status: "warning", lastSeen: "45s ago", firmware: "Android 14", threats: 1, location: "Mobile" },
  { id: "DEV-008", name: "Switch-01", type: "Router", ip: "192.168.1.2", mac: "AA:BB:CC:00:33:44", status: "online", lastSeen: "1s ago", firmware: "v6.1.0", threats: 0, location: "NOC" },
  { id: "DEV-009", name: "Cam-Exit-02", type: "Camera", ip: "192.168.1.23", mac: "AA:BB:CC:11:33:55", status: "offline", lastSeen: "5m ago", firmware: "v2.1.4", threats: 0, location: "Exit B" },
  { id: "DEV-010", name: "Pressure-C3", type: "Sensor", ip: "192.168.1.33", mac: "AA:BB:CC:33:55:77", status: "online", lastSeen: "3s ago", firmware: "v1.2.0", threats: 0, location: "Floor 3" },
];

const typeIcons: Record<DeviceType, typeof Cpu> = {
  Camera: Camera,
  Sensor: Thermometer,
  Gateway: Router,
  Mobile: Smartphone,
  Server: Server,
  Router: Router,
};

const statusConfig: Record<Status, { label: string; className: string; dot: string }> = {
  online: { label: "Online", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", dot: "status-dot-online" },
  warning: { label: "Warning", className: "text-amber-400 bg-amber-400/10 border-amber-400/30", dot: "status-dot-warning" },
  critical: { label: "Critical", className: "text-red-400 bg-red-400/10 border-red-400/30", dot: "status-dot-critical" },
  offline: { label: "Offline", className: "text-gray-400 bg-gray-400/10 border-gray-400/30", dot: "status-dot-offline" },
};

export default function DeviceList() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [sortField, setSortField] = useState<keyof Device>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = devices
    .filter(d => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.ip.includes(search) || d.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || d.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const va = String(a[sortField]);
      const vb = String(b[sortField]);
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const handleSort = (field: keyof Device) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: keyof Device }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-muted-foreground/40" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  };

  const counts = { all: devices.length, online: devices.filter(d => d.status === "online").length, warning: devices.filter(d => d.status === "warning").length, critical: devices.filter(d => d.status === "critical").length, offline: devices.filter(d => d.status === "offline").length };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm flex-1 max-w-sm">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, IP, or ID..."
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          {(["all", "online", "warning", "critical", "offline"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors
                ${filterStatus === s
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border"
                }`}
            >
              {s} {s !== "all" && <span className="ml-1 opacity-70">({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {[
                  { key: "id", label: "Device ID" },
                  { key: "name", label: "Name" },
                  { key: "type", label: "Type" },
                  { key: "ip", label: "IP Address" },
                  { key: "status", label: "Status" },
                  { key: "threats", label: "Threats" },
                  { key: "firmware", label: "Firmware" },
                  { key: "lastSeen", label: "Last Seen" },
                  { key: "location", label: "Location" },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof Device)}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.key as keyof Device} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((device, i) => {
                const Icon = typeIcons[device.type];
                const sc = statusConfig[device.status];
                return (
                  <tr key={device.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-background/20"}`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{device.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon size={13} className="text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{device.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{device.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{device.ip}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {device.threats > 0 ? (
                        <span className="text-red-400 font-semibold">{device.threats}</span>
                      ) : (
                        <span className="text-emerald-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{device.firmware}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{device.lastSeen}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{device.location}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No devices match your filters</div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>Showing {filtered.length} of {devices.length} devices</span>
          <span className="font-mono">Last sync: just now</span>
        </div>
      </div>
    </div>
  );
}
