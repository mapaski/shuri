import React, { useState } from "react";
import { AlertTriangle, XCircle, Info, CheckCircle, Clock, Shield, Wifi, Lock, Eye, Loader2, Bug, Terminal, Globe, Radio, Cpu } from "lucide-react";
import { useScanData, Alert, HoneypotAlert } from "@/hooks/use-scan-data";









function HoneypotTrigger() {
  const [status, setStatus] = React.useState<"idle"|"firing"|"done">("idle");
  const [selected, setSelected] = React.useState("fake_telnet");
  const types = [
    { id: "fake_telnet", label: "Telnet" },
    { id: "fake_ssh", label: "SSH" },
    { id: "fake_http_admin", label: "HTTP Admin" },
    { id: "fake_mqtt", label: "MQTT" },
  ];
  async function fire() {
    setStatus("firing");
    try {
      await fetch("http://127.0.0.1:5000/trigger-honeypot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ honeypot_type: selected }),
      });
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }
  return (
    <div className="bg-red-400/5 border border-red-400/30 rounded-xl p-4 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span className="text-sm font-semibold text-red-400">Manual Honeypot Trigger</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button key={t.id} onClick={() => setSelected(t.id)}
            className={selected === t.id ? "px-3 py-1 rounded-lg text-xs border bg-red-400/20 border-red-400/50 text-red-400" : "px-3 py-1 rounded-lg text-xs border border-border text-muted-foreground"}>
            {t.label}
          </button>
        ))}
      </div>
      <button onClick={fire} disabled={status === "firing"}
        className="ml-auto px-4 py-2 rounded-lg bg-red-400/10 border border-red-400/40 text-red-400 text-sm font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50">
        {status === "firing" ? "Firing..." : status === "done" ? "Done!" : "Fire Honeypot"}
      </button>
    </div>
  );
}

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

