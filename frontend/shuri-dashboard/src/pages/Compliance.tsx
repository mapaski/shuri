import { CheckCircle, XCircle, AlertTriangle, Minus, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useScanData, Device } from "@/hooks/use-scan-data";
import { useDeviceDrawer } from "@/context/device-drawer-context";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

const OWASP_CATEGORIES = [
  {
    id: "I1", name: "Weak / Hardcoded Passwords",
    desc: "Easily guessable, hard-coded, or default credentials.",
    issues: ["default_credentials", "default_password"],
    recommendation: "Enforce unique strong passwords at provisioning. Disable telnet default accounts.",
  },
  {
    id: "I2", name: "Insecure Network Services",
    desc: "Unnecessary or insecure network services expose attack surface.",
    issues: ["open_telnet", "telnet_open"],
    recommendation: "Disable Telnet. Use SSH with key-based auth. Firewall unused ports.",
  },
  {
    id: "I3", name: "Insecure Ecosystem Interfaces",
    desc: "Insecure web, backend API, mobile, or cloud interfaces.",
    issues: ["http_no_auth", "unencrypted_http"],
    recommendation: "Enable HTTPS on all web interfaces. Require authentication on all APIs.",
  },
  {
    id: "I4", name: "Lack of Secure Update Mechanism",
    desc: "Firmware cannot be securely updated or validated.",
    issues: ["outdated_firmware"],
    recommendation: "Implement signed OTA updates. Schedule firmware audits every 6 months.",
  },
  {
    id: "I5", name: "Insecure or Outdated Components",
    desc: "Deprecated or CVE-affected third-party libraries.",
    issues: ["outdated_software", "old_software"],
    recommendation: "Run CVE scans on every deployed version. Upgrade lighttpd, GoAhead, Apache.",
  },
  {
    id: "I6", name: "Insufficient Privacy Protection",
    desc: "Sensitive personal data not adequately protected.",
    issues: [],
    recommendation: "Audit data retention policies. Encrypt PII at rest and in transit.",
    notAssessed: true,
  },
  {
    id: "I7", name: "Insecure Data Transfer & Storage",
    desc: "Absence of encryption for data in transit or at rest.",
    issues: ["weak_cipher", "unencrypted_http", "unencrypted_traffic"],
    recommendation: "Enforce TLS 1.2+ on all endpoints. Replace TLS 1.1 on gateway.",
  },
  {
    id: "I8", name: "Lack of Device Management",
    desc: "No secure onboarding, decommissioning, or monitoring.",
    issues: [],
    recommendation: "Deploy a device registry. Automate certificate lifecycle management.",
    notAssessed: true,
  },
  {
    id: "I9", name: "Insecure Default Settings",
    desc: "Shipped with insecure default configuration enabled.",
    issues: ["upnp_enabled"],
    recommendation: "Disable UPnP, mDNS, and all unnecessary discovery protocols by default.",
  },
  {
    id: "I10", name: "Lack of Physical Hardening",
    desc: "No protection against physical access attacks.",
    issues: [],
    recommendation: "Implement secure boot, debug port lockdown, and tamper detection.",
    notAssessed: true,
  },
];

function getStatus(cat: typeof OWASP_CATEGORIES[0], devices: Device[]) {
  if (cat.notAssessed) return "not_assessed";
  if (cat.issues.length === 0) return "pass";
  const affected = devices.filter(d =>
    d.issues.some(i => cat.issues.includes(i))
  );
  if (affected.length === 0) return "pass";
  const ratio = affected.length / devices.length;
  if (ratio >= 0.4) return "fail";
  return "partial";
}

function getAffectedDevices(cat: typeof OWASP_CATEGORIES[0], devices: Device[]) {
  if (cat.issues.length === 0) return [];
  return devices.filter(d => d.issues.some(i => cat.issues.includes(i)));
}

