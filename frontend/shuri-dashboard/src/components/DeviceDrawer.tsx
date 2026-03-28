import { X, Shield, Lock, Wifi, Server, Camera, Thermometer, Smartphone, Router, AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { useDeviceDrawer } from "@/context/device-drawer-context";
import { Device } from "@/hooks/use-scan-data";

const typeIcons: Record<string, typeof Wifi> = {
  Gateway: Router, Server, Camera, Sensor: Thermometer, Mobile: Smartphone,
};

const riskColors: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH:     "text-orange-400",
  MEDIUM:   "text-amber-400",
  LOW:      "text-emerald-400",
};

const riskBg: Record<string, string> = {
  CRITICAL: "bg-red-400/10 border-red-400/30",
  HIGH:     "bg-orange-400/10 border-orange-400/30",
  MEDIUM:   "bg-amber-400/10 border-amber-400/30",
  LOW:      "bg-emerald-400/10 border-emerald-400/30",
};

const PORT_RISK: Record<number, string> = {
  23: "Telnet — unencrypted, critical risk",
  80: "HTTP — plaintext web interface",
  8080: "HTTP Proxy — plaintext",
  554: "RTSP — unauthenticated video stream risk",
  1883: "MQTT — may lack auth/TLS",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, mono = false, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-xs text-right ${mono ? "font-mono" : ""} ${color ?? "text-foreground"}`}>{value}</span>
    </div>
  );
}

export default function DeviceDrawer() {
  const { selectedDevice: d, closeDrawer } = useDeviceDrawer();

  if (!d) return null;

  const Icon = typeIcons[d.device_type] ?? Wifi;
  const rc = riskColors[d.risk_level];
  const rb = riskBg[d.risk_level];

  const tlsRisk = d.cipher_suite?.risk_level ?? null;
  const tlsBg = tlsRisk === "HIGH" ? "bg-red-400/10 border-red-400/40" :
                tlsRisk === "LOW"  ? "bg-emerald-400/10 border-emerald-400/30" :
                "bg-amber-400/10 border-amber-400/30";
  const tlsColor = tlsRisk === "HIGH" ? "text-red-400" : tlsRisk === "LOW" ? "text-emerald-400" : "text-amber-400";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={closeDrawer}
      />

      <aside className="fixed top-0 right-0 h-full w-[420px] bg-card border-l border-border z-50 flex flex-col shadow-2xl overflow-hidden">
        <div className={`flex items-start gap-3 p-5 border-b border-border ${rb} border-0`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${rb}`}>
            <Icon size={20} className={rc} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-foreground text-base">{d.hostname}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${rb} ${rc}`}>{d.risk_level}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{d.ip} — {d.device_type}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${d.state === "up" ? "bg-emerald-400" : "bg-gray-500"}`} />
              <span className="text-xs text-muted-foreground">{d.state === "up" ? "Online" : "Offline"}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{d.location}</span>
            </div>
          </div>
          <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <Section title="Device Info">
            <div className="bg-background/50 rounded-lg border border-border/50 px-3 divide-y divide-border/40">
              <Row label="Device ID"  value={d.id} mono />
              <Row label="MAC Address" value={d.mac} mono />
              <Row label="Firmware"   value={d.firmware} mono />
              <Row label="Risk Score" value={`${d.risk_score}/100`} color={rc} />
            </div>
          </Section>

          <Section title="Open Ports">
            {d.open_ports.length > 0 ? (
              <div className="space-y-1.5">
                {d.open_ports.map(p => {
                  const warning = PORT_RISK[p.port];
                  return (
                    <div key={p.port} className={`px-3 py-2 rounded-lg border ${warning ? "bg-red-400/5 border-red-400/20" : "bg-background/50 border-border/50"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-primary font-bold">{p.port}/{p.service}</span>
                        <span className="text-xs text-muted-foreground">{p.product} {p.version}</span>
                      </div>
                      {warning && <p className="text-xs text-red-400 mt-0.5">{warning}</p>}
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-xs text-muted-foreground">No open ports detected</p>}
          </Section>

          {d.http_banner && (
            <Section title="HTTP Banner">
              <div className={`px-3 py-3 rounded-lg border ${d.http_banner.status_code === 200 ? "bg-amber-400/5 border-amber-400/30" : "bg-muted/20 border-border/50"}`}>
                <div className="space-y-1">
                  <Row label="Server"     value={d.http_banner.server} mono />
                  <Row label="Software"   value={`${d.http_banner.software} v${d.http_banner.version}`} mono />
                  <Row label="HTTP Status" value={String(d.http_banner.status_code)} color={d.http_banner.status_code === 200 ? "text-amber-400" : "text-muted-foreground"} />
                  <Row label="X-Powered-By" value={d.http_banner.x_powered_by} />
                </div>
              </div>
            </Section>
          )}

          {d.cipher_suite ? (
            <Section title="Cipher Suite / TLS">
              <div className={`px-3 py-3 rounded-lg border ${tlsBg}`}>
                <div className="flex items-center gap-2 mb-2">
                  {tlsRisk === "LOW"
                    ? <CheckCircle size={13} className="text-emerald-400" />
                    : <AlertTriangle size={13} className="text-red-400" />
                  }
                  <span className={`text-xs font-bold ${tlsColor}`}>{d.cipher_suite.risk_level} RISK — {d.cipher_suite.tls_version}</span>
                </div>
                <Row label="Cipher"     value={d.cipher_suite.cipher_name} mono />
                <Row label="Key Bits"   value={`${d.cipher_suite.key_bits}-bit`} />
                <Row label="Weak TLS"   value={d.cipher_suite.weak_tls ? "Yes — deprecated version" : "No"} color={d.cipher_suite.weak_tls ? "text-red-400" : "text-emerald-400"} />
                <Row label="Weak Cipher" value={d.cipher_suite.weak_cipher ? "Yes" : "No"} color={d.cipher_suite.weak_cipher ? "text-red-400" : "text-emerald-400"} />
                {d.cipher_suite.risk_flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {d.cipher_suite.risk_flags.map(f => (
                      <span key={f} className="text-xs font-mono px-1.5 py-0.5 rounded bg-red-400/15 text-red-400 border border-red-400/30">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          ) : d.open_ports.some(p => p.port === 443) ? (
            <Section title="Cipher Suite / TLS">
              <p className="text-xs text-muted-foreground">TLS present but could not be analysed</p>
            </Section>
          ) : (
            <Section title="Cipher Suite / TLS">
              <div className="px-3 py-2 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-xs text-muted-foreground">No TLS/HTTPS port detected — all traffic unencrypted</p>
              </div>
            </Section>
          )}

          {d.cves.length > 0 && (
            <Section title={`${d.cves.length} CVE(s) Found`}>
              <div className="space-y-2">
                {d.cves.map(c => (
                  <div key={c.cve_id} className="px-3 py-2 rounded-lg bg-red-400/10 border border-red-400/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-red-400 font-bold">{c.cve_id}</span>
                      <span className="text-xs font-bold text-red-400">CVSS {c.cvss_score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{c.software} {c.version}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {d.mitre_mappings.length > 0 && (
            <Section title="MITRE ATT&CK for IoT">
              <div className="space-y-1.5">
                {d.mitre_mappings.map((m, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Lock size={11} className="text-primary" />
                      <span className="font-mono text-xs text-primary font-bold">{m.technique_id}</span>
                      <span className="text-xs text-foreground">{m.technique_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-5">{m.tactic} — {m.description}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {d.owasp_mappings.length > 0 && (
            <Section title="OWASP IoT Top 10">
              <div className="space-y-1.5">
                {d.owasp_mappings.map((o, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/50">
                    <span className="font-mono text-xs text-primary font-bold flex-shrink-0 mt-0.5">{o.category}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="p-5 border-t border-border space-y-2">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-400/10 text-red-400 border border-red-400/40 hover:bg-red-400/20 transition-colors"
          >
            <Ban size={15} />
            Isolate Device
          </button>
          <button
            onClick={closeDrawer}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground border border-border hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
