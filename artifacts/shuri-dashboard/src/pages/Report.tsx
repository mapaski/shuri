import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Shield, AlertTriangle, Cpu, CheckCircle, FileDown, Calendar, TrendingUp, TrendingDown, Loader2, XCircle } from "lucide-react";
import { useScanData } from "@/hooks/use-scan-data";

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.08 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

const kpiIcons = [Shield, Cpu, AlertTriangle, CheckCircle];
const kpiColors = ["text-primary", "text-emerald-400", "text-red-400", "text-emerald-400"];
const kpiLabels = ["Security Score", "Devices Online", "Active Threats", "Resolved Today"];

export default function Report() {
  const { data, isLoading, isError } = useScanData();

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

  const { report, scan_metadata } = data;
  const { weekly_alerts, threat_breakdown, posture_scores, audit_log, kpis } = report;

  const kpiKeys = ["security_score", "devices_online", "active_threats", "resolved_today"] as const;
  const kpiData = kpiKeys.map((k, i) => ({ ...kpis[k], label: kpiLabels[i], Icon: kpiIcons[i], color: kpiColors[i] }));

  const scanDate = new Date(scan_metadata.timestamp).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={13} />
            <span>Scan: {scanDate}</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border">{scan_metadata.scan_id}</span>
          <span className="text-xs text-muted-foreground">{scan_metadata.scanner}</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/25 transition-colors">
          <FileDown size={14} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiData.map(({ label, value, trend, up, Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <Icon size={16} className={color} />
              <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Weekly Alert Trend</h2>
          <p className="text-xs text-muted-foreground mb-4">Alerts by severity — 7 days to scan date</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weekly_alerts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#E5E7EB" }} />
              <Line type="monotone" dataKey="critical" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 3 }} name="Critical" />
              <Line type="monotone" dataKey="high"     stroke="#F97316" strokeWidth={2} dot={{ fill: "#F97316", r: 3 }} name="High" />
              <Line type="monotone" dataKey="medium"   stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 3 }} name="Medium" />
              <Line type="monotone" dataKey="low"      stroke="#A855F7" strokeWidth={2} dot={{ fill: "#A855F7", r: 3 }} name="Low" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Threat Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-4">By type from scan data</p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={threat_breakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false} label={renderLabel} isAnimationActive={false}>
                  {threat_breakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {threat_breakdown.map(t => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Security Posture Score</h2>
          <p className="text-xs text-muted-foreground mb-4">Across 6 IoT security control domains</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={posture_scores}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6B7280", fontSize: 9 }} tickCount={4} />
              <Radar name="Score" dataKey="value" stroke="#A855F7" fill="#A855F7" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Scanner Audit Log</h2>
          <div className="space-y-2">
            {audit_log.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="font-mono text-xs text-muted-foreground w-12 flex-shrink-0 mt-0.5">{entry.time}</span>
                <span className="text-xs text-foreground flex-1 leading-relaxed">{entry.action}</span>
                <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{entry.user}</span>
                <span className={`text-xs font-medium flex-shrink-0 ${entry.outcome === "success" ? "text-emerald-400" : "text-red-400"}`}>{entry.outcome}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Targets scanned: <span className="text-foreground">{scan_metadata.targets.join(", ")}</span></span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Ports checked: <span className="text-foreground font-mono">{scan_metadata.ports_scanned}</span></span>
              <span>{scan_metadata.total_up} up / {scan_metadata.total_down} down</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
