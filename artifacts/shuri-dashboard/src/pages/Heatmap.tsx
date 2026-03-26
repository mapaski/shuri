import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateHeatCell(day: number, hour: number): number {
  const workHour = hour >= 8 && hour <= 18;
  const workDay = day < 5;
  const base = workHour && workDay ? 40 : 5;
  const noise = Math.sin(day * 7 + hour * 1.3) * 20 + Math.cos(day * 3 + hour * 0.7) * 15;
  return Math.max(0, Math.min(100, Math.round(base + noise + Math.random() * 10)));
}

const heatmapData = days.map((day, di) =>
  hours.map((hour, hi) => ({ day, hour, value: generateHeatCell(di, hi) }))
);

function heatColor(v: number): string {
  if (v < 15) return "rgba(168,85,247,0.08)";
  if (v < 30) return "rgba(168,85,247,0.20)";
  if (v < 50) return "rgba(168,85,247,0.40)";
  if (v < 70) return "rgba(249,115,22,0.55)";
  if (v < 85) return "rgba(239,68,68,0.65)";
  return "rgba(239,68,68,0.90)";
}

const trafficData = hours.map((h, i) => ({
  hour: h + ":00",
  inbound: Math.round(120 + Math.sin(i * 0.5) * 80 + Math.random() * 40),
  outbound: Math.round(90 + Math.cos(i * 0.4) * 60 + Math.random() * 30),
  anomalies: Math.random() > 0.85 ? Math.round(Math.random() * 15 + 5) : 0,
}));

const deviceTraffic = [
  { device: "Gateway-01", inbound: 4820, outbound: 3201, threats: 0 },
  { device: "MQTT Broker", inbound: 2140, outbound: 2980, threats: 0 },
  { device: "Cam-Lobby", inbound: 380, outbound: 8920, threats: 2 },
  { device: "Cam-Server", inbound: 290, outbound: 14300, threats: 5 },
  { device: "Temp-A1", inbound: 120, outbound: 85, threats: 0 },
  { device: "Temp-B2", inbound: 110, outbound: 78, threats: 0 },
  { device: "Mobile-01", inbound: 1840, outbound: 920, threats: 1 },
  { device: "Switch-01", inbound: 9200, outbound: 8800, threats: 0 },
];

export default function Heatmap() {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Traffic Intensity Heatmap</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Network traffic density per hour — last 7 days</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0.08, 0.20, 0.40, 0.55, 0.65, 0.90].map((a, i) => (
                  <span
                    key={i}
                    className="w-5 h-3 rounded-sm"
                    style={{ background: i < 3 ? `rgba(168,85,247,${a})` : `rgba(239,68,68,${a})` }}
                  />
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
              {heatmapData.map((row, di) => (
                <div key={days[di]} className="flex items-center gap-1">
                  <div className="w-10 text-xs text-muted-foreground text-right pr-2 font-medium">{days[di]}</div>
                  {row.map(({ value }, hi) => (
                    <div
                      key={hi}
                      className="w-8 h-7 rounded-sm flex items-center justify-center text-[9px] font-mono cursor-pointer hover:ring-1 hover:ring-primary/60 transition-all"
                      style={{ background: heatColor(value) }}
                      title={`${days[di]} ${hours[hi]}:00 — ${value}%`}
                    >
                      {value > 60 ? <span className="text-white/80">{value}</span> : null}
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
          <p className="text-xs text-muted-foreground mb-4">Inbound vs. Outbound (KB/s)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trafficData}>
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
              <XAxis dataKey="hour" tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#E5E7EB" }}
              />
              <Area type="monotone" dataKey="inbound" stroke="#A855F7" strokeWidth={2} fill="url(#inGrad)" name="Inbound" />
              <Area type="monotone" dataKey="outbound" stroke="#06B6D4" strokeWidth={2} fill="url(#outGrad)" name="Outbound" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Per-Device Traffic</h2>
          <p className="text-xs text-muted-foreground mb-4">Total MB today per device</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deviceTraffic} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="device" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: "#1F2937", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#E5E7EB" }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
              <Bar dataKey="inbound" fill="#A855F7" radius={[0, 3, 3, 0]} name="Inbound" />
              <Bar dataKey="outbound" fill="#06B6D4" radius={[0, 3, 3, 0]} name="Outbound" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
