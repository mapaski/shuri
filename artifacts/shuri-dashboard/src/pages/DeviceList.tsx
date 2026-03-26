import { useState } from "react";
import { Search, Filter, Cpu, Camera, Thermometer, Smartphone, Router, Server, ChevronUp, ChevronDown, Loader2, XCircle, Shield, ChevronRight } from "lucide-react";
import { useScanData, Device } from "@/hooks/use-scan-data";

const typeIcons: Record<string, typeof Cpu> = {
  Camera: Camera, Sensor: Thermometer, Gateway: Router,
  Mobile: Smartphone, Server: Server, Router: Router,
};

const riskConfig = {
  CRITICAL: { label: "Critical", className: "text-red-400 bg-red-400/10 border-red-400/30", dot: "status-dot-critical" },
  HIGH:     { label: "High",     className: "text-orange-400 bg-orange-400/10 border-orange-400/30", dot: "status-dot-warning" },
  MEDIUM:   { label: "Medium",   className: "text-amber-400 bg-amber-400/10 border-amber-400/30", dot: "status-dot-warning" },
  LOW:      { label: "Low",      className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", dot: "status-dot-online" },
};

const stateConfig = {
  up:   { label: "Online",  dot: "status-dot-online" },
  down: { label: "Offline", dot: "status-dot-offline" },
};

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export default function DeviceList() {
  const { data, isLoading, isError } = useScanData();
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Device>("risk_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );
  if (isError || !data) return (
    <div className="h-64 flex items-center justify-center">
      <XCircle size={24} className="text-destructive mr-2" />
      <span className="text-sm text-muted-foreground">Failed to load scan data</span>
    </div>
  );

  const { devices } = data;

  const filtered = devices
    .filter(d => {
      const ms = d.hostname.toLowerCase().includes(search.toLowerCase()) ||
        d.ip.includes(search) || d.id.toLowerCase().includes(search.toLowerCase());
      const mr = filterRisk === "all" || d.risk_level === filterRisk;
      return ms && mr;
    })
    .sort((a, b) => {
      const va = String((a as Record<string, unknown>)[sortField as string]);
      const vb = String((b as Record<string, unknown>)[sortField as string]);
      if (sortField === "risk_score") {
        return sortDir === "asc" ? a.risk_score - b.risk_score : b.risk_score - a.risk_score;
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const handleSort = (field: keyof Device) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: keyof Device }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-muted-foreground/40" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  };

  const counts = { all: devices.length, CRITICAL: devices.filter(d => d.risk_level === "CRITICAL").length, HIGH: devices.filter(d => d.risk_level === "HIGH").length, MEDIUM: devices.filter(d => d.risk_level === "MEDIUM").length, LOW: devices.filter(d => d.risk_level === "LOW").length };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm flex-1 max-w-sm">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hostname, IP, or ID..."
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          {(["all", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors
                ${filterRisk === r ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {r === "all" ? "All" : r} {r !== "all" && <span className="ml-1 opacity-70">({counts[r]})</span>}
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
                  { key: "id", label: "ID" }, { key: "hostname", label: "Hostname" },
                  { key: "device_type", label: "Type" }, { key: "ip", label: "IP" },
                  { key: "state", label: "State" }, { key: "risk_level", label: "Risk" },
                  { key: "risk_score", label: "Score" }, { key: "open_ports", label: "Ports" },
                  { key: "cves", label: "CVEs" }, { key: "firmware", label: "Firmware" },
                  { key: "last_seen", label: "Last Seen" },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof Device)}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1">{col.label}<SortIcon field={col.key as keyof Device} /></div>
                  </th>
                ))}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((device, i) => {
                const Icon = typeIcons[device.device_type] ?? Cpu;
                const rc = riskConfig[device.risk_level];
                const sc = stateConfig[device.state];
                const isExp = expanded === device.id;

                return (
                  <>
                    <tr
                      key={device.id}
                      className={`border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-background/20"}`}
                      onClick={() => setExpanded(isExp ? null : device.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{device.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Icon size={13} className="text-primary" />
                          </div>
                          <span className="font-medium text-foreground text-xs">{device.hostname}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{device.device_type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{device.ip}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          <span className={device.state === "up" ? "text-emerald-400" : "text-muted-foreground"}>{sc.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${rc.className}`}>{rc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${device.risk_score}%`,
                                background: device.risk_score > 80 ? "#EF4444" : device.risk_score > 50 ? "#F59E0B" : "#10B981",
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{device.risk_score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">{device.open_ports.length}</td>
                      <td className="px-4 py-3">
                        {device.cves.length > 0
                          ? <span className="text-red-400 font-bold text-xs">{device.cves.length}</span>
                          : <span className="text-emerald-400 text-xs">0</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{device.firmware}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{relativeTime(device.last_seen)}</td>
                      <td className="px-4 py-3">
                        <ChevronRight size={14} className={`text-muted-foreground transition-transform ${isExp ? "rotate-90" : ""}`} />
                      </td>
                    </tr>
                    {isExp && (
                      <tr key={`${device.id}-exp`} className="bg-muted/10 border-b border-border/50">
                        <td colSpan={12} className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Open Ports</p>
                              {device.open_ports.length > 0 ? device.open_ports.map(p => (
                                <div key={p.port} className="flex items-center justify-between px-2 py-1.5 rounded bg-background/50 border border-border/50 mb-1">
                                  <span className="font-mono text-xs text-primary">{p.port}/{p.service}</span>
                                  <span className="text-xs text-muted-foreground">{p.product} {p.version}</span>
                                </div>
                              )) : <p className="text-xs text-muted-foreground">No open ports detected</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">CVEs</p>
                              {device.cves.length > 0 ? device.cves.map(c => (
                                <div key={c.cve_id} className="px-2 py-2 rounded bg-red-400/10 border border-red-400/30 mb-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-red-400">{c.cve_id}</span>
                                    <span className="text-xs font-bold text-red-400">CVSS {c.cvss_score}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                                </div>
                              )) : <p className="text-xs text-muted-foreground">No known CVEs</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">MITRE ATT&amp;CK Mappings</p>
                              {device.mitre_mappings.length > 0 ? device.mitre_mappings.map((m, mi) => (
                                <div key={mi} className="px-2 py-1.5 rounded bg-primary/10 border border-primary/30 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <Shield size={10} className="text-primary" />
                                    <span className="text-xs font-mono text-primary">{m.technique_id}</span>
                                    <span className="text-xs text-foreground">{m.technique_name}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 ml-4">{m.tactic} — {m.description}</p>
                                </div>
                              )) : <p className="text-xs text-muted-foreground">No MITRE mappings</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
          <span className="font-mono">Scan: {data.scan_metadata.scan_id}</span>
        </div>
      </div>
    </div>
  );
}