const honeypotConfig: Record<string, { label: string; icon: typeof Terminal; color: string; bg: string; border: string }> = {
  fake_telnet:       { label: "Telnet",      icon: Terminal, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
  fake_http_admin:   { label: "HTTP Admin",  icon: Globe,    color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/30"  },
  fake_mqtt:         { label: "MQTT",        icon: Radio,    color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
  fake_mqtt_followup:{ label: "MQTT Follow", icon: Radio,    color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30"   },
  fake_ssh:          { label: "SSH",         icon: Cpu,      color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30"    },
};

const honeypotSev: Record<string, typeof severityConfig["critical"]> = {
  HIGH:   severityConfig.high,
  MEDIUM: severityConfig.medium,
  LOW:    severityConfig.low,
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function HoneypotRow({ alert }: { alert: HoneypotAlert }) {
  const [expanded, setExpanded] = useState(false);
  const hp = honeypotConfig[alert.honeypot_type] ?? honeypotConfig.fake_telnet;
  const sev = honeypotSev[alert.severity] ?? honeypotSev.MEDIUM;
  const SevIcon = sev.icon;
  const HpIcon = hp.icon;

  const details: { label: string; value: string }[] = [];
  if (alert.credentials_tried)  details.push({ label: "Credentials tried",  value: alert.credentials_tried });
  if (alert.credentials_posted) details.push({ label: "Credentials posted", value: alert.credentials_posted });
  if (alert.path_accessed)      details.push({ label: "Path accessed",       value: alert.path_accessed });
  if (alert.user_agent)         details.push({ label: "User-Agent",          value: alert.user_agent });
  if (alert.mqtt_client_id)     details.push({ label: "MQTT Client ID",      value: alert.mqtt_client_id });
  if (alert.client_banner)      details.push({ label: "SSH Client Banner",   value: alert.client_banner });
  if (alert.raw_data_hex)       details.push({ label: "Raw (hex)",           value: alert.raw_data_hex });
  if (alert.packet_hex)         details.push({ label: "Packet (hex)",        value: alert.packet_hex });

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${sev.border}`}>
      <button
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={`w-9 h-9 rounded-lg ${sev.bg} flex items-center justify-center flex-shrink-0`}>
          <SevIcon size={16} className={sev.color} />
        </div>

        <div className={`w-8 h-8 rounded-lg ${hp.bg} border ${hp.border} flex items-center justify-center flex-shrink-0`} title={hp.label}>
          <HpIcon size={13} className={hp.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">
              {alert.honeypot_type === "fake_telnet"        && "Telnet Credential Attempt"}
              {alert.honeypot_type === "fake_http_admin"    && (alert.credentials_posted ? "HTTP Admin Login Attempt" : "HTTP Admin Panel Probe")}
              {alert.honeypot_type === "fake_mqtt"          && "MQTT Broker Connection"}
              {alert.honeypot_type === "fake_mqtt_followup" && "MQTT Subscribe/Publish Attempt"}
              {alert.honeypot_type === "fake_ssh"           && "SSH Connection Attempt"}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sev.bg} ${sev.color} ${sev.border}`}>{alert.severity}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${hp.bg} ${hp.color} ${hp.border}`}>{hp.label}:{alert.honeypot_port}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">Attacker: <span className="font-mono text-foreground">{alert.attacker_ip}</span></span>
            <span className="text-xs font-mono text-primary">{(alert.mitre_technique || "T0000").split(":")[0]}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} />{formatTime(alert.timestamp)}</span>
          </div>
        </div>

        {(alert.credentials_tried || alert.credentials_posted) && (
          <span className="text-xs font-mono text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-1 rounded flex-shrink-0">
            {alert.credentials_tried || alert.credentials_posted}
          </span>
        )}
      </button>

      {expanded && details.length > 0 && (
        <div className="px-4 pb-3 border-t border-border/50 pt-3">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {details.map(d => (
              <div key={d.label} className="flex flex-col px-2 py-1.5 rounded bg-background/50 border border-border/50">
                <span className="text-xs text-muted-foreground">{d.label}</span>
                <span className="text-xs font-mono text-foreground mt-0.5 break-all">{d.value}</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 rounded bg-primary/10 border border-primary/30">
            <p className="text-xs font-semibold text-primary mb-0.5">MITRE ATT&amp;CK for IoT</p>
            <p className="text-xs font-mono text-foreground">{alert.mitre_technique || "Unknown Technique"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  const { data, isLoading, isError } = useScanData();
  const [tab, setTab] = useState<"scan" | "honeypot">("scan");
  const [filterSeverity, setFilterSeverity] = useState<Alert["severity"] | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Alert["status"] | "all">("all");
  const [expandedScan, setExpandedScan] = useState<string | null>(null);

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

  const { alerts, honeypot_alerts } = data;

  const statCards = [
    { label: "Scan Critical",    value: alerts.filter(a => a.severity === "critical").length,    color: "text-red-400",    bg: "bg-red-400/10" },
    { label: "Scan High",        value: alerts.filter(a => a.severity === "high").length,        color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Honeypot Hits",    value: honeypot_alerts.length,                                  color: "text-primary",    bg: "bg-primary/10" },
    { label: "Unique Attackers", value: new Set(honeypot_alerts.map(h => h.attacker_ip)).size,   color: "text-amber-400",  bg: "bg-amber-400/10" },
  ];

  const filteredScan = alerts.filter(a => {
    const ms = filterSeverity === "all" || a.severity === filterSeverity;
    const mst = filterStatus === "all" || a.status === filterStatus;
    return ms && mst;
  });

  return (
    <div className="space-y-5">
      <HoneypotTrigger />
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

      <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg w-fit border border-border">
        <button
          onClick={() => setTab("scan")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${tab === "scan" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Shield size={14} />
          Scan Alerts
          <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-red-400/20 text-red-400">{alerts.length}</span>
        </button>
        <button
          onClick={() => setTab("honeypot")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${tab === "honeypot" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Bug size={14} />
          Honeypot Events
          <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary">{honeypot_alerts.length}</span>
        </button>
      </div>

      {tab === "scan" && (
        <>
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
            {filteredScan.map(alert => {
              const sev = severityConfig[alert.severity];
              const st = statusConfig[alert.status] ?? statusConfig["active"];
              const SevIcon = sev.icon;
              const TypeIcon = typeIcons[alert.type] ?? Shield;
              const isExp = expandedScan === alert.id;

              return (
                <div key={alert.id} className={`bg-card border rounded-xl overflow-hidden transition-all ${sev.border} ${alert.status === "resolved" ? "opacity-60" : ""}`}>
                  <button
                    className="w-full flex items-start gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandedScan(isExp ? null : alert.id)}
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
            {filteredScan.length === 0 && (
              <div className="py-16 text-center">
                <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No alerts match your filters</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "honeypot" && (
        <>
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
            <Bug size={16} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Honeypot Trap Events</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real attacker interactions captured by fake Telnet, HTTP Admin, MQTT, and SSH services running in your Colab honeypot.
                Each row is logged directly from <span className="font-mono text-foreground">honeypot_alerts.json</span>.
              </p>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            {["fake_telnet", "fake_http_admin", "fake_mqtt", "fake_mqtt_followup", "fake_ssh"].map(type => {
              const count = honeypot_alerts.filter(h => h.honeypot_type === type).length;
              const hp = honeypotConfig[type];
              const HpIcon = hp.icon;
              return count > 0 ? (
                <div key={type} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${hp.bg} border ${hp.border}`}>
                  <HpIcon size={13} className={hp.color} />
                  <span className="text-xs text-foreground font-medium">{hp.label}</span>
                  <span className={`text-xs font-bold ${hp.color}`}>{count}</span>
                </div>
              ) : null;
            })}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border">
              <Shield size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Unique IPs:</span>
              <span className="text-xs font-bold text-foreground">{new Set(honeypot_alerts.map(h => h.attacker_ip)).size}</span>
            </div>
          </div>

          <div className="space-y-2">
            {honeypot_alerts.map((alert, i) => (
              <HoneypotRow key={i} alert={alert} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
