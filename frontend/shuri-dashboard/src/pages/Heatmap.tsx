import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Loader2, XCircle, AlertTriangle } from "lucide-react";
import { useScanData, Device } from "@/hooks/use-scan-data";
import { useDeviceDrawer } from "@/context/device-drawer-context";

const OWASP_COLS = ["I1","I2","I3","I4","I5","I7","I9"] as const;
const OWASP_LABELS: Record<string, string> = {
  I1: "Passwords", I2: "Net Svc", I3: "Interfaces",
  I4: "Updates", I5: "Components", I7: "Encryption", I9: "Defaults",
};

const ISSUE_TO_OWASP: Record<string, string> = {
  default_credentials: "I1", default_password: "I1",
  open_telnet: "I2", telnet_open: "I2",
  http_no_auth: "I3", unencrypted_http: "I3",
  outdated_firmware: "I4",
  outdated_software: "I5", old_software: "I5",
  weak_cipher: "I7", unencrypted_traffic: "I7",
  upnp_enabled: "I9",
};

function blastRadius(d: Device): number {
  return (d as any).blast_radius ?? 0;
}

function riskTileScore(device: Device, owaspId: string): number {
  const issuesInCat = device.issues.filter(i => ISSUE_TO_OWASP[i] === owaspId);
  if (issuesInCat.length === 0) return 0;
  const maxCvss = device.cves.length > 0 ? Math.max(...device.cves.map(c => c.cvss_score)) : 5;
  const br = blastRadius(device);
  return Math.min(100, Math.round((maxCvss * br) * 1.2));
}

function tileColor(score: number): string {
  if (score === 0)   return "rgba(168,85,247,0.04)";
  if (score < 20)    return "rgba(168,85,247,0.20)";
  if (score < 40)    return "rgba(249,115,22,0.35)";
  if (score < 65)    return "rgba(239,68,68,0.50)";
  return              "rgba(239,68,68,0.85)";
}

function tileBorder(score: number): string {
  if (score === 0)  return "rgba(55,65,81,0.4)";
  if (score < 20)   return "rgba(168,85,247,0.3)";
  if (score < 40)   return "rgba(249,115,22,0.4)";
  return             "rgba(239,68,68,0.5)";
}

export default function Heatmap() {
  const { data, isLoading, isError } = useScanData();
  const { openDrawer } = useDeviceDrawer();

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );
  if (isError || !data) return (
    <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
      <XCircle size={18} className="text-destructive mr-2" /> Failed to load scan data
    </div>
  );

  const { heatmap, devices } = data;
  const { traffic_by_hour, device_traffic } = heatmap;

  const anomalyHours = traffic_by_hour.filter(h => h.anomalies > 0);

  const devicesSorted = [...devices].sort((a, b) => blastRadius(b) - blastRadius(a));

  return (
    <div className="space-y-6">
      {anomalyHours.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-400/10 border border-red-400/30 rounded-xl">
          <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Anomalous Traffic Detected</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unusual outbound spike at {anomalyHours.map(h => h.hour).join(", ")}. Peak outbound reached{" "}
              <span className="text-red-400 font-mono">14,300 KB/s</span> — possible data exfiltration from ipcam-server.
            </p>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Risk Tile Matrix — CVSS × Blast Radius</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Each cell = CVSS score × device blast radius per OWASP category · click to inspect device</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {[
              { label: "None", color: "rgba(168,85,247,0.04)", border: "rgba(55,65,81,0.4)" },
              { label: "Low",  color: "rgba(168,85,247,0.20)", border: "rgba(168,85,247,0.3)" },
              { label: "Med",  color: "rgba(249,115,22,0.35)", border: "rgba(249,115,22,0.4)" },
              { label: "High", color: "rgba(239,68,68,0.50)",  border: "rgba(239,68,68,0.5)" },
              { label: "Crit", color: "rgba(239,68,68,0.85)",  border: "rgba(239,68,68,0.5)" },
            ].map(({ label, color, border }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="w-5 h-4 rounded-sm border" style={{ background: color, borderColor: border }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left px-2 py-1 text-xs text-muted-foreground font-normal w-36">Device</th>
                {OWASP_COLS.map(col => (
                  <th key={col} className="px-2 py-1 text-center">
                    <div className="text-xs font-bold text-primary">{col}</div>
                    <div className="text-xs text-muted-foreground font-normal">{OWASP_LABELS[col]}</div>
                  </th>
                ))}
                <th className="px-2 py-1 text-center text-xs text-muted-foreground font-normal">BR</th>
                <th className="px-2 py-1 text-center text-xs text-muted-foreground font-normal">Risk</th>
              </tr>
            </thead>
            <tbody>
              {devicesSorted.map(device => {
                const br = blastRadius(device);
                return (
                  <tr key={device.id}>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => openDrawer(device)}
                        className="text-left hover:text-primary transition-colors"
                      >
                        <div className="text-xs font-medium text-foreground truncate max-w-[130px]">{device.hostname}</div>
                        <div className="text-xs font-mono text-muted-foreground">{device.ip}</div>
                      </button>
                    </td>
                    {OWASP_COLS.map(col => {
                      const score = riskTileScore(device, col);
                      return (
                        <td key={col} className="px-1 py-1 text-center">
                          <button
                            onClick={() => openDrawer(device)}
                            className="w-full h-10 rounded-md flex items-center justify-center transition-all hover:ring-1 hover:ring-primary/60"
                            style={{ background: tileColor(score), border: `1px solid ${tileBorder(score)}` }}
                            title={`${device.hostname} — ${col}: score ${score}`}
                          >
                            {score > 0 && (
                              <span className="text-xs font-bold text-white/90">{score}</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-center">
                      <span className="text-xs font-bold font-mono text-primary">{br}/10</span>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold border
                        ${device.risk_level === "CRITICAL" ? "text-red-400 bg-red-400/10 border-red-400/30" :
                          device.risk_level === "HIGH"     ? "text-orange-400 bg-orange-400/10 border-orange-400/30" :
                          device.risk_level === "MEDIUM"   ? "text-amber-400 bg-amber-400/10 border-amber-400/30" :
                                                             "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"}`}>
                        {device.risk_level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">24-Hour Traffic Flow</h2>
          <p className="text-xs text-muted-foreground mb-4">Inbound vs. Outbound (KB/s) — today</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={traffic_by_hour}>
              <defs>
                <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: "#6B7280", fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#E5E7EB" }} />
              <Area type="monotone" dataKey="inbound" stroke="#A855F7" strokeWidth={2} fill="url(#inGrad)" name="Inbound" />
              <Area type="monotone" dataKey="outbound" stroke="#EF4444" strokeWidth={2} fill="url(#outGrad)" name="Outbound" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Per-Device Traffic</h2>
          <p className="text-xs text-muted-foreground mb-4">Total KB today · hover for details</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={device_traffic} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="device" tick={{ fill: "#9CA3AF", fontSize: 9 }} tickLine={false} axisLine={false} width={90} />
              <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#E5E7EB" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
              <Bar dataKey="inbound"  fill="#A855F7" radius={[0, 3, 3, 0]} name="Inbound" />
              <Bar dataKey="outbound" fill="#EF4444" radius={[0, 3, 3, 0]} name="Outbound" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
