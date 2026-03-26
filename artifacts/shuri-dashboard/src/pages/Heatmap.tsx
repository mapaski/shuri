import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Loader2, XCircle } from "lucide-react";
import { useScanData } from "@/hooks/use-scan-data";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

function heatColor(v: number): string {
  if (v < 10)  return "rgba(168,85,247,0.06)";
  if (v < 25)  return "rgba(168,85,247,0.18)";
  if (v < 45)  return "rgba(168,85,247,0.35)";
  if (v < 65)  return "rgba(249,115,22,0.50)";
  if (v < 80)  return "rgba(239,68,68,0.60)";
  return "rgba(239,68,68,0.88)";
}

export default function Heatmap() {
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

  const { heatmap } = data;
  const { traffic_by_hour, device_traffic, daily_intensity } = heatmap;

  const anomalyHours = traffic_by_hour.filter(h => h.anomalies > 0);

  return (
    <div className="space-y-6">
      {anomalyHours.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-400/10 border border-red-400/30 rounded-xl">
          <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Anomalous Traffic Detected</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unusual outbound spikes detected at: {anomalyHours.map(h => h.hour).join(", ")}. 
              Peak outbound at 14:00 reached <span className="text-red-400 font-mono">14,300 KB/s</span> — possible data exfiltration from ipcam-server.
            </p>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Traffic Intensity Heatmap</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Network activity per hour — 7 days from scan</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0.06, 0.18, 0.35, 0.50, 0.60, 0.88].map((a, i) => (
                  <span key={i} className="w-5 h-3 rounded-sm" style={{ background: i < 3 ? `rgba(168,85,247,${a})` : `rgba(239,68,68,${a})` }} />
                ))}
              </div>
              <span>Low → High</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="flex items-center gap-1 mb-1 ml-12">
              {hours.map(h => (
                <div key={h} className="w-8 text-center text-[10px] text-muted-foreground font-mono">{h}</div>
              ))}
            </div>
            <div className="space-y-1">
              {daily_intensity.map(({ day, hours: vals }) => (
                <div key={day} className="flex items-center gap-1">
                  <div className="w-10 text-xs text-muted-foreground text-right pr-2 font-medium">{day}</div>
                  {vals.map((value, hi) => (
                    <div
                      key={hi}
                      className="w-8 h-7 rounded-sm flex items-center justify-center cursor-pointer hover:ring-1 hover:ring-primary/60 transition-all"
                      style={{ background: heatColor(value) }}
                      title={`${day} ${hours[hi]}:00 — intensity ${value}%`}
                    >
                      {value > 70 ? <span className="text-[9px] text-white/80 font-mono">{value}</span> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
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
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
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
          <p className="text-xs text-muted-foreground mb-4">Total KB today — from scan results</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={device_traffic} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="device" tick={{ fill: "#9CA3AF", fontSize: 9 }} tickLine={false} axisLine={false} width={90} />
              <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#E5E7EB" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
              <Bar dataKey="inbound" fill="#A855F7" radius={[0, 3, 3, 0]} name="Inbound" />
              <Bar dataKey="outbound" fill="#EF4444" radius={[0, 3, 3, 0]} name="Outbound" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
