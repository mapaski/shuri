import { useState } from "react";
import { AlertTriangle, XCircle, Info, CheckCircle, Clock, Shield, Wifi, Lock, Eye, Loader2 } from "lucide-react";
import { useScanData, Alert } from "@/hooks/use-scan-data";

const severityConfig = {
  critical: { icon: XCircle,       color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/40",    label: "Critical" },
  high:     { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/40", label: "High" },
  medium:   { icon: Info,          color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/40",  label: "Medium" },
  low:      { icon: Info,          color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/40",   label: "Low" },
};

const statusConfig = {
  active:        { label: "Active",        className: "text-red-400 bg-red-400/10 border-red-400/30" },
  investigating: { label: "Investigating", className: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  resolved:      { label: "Resolved",      className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
};

const typeIcons: Record<string, typeof Shield> = {
  Intrusion: Lock, Vulnerability: Shield, Credential: Lock,
  Protocol: Wifi, Discovery: Eye, Config: Shield, Availability: Clock,
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export default function Alerts() {
  const { data, isLoading, isError } = useScanData();
  const [filterSeverity, setFilterSeverity] = useState<Alert["severity"] | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Alert["status"] | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const { alerts } = data;

  const statCards = [
    { label: "Critical", value: alerts.filter(a => a.severity === "critical").length, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "High", value: alerts.filter(a => a.severity === "high").length, color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Active", value: alerts.filter(a => a.status === "active").length, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Resolved", value: alerts.filter(a => a.status === "resolved").length, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

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
            <button key={s} onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors
                ${filterSeverity === s ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          {(["all", "active", "investigating", "resolved"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors
                ${filterStatus === s ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"}`}>
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
            <div key={alert.id} className={`bg-card border rounded-xl overflow-hidden transition-all ${sev.border} ${alert.status === "resolved" ? "opacity-60" : ""}`}>
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
                    <span className="text-xs text-muted-foreground">Device: <span className="text-foreground font-mono">{alert.device_name}</span></span>
                    <span className="text-xs font-mono text-muted-foreground">{alert.device_ip}</span>
                    <span className="text-xs font-mono text-primary">{alert.mitre_id} — {alert.mitre_name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} />{formatTime(alert.time)}</span>
                    {alert.count > 1 && <span className="text-xs text-primary font-medium">{alert.count}× occurrences</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono text-muted-foreground">{alert.id}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">OWASP {alert.owasp_category}</p>
                </div>
              </button>

              {isExp && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{alert.description}</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-xs font-semibold text-primary mb-0.5">MITRE ATT&amp;CK for IoT</p>
                      <p className="text-xs text-foreground font-mono">{alert.mitre_id} — {alert.mitre_name}</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">OWASP IoT Top 10</p>
                      <p className="text-xs text-foreground font-mono">{alert.owasp_category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors">Investigate</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/20 transition-colors">Mark Resolved</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors">Suppress</button>
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
