import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Shield, AlertTriangle, Cpu, CheckCircle, FileDown, Calendar, TrendingUp, TrendingDown } from "lucide-react";

const weeklyAlerts = [
  { day: "Mon", critical: 2, high: 5, medium: 8, low: 3 },
  { day: "Tue", critical: 1, high: 3, medium: 6, low: 5 },
  { day: "Wed", critical: 4, high: 7, medium: 4, low: 2 },
  { day: "Thu", critical: 0, high: 2, medium: 9, low: 7 },
  { day: "Fri", critical: 3, high: 6, medium: 11, low: 4 },
  { day: "Sat", critical: 0, high: 1, medium: 3, low: 1 },
  { day: "Sun", critical: 0, high: 0, medium: 2, low: 0 },
];

const threatTypes = [
  { name: "Intrusion", value: 28, color: "#EF4444" },
  { name: "Exfiltration", value: 19, color: "#F97316" },
  { name: "Vulnerability", value: 22, color: "#F59E0B" },
  { name: "Protocol", value: 16, color: "#A855F7" },
  { name: "Config", value: 9, color: "#06B6D4" },
  { name: "Other", value: 6, color: "#6B7280" },
];

const secScore = [
  { metric: "Auth", value: 88 },
  { metric: "Encryption", value: 72 },
  { metric: "Patching", value: 55 },
  { metric: "Monitoring", value: 92 },
  { metric: "Access Ctrl", value: 79 },
  { metric: "Logging", value: 84 },
];

const auditLog = [
  { time: "09:12", action: "Firewall rule updated", user: "admin", outcome: "success" },
  { time: "09:45", action: "Device DEV-009 quarantined", user: "system", outcome: "success" },
  { time: "10:03", action: "Alert ALT-001 escalated", user: "analyst@shuri", outcome: "success" },
  { time: "10:30", action: "Failed config push to DEV-007", user: "admin", outcome: "failed" },
  { time: "11:18", action: "MQTT broker restarted", user: "system", outcome: "success" },
  { time: "12:44", action: "Certificate renewed for DEV-004", user: "admin", outcome: "success" },
  { time: "13:50", action: "Report generated", user: "admin", outcome: "success" },
];

const kpis = [
  { label: "Security Score", value: "78/100", trend: "+4", up: true, icon: Shield, color: "text-primary" },
  { label: "Devices Online", value: "8/10", trend: "-1", up: false, icon: Cpu, color: "text-emerald-400" },
  { label: "Active Threats", value: "7", trend: "+2", up: false, icon: AlertTriangle, color: "text-red-400" },
  { label: "Resolved Today", value: "12", trend: "+5", up: true, icon: CheckCircle, color: "text-emerald-400" },
];

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

export default function Report() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={13} />
          <span>{today}</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/25 transition-colors">
          <FileDown size={14} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map(({ label, value, trend, up, icon: Icon, color }) => (
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
          <p className="text-xs text-muted-foreground mb-4">Alerts by severity over the past 7 days</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyAlerts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#E5E7EB" }} />
              <Line type="monotone" dataKey="critical" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 3 }} name="Critical" />
              <Line type="monotone" dataKey="high" stroke="#F97316" strokeWidth={2} dot={{ fill: "#F97316", r: 3 }} name="High" />
              <Line type="monotone" dataKey="medium" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 3 }} name="Medium" />
              <Line type="monotone" dataKey="low" stroke="#A855F7" strokeWidth={2} dot={{ fill: "#A855F7", r: 3 }} name="Low" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Threat Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-4">By attack type this week</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={threatTypes} cx="50%" cy="50%" outerRadius={70} dataKey="value" labelLine={false} label={renderLabel}>
                {threatTypes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {threatTypes.map(t => (
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
          <p className="text-xs text-muted-foreground mb-4">Assessment across 6 control domains</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={secScore}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6B7280", fontSize: 9 }} tickCount={4} />
              <Radar name="Score" dataKey="value" stroke="#A855F7" fill="#A855F7" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Audit Log — Today</h2>
          <div className="space-y-2">
            {auditLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="font-mono text-xs text-muted-foreground w-12 flex-shrink-0">{entry.time}</span>
                <span className="text-xs text-foreground flex-1">{entry.action}</span>
                <span className="text-xs text-muted-foreground font-mono">{entry.user}</span>
                <span className={`text-xs font-medium ${entry.outcome === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {entry.outcome}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
