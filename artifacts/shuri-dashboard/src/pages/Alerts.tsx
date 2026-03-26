import { useState } from "react";
import { AlertTriangle, XCircle, Info, CheckCircle, Clock, Shield, Wifi, Lock, Eye } from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low";
type AlertStatus = "active" | "investigating" | "resolved";

interface Alert {
  id: string;
  title: string;
  description: string;
  device: string;
  ip: string;
  severity: Severity;
  status: AlertStatus;
  type: string;
  time: string;
  count: number;
}

const alerts: Alert[] = [
  { id: "ALT-001", title: "Unauthorized Access Attempt", description: "Multiple failed SSH login attempts detected from external IP. Brute force attack pattern identified.", device: "Cam-Server-01", ip: "192.168.1.22", severity: "critical", status: "active", type: "Intrusion", time: "2 min ago", count: 47 },
  { id: "ALT-002", title: "Anomalous Traffic Volume", description: "Camera device transmitting 10x normal data volume. Possible data exfiltration in progress.", device: "Cam-Lobby-01", ip: "192.168.1.21", severity: "high", status: "investigating", type: "Exfiltration", time: "8 min ago", count: 1 },
  { id: "ALT-003", title: "Outdated Firmware Detected", description: "Device running firmware v2.0.1 with known CVE-2023-4521 vulnerability. Patch available.", device: "Cam-Server-01", ip: "192.168.1.22", severity: "high", status: "active", type: "Vulnerability", time: "15 min ago", count: 1 },
  { id: "ALT-004", title: "Unencrypted Communication", description: "Mobile device communicating over plain HTTP on port 80. TLS not enforced.", device: "Mobile-Admin", ip: "192.168.1.50", severity: "medium", status: "investigating", type: "Protocol", time: "32 min ago", count: 12 },
  { id: "ALT-005", title: "Certificate Expiry Warning", description: "TLS certificate for MQTT broker expires in 7 days. Renewal required to maintain secure comms.", device: "MQTT-Broker", ip: "192.168.1.10", severity: "medium", status: "active", type: "Certificate", time: "1 hr ago", count: 1 },
  { id: "ALT-006", title: "Device Offline Unexpectedly", description: "Exit camera went offline without graceful shutdown. Physical tamper may have occurred.", device: "Cam-Exit-02", ip: "192.168.1.23", severity: "medium", status: "active", type: "Availability", time: "5 min ago", count: 1 },
  { id: "ALT-007", title: "Port Scan Detected", description: "Systematic port scanning from internal IP detected. Device may be compromised.", device: "Gateway-Main", ip: "192.168.1.1", severity: "high", status: "active", type: "Reconnaissance", time: "22 min ago", count: 834 },
  { id: "ALT-008", title: "Config Change Without Auth", description: "Sensor configuration modified without going through authenticated management channel.", device: "Temp-A1", ip: "192.168.1.31", severity: "low", status: "resolved", type: "Config", time: "2 hr ago", count: 1 },
];

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/40", label: "Critical" },
  high: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/40", label: "High" },
  medium: { icon: Info, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/40", label: "Medium" },
  low: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/40", label: "Low" },
};

const statusConfig: Record<AlertStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "text-red-400 bg-red-400/10 border-red-400/30" },
  investigating: { label: "Investigating", className: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  resolved: { label: "Resolved", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
};

const typeIcons: Record<string, typeof Shield> = {
  Intrusion: Lock, Exfiltration: Wifi, Vulnerability: Shield,
  Protocol: Eye, Certificate: Shield, Availability: Clock,
  Reconnaissance: Eye, Config: Shield,
};

const statCards = [
  { label: "Critical", value: alerts.filter(a => a.severity === "critical").length, color: "text-red-400", bg: "bg-red-400/10" },
  { label: "High", value: alerts.filter(a => a.severity === "high").length, color: "text-orange-400", bg: "bg-orange-400/10" },
  { label: "Active", value: alerts.filter(a => a.status === "active").length, color: "text-amber-400", bg: "bg-amber-400/10" },
  { label: "Resolved", value: alerts.filter(a => a.status === "resolved").length, color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

export default function Alerts() {
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterStatus, setFilterStatus] = useState<AlertStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = alerts.filter(a => {
    const ms = filterSeverity === "all" || a.severity === filterSeverity;
    const mst = filterStatus === "all" || a.status === filterStatus;
    return ms && mst;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <AlertTriangle size={18} className={color} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Severity:</span>
          {(["all", "critical", "high", "medium", "low"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors
                ${filterSeverity === s ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          {(["all", "active", "investigating", "resolved"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors
                ${filterStatus === s ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(alert => {
          const sev = severityConfig[alert.severity];
          const st = statusConfig[alert.status];
          const SevIcon = sev.icon;
          const TypeIcon = typeIcons[alert.type] ?? Shield;
          const isExp = expanded === alert.id;

          return (
            <div
              key={alert.id}
              className={`bg-card border rounded-xl overflow-hidden transition-all ${sev.border} ${alert.status === "resolved" ? "opacity-60" : ""}`}
            >
              <button
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isExp ? null : alert.id)}
              >
                <div className={`w-10 h-10 rounded-lg ${sev.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <SevIcon size={18} className={sev.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{alert.title}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sev.bg} ${sev.color} ${sev.border}`}>{sev.label}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st.className}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><TypeIcon size={11} />{alert.type}</span>
                    <span className="text-xs text-muted-foreground">Device: <span className="text-foreground font-mono">{alert.device}</span></span>
                    <span className="text-xs text-muted-foreground font-mono">{alert.ip}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} />{alert.time}</span>
                    {alert.count > 1 && <span className="text-xs text-primary font-medium">{alert.count} occurrences</span>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{alert.id}</span>
              </button>

              {isExp && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors">
                      Investigate
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/20 transition-colors">
                      Mark Resolved
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors">
                      Suppress
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No alerts match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
