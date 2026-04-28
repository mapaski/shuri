import { useState } from "react";
import { Search, Filter, Cpu, Camera, Thermometer, Smartphone, Router, Server, ChevronUp, ChevronDown, Loader2, XCircle, Shield, ChevronRight, AlertTriangle } from "lucide-react";
import { useScanData, Device } from "@/hooks/use-scan-data";
import { useDeviceDrawer } from "@/context/device-drawer-context";

const typeIcons: Record<string, typeof Cpu> = {
  Camera, Sensor: Thermometer, Gateway: Router, Mobile: Smartphone, Server, Router,
};

const riskConfig = {
  CRITICAL: { label: "Critical", className: "text-red-400 bg-red-400/10 border-red-400/30" },
  HIGH:     { label: "High",     className: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  MEDIUM:   { label: "Medium",   className: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  LOW:      { label: "Low",      className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
};

interface ProtocolBadge { label: string; className: string; title: string }

function getProtocolBadges(device: Device): ProtocolBadge[] {
  const badges: ProtocolBadge[] = [];
  const ports = device.open_ports.map(p => p.port);
  const issues = device.issues;

  if (ports.includes(23) || issues.includes("open_telnet") || issues.includes("telnet_open"))
    badges.push({ label: "Telnet", className: "text-red-400 bg-red-400/10 border-red-400/40", title: "Unencrypted Telnet (port 23) — critical risk" });
  if (issues.includes("default_credentials") || issues.includes("default_password"))
    badges.push({ label: "Default Creds", className: "text-red-400 bg-red-400/10 border-red-400/40", title: "Factory default username/password in use" });
  if (ports.includes(80) || issues.includes("unencrypted_http"))
    badges.push({ label: "HTTP", className: "text-orange-400 bg-orange-400/10 border-orange-400/40", title: "Plaintext HTTP interface — no TLS" });
  if (device.cipher_suite?.weak_tls)
    badges.push({ label: device.cipher_suite.tls_version, className: "text-amber-400 bg-amber-400/10 border-amber-400/40", title: `Deprecated TLS version: ${device.cipher_suite.tls_version}` });
  if (device.cipher_suite?.weak_cipher)
    badges.push({ label: "Weak Cipher", className: "text-amber-400 bg-amber-400/10 border-amber-400/40", title: `Weak cipher: ${device.cipher_suite.cipher_name}` });
  if (issues.includes("upnp_enabled"))
    badges.push({ label: "UPnP", className: "text-amber-400 bg-amber-400/10 border-amber-400/40", title: "UPnP enabled — device discovery risk" });
  if (issues.includes("outdated_firmware") || issues.includes("outdated_software"))
    badges.push({ label: "Outdated", className: "text-blue-400 bg-blue-400/10 border-blue-400/40", title: "Outdated firmware/software with known CVEs" });

  return badges;
}

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export default function DeviceList() {
  const { data, isLoading, isError } = useScanData();
  const { openDrawer } = useDeviceDrawer();
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Device>("risk_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
      if (sortField === "risk_score") return sortDir === "asc" ? a.risk_score - b.risk_score : b.risk_score - a.risk_score;
      const va = String((a as Record<string, unknown>)[sortField as string]);
      const vb = String((b as Record<string, unknown>)[sortField as string]);
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

  const counts = {
    all: devices.length,
    CRITICAL: devices.filter(d => d.risk_level === "CRITICAL").length,
    HIGH:     devices.filter(d => d.risk_level === "HIGH").length,
    MEDIUM:   devices.filter(d => d.risk_level === "MEDIUM").length,
    LOW:      devices.filter(d => d.risk_level === "LOW").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hostname, IP, or ID..."
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          
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
                  { key: "risk_score", label: "Score" },
                ].map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key as keyof Device)}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none">
                    <div className="flex items-center gap-1">{col.label}<SortIcon field={col.key as keyof Device} /></div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protocol Badges</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cipher</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">CVEs</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Seen</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((device, i) => {
                const Icon = typeIcons[device.device_type] ?? Cpu;
                const rc = riskConfig[device.risk_level];
                const badges = getProtocolBadges(device);
                const cs = device.cipher_suite;

                return (
                  <tr
                    key={device.id}
                    className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-background/20"}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{device.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon size={13} className="text-primary" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground text-xs block">{device.hostname}</span>
                          <span className="text-xs text-muted-foreground">{device.device_type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{device.device_type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{device.ip}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${device.state === "up" ? "bg-emerald-400" : "bg-gray-500"}`} />
                        <span className={device.state === "up" ? "text-emerald-400" : "text-muted-foreground"}>{device.state === "up" ? "Online" : "Offline"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${rc.className}`}>{rc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${device.risk_score}%`,
                            background: device.risk_score > 80 ? "#EF4444" : device.risk_score > 50 ? "#F59E0B" : "#10B981",
                          }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{device.risk_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {badges.length > 0 ? badges.map((b, bi) => (
                          <span key={bi} title={b.title} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${b.className}`}>
                            <AlertTriangle size={9} />
                            {b.label}
                          </span>
                        )) : (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Clean
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {cs ? (
                        <div className="text-xs space-y-0.5">
                          <div className={`font-mono ${cs.weak_tls ? "text-red-400" : "text-emerald-400"}`}>{cs.tls_version}</div>
                          <div className="text-muted-foreground text-xs">{cs.key_bits}-bit</div>
                          {cs.risk_flags.map(f => (
                            <span key={f} className="block font-mono text-red-400 text-xs">{f}</span>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-xs ${device.open_ports.some(p => p.port === 443 || p.port === 8883) ? "text-muted-foreground" : "text-red-400"}`}>
                          {device.open_ports.some(p => p.port === 443 || p.port === 8883) ? "Not captured" : "No TLS"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {device.cves.length > 0
                        ? <span className="text-red-400 font-bold text-xs">{device.cves.length}</span>
                        : <span className="text-emerald-400 text-xs">0</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{relativeTime(device.last_seen)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDrawer(device)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        Inspect <ChevronRight size={11} />
                      </button>
                    </td>
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
          <span className="font-mono">{data.scan_metadata.scan_id}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-xs text-muted-foreground">
        <Shield size={13} className="text-primary mt-0.5 flex-shrink-0" />
        <span>Click <span className="text-primary font-medium">Inspect</span> on any device to open the detail panel — shows HTTP banner, cipher suite analysis, CVEs, and MITRE ATT&CK mappings.</span>
      </div>
    </div>
  );
}