const statusConfig = {
  pass:         { icon: CheckCircle,    label: "Pass",         bg: "bg-emerald-400/10", border: "border-emerald-400/30", text: "text-emerald-400", score: 100 },
  partial:      { icon: AlertTriangle,  label: "Partial Fail", bg: "bg-amber-400/10",   border: "border-amber-400/30",   text: "text-amber-400",   score: 40  },
  fail:         { icon: XCircle,        label: "Fail",         bg: "bg-red-400/10",     border: "border-red-400/30",     text: "text-red-400",     score: 0   },
  not_assessed: { icon: Minus,          label: "Not Assessed", bg: "bg-muted/30",       border: "border-border",         text: "text-muted-foreground", score: 50 },
};

export default function Compliance() {
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

  const { devices } = data;

  const rows = OWASP_CATEGORIES.map(cat => ({
    cat,
    status: getStatus(cat, devices) as keyof typeof statusConfig,
    affected: getAffectedDevices(cat, devices),
  }));

  const assessed = rows.filter(r => r.status !== "not_assessed");
  const passed = assessed.filter(r => r.status === "pass").length;
  const failed = assessed.filter(r => r.status === "fail").length;
  const partial = assessed.filter(r => r.status === "partial").length;
  const coverageScore = Math.round(assessed.reduce((sum, r) => sum + statusConfig[r.status].score, 0) / assessed.length);

  const radarData = OWASP_CATEGORIES.map(cat => {
    const status = getStatus(cat, devices) as keyof typeof statusConfig;
    return { category: cat.id, score: statusConfig[status].score };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "OWASP Coverage", value: `${coverageScore}%`, color: coverageScore > 70 ? "text-emerald-400" : coverageScore > 40 ? "text-amber-400" : "text-red-400", bg: "bg-primary/10", icon: ShieldCheck },
          { label: "Pass",           value: passed,    color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle },
          { label: "Fail / Partial", value: failed + partial, color: "text-red-400",    bg: "bg-red-400/10",    icon: ShieldAlert },
          { label: "Not Assessed",   value: rows.filter(r => r.status === "not_assessed").length, color: "text-muted-foreground", bg: "bg-muted/30", icon: Minus },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-3">
          {rows.map(({ cat, status, affected }) => {
            const sc = statusConfig[status];
            const StatusIcon = sc.icon;
            return (
              <div key={cat.id} className={`bg-card border rounded-xl p-4 ${sc.border}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center border ${sc.bg} ${sc.border}`}>
                    <StatusIcon size={18} className={sc.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-primary font-bold">{cat.id}</span>
                      <span className="font-semibold text-foreground text-sm">{cat.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cat.desc}</p>

                    {affected.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Affected:</span>
                        {affected.map(d => (
                          <button
                            key={d.id}
                            onClick={() => openDrawer(d)}
                            className="text-xs font-mono text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                          >
                            {d.hostname}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 px-2 py-1.5 rounded bg-muted/20 border border-border/50">
                      <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Fix:</span> {cat.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-1">OWASP Posture Radar</h2>
            <p className="text-xs text-muted-foreground mb-3">Coverage score per category</p>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6B7280", fontSize: 8 }} tickCount={3} />
                  <Radar name="Score" dataKey="score" stroke="#A855F7" fill="#A855F7" fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
                  <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Affected Device Count</h2>
            <div className="space-y-2">
              {rows.filter(r => r.affected.length > 0).map(({ cat, affected }) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-primary w-7 flex-shrink-0">{cat.id}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-red-400"
                      style={{ width: `${(affected.length / devices.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {affected.length}/{devices.length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Coverage Legend</h2>
            {Object.entries(statusConfig).map(([key, sc]) => {
              const Icon = sc.icon;
              return (
                <div key={key} className="flex items-center gap-2 py-1.5">
                  <Icon size={14} className={sc.text} />
                  <span className="text-xs text-muted-foreground">{sc.label}</span>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs font-mono text-muted-foreground">{sc.score}/100</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
