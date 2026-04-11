import { useEffect, useState } from "react";

interface Remediation {
  issue: string;
  title: string;
  priority: string;
  steps: string[];
  command: string | null;
}

interface Device {
  hostname: string;
  ip: string;
  device_type: string;
  blast_radius: number;
  risk_level: string;
  remediations: Remediation[];
}

const PRIORITY_COLOR: Record<string, string> = {
  P0: "#EF4444",
  P1: "#F97316",
  P2: "#F59E0B",
};

export default function Remediation() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/devices")
      .then(r => r.json())
      .then(data => {
        const withIssues = data
          .filter((d: Device) => d.remediations && d.remediations.length > 0)
          .sort((a: Device, b: Device) => b.blast_radius - a.blast_radius);
        setDevices(withIssues);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32, color: "#94A3B8" }}>Loading...</div>;

  const allFixes = devices.flatMap(d =>
    d.remediations.map(r => ({ ...r, device: d }))
  ).sort((a, b) => a.priority.localeCompare(b.priority));

  return (
    <div style={{ padding: 24, fontFamily: "monospace", background: "#0F172A", minHeight: "100vh", color: "#E2E8F0" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🔧 Remediation Plan</h1>
      <p style={{ color: "#64748B", marginBottom: 24 }}>
        {allFixes.filter(f => f.priority === "P0").length} critical · {allFixes.filter(f => f.priority === "P1").length} high · {allFixes.filter(f => f.priority === "P2").length} medium
      </p>

      {allFixes.map((fix, i) => (
        <div key={i} style={{
          background: "#1E293B", borderRadius: 8, padding: 20, marginBottom: 16,
          borderLeft: `4px solid ${PRIORITY_COLOR[fix.priority] || "#64748B"}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <span style={{
                background: PRIORITY_COLOR[fix.priority], color: "#fff",
                borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, marginRight: 8
              }}>{fix.priority}</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{fix.title}</span>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "#64748B" }}>
              <div>{fix.device.hostname}</div>
              <div>{fix.device.ip}</div>
              <div>Blast radius: {fix.device.blast_radius}/10</div>
            </div>
          </div>

          <ol style={{ margin: "0 0 12px 0", paddingLeft: 20, color: "#CBD5E1", fontSize: 13 }}>
            {fix.steps.map((step, j) => <li key={j} style={{ marginBottom: 4 }}>{step}</li>)}
          </ol>

          {fix.command && (
            <div style={{
              background: "#0F172A", borderRadius: 4, padding: "8px 12px",
              fontFamily: "monospace", fontSize: 12, color: "#34D399"
            }}>
              $ {fix.command}
            </div>
          )}
        </div>
      ))}

      {allFixes.length === 0 && (
        <div style={{ color: "#34D399", fontSize: 16 }}>✓ No issues found on this network.</div>
      )}
    </div>
  );
}
