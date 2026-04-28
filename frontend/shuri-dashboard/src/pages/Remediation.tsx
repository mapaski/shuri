import { useEffect, useState } from "react";
import { useScanData } from "@/hooks/use-scan-data";

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
  P0: "#EF4444", P1: "#F97316", P2: "#F59E0B",
};

const HONEYPOT_REMEDIATIONS: Record<string, { title: string; priority: string; steps: string[]; command: string | null }> = {
  fake_telnet: {
    title: "Disable Telnet Service",
    priority: "P0",
    steps: ["Identify device running Telnet on port 23/2323", "Access device admin panel", "Disable Telnet service", "Enable SSH instead if remote access needed", "Block port 23 at firewall level"],
    command: "iptables -A INPUT -p tcp --dport 23 -j DROP"
  },
  fake_ssh: {
    title: "Harden SSH Access",
    priority: "P0",
    steps: ["Disable password authentication", "Use SSH key pairs only", "Change default SSH port", "Enable fail2ban or rate limiting", "Restrict SSH access by IP"],
    command: "sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config"
  },
  fake_http_admin: {
    title: "Secure HTTP Admin Panel",
    priority: "P0",
    steps: ["Immediately change default admin credentials", "Enable HTTPS on admin interface", "Restrict admin panel access by IP whitelist", "Add 2FA if supported", "Block port 8080 from external access"],
    command: "iptables -A INPUT -p tcp --dport 8080 -j DROP"
  },
  fake_mqtt: {
    title: "Secure MQTT Broker",
    priority: "P1",
    steps: ["Enable MQTT authentication (username/password)", "Enable TLS on port 8883", "Disable anonymous connections", "Restrict MQTT access to trusted IPs only"],
    command: null
  },
  fake_mqtt_followup: {
    title: "Restrict MQTT Pub/Sub Access",
    priority: "P1",
    steps: ["Implement MQTT ACL (Access Control List)", "Restrict topic subscriptions per client", "Monitor MQTT broker logs for anomalies"],
    command: null
  },
};

export default function Remediation() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const { data } = useScanData();
  const honeypotAlerts = data?.honeypot_alerts || [];

  useEffect(() => {
    function load() {
      fetch("http://127.0.0.1:5000/devices")
        .then(r => r.json())
        .then(data => {
          data = data.devices || data;
          const withIssues = data
            .filter((d: Device) => d.remediations && d.remediations.length > 0)
            .sort((a: Device, b: Device) => b.blast_radius - a.blast_radius);
          setDevices(withIssues);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate alert-based remediations from latest honeypot hits
  const seen = new Set<string>();
  const alertFixes = honeypotAlerts
    .filter(a => {
      if (seen.has(a.honeypot_type)) return false;
      seen.add(a.honeypot_type);
      return true;
    })
    .map(a => ({
      ...HONEYPOT_REMEDIATIONS[a.honeypot_type],
      attacker_ip: a.attacker_ip,
      honeypot_type: a.honeypot_type,
      timestamp: a.timestamp,
    }))
    .filter(f => f.title);

  const allFixes = devices.flatMap(d =>
    d.remediations.map(r => ({ ...r, device: d }))
  ).sort((a, b) => a.priority.localeCompare(b.priority));

  if (loading) return <div style={{ padding: 32, color: "#94A3B8" }}>Loading...</div>;

  return (
    <div style={{ padding: 24, fontFamily: "monospace", background: "#0F172A", minHeight: "100vh", color: "#E2E8F0" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🔧 Remediation Plan</h1>
      <p style={{ color: "#64748B", marginBottom: 24 }}>
        {allFixes.filter(f => f.priority === "P0").length + alertFixes.filter(f => f.priority === "P0").length} critical ·{" "}
        {allFixes.filter(f => f.priority === "P1").length + alertFixes.filter(f => f.priority === "P1").length} high ·{" "}
        {allFixes.filter(f => f.priority === "P2").length} medium
      </p>

      {/* Alert-based remediations */}
      {alertFixes.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block", animation: "pulse 1s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>LIVE — Based on Active Honeypot Alerts</span>
          </div>
          {alertFixes.map((fix, i) => (
            <div key={`alert-${i}`} style={{
              background: "#1E293B", borderRadius: 8, padding: 20, marginBottom: 16,
              borderLeft: `4px solid ${PRIORITY_COLOR[fix.priority] || "#64748B"}`,
              boxShadow: "0 0 12px rgba(239,68,68,0.15)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span style={{ background: PRIORITY_COLOR[fix.priority], color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, marginRight: 8 }}>{fix.priority}</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{fix.title}</span>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#64748B" }}>
                  <div style={{ color: "#EF4444" }}>Attacker: {fix.attacker_ip}</div>
                  <div>{fix.honeypot_type?.replace("fake_", "")} honeypot</div>
                </div>
              </div>
              <ol style={{ margin: "0 0 12px 0", paddingLeft: 20, color: "#CBD5E1", fontSize: 13 }}>
                {fix.steps?.map((step, j) => <li key={j} style={{ marginBottom: 4 }}>{step}</li>)}
              </ol>
              {fix.command && (
                <div style={{ background: "#0F172A", borderRadius: 4, padding: "8px 12px", fontFamily: "monospace", fontSize: 12, color: "#34D399" }}>
                  $ {fix.command}
                </div>
              )}
            </div>
          ))}
          <div style={{ borderTop: "1px solid #1E293B", marginBottom: 24, marginTop: 8 }} />
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>Device-based remediations:</p>
        </>
      )}

      {/* Device-based remediations */}
      {allFixes.map((fix, i) => (
        <div key={i} style={{
          background: "#1E293B", borderRadius: 8, padding: 20, marginBottom: 16,
          borderLeft: `4px solid ${PRIORITY_COLOR[fix.priority] || "#64748B"}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <span style={{ background: PRIORITY_COLOR[fix.priority], color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, marginRight: 8 }}>{fix.priority}</span>
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
            <div style={{ background: "#0F172A", borderRadius: 4, padding: "8px 12px", fontFamily: "monospace", fontSize: 12, color: "#34D399" }}>
              $ {fix.command}
            </div>
          )}
        </div>
      ))}

      {allFixes.length === 0 && alertFixes.length === 0 && (
        <div style={{ color: "#34D399", fontSize: 16 }}>✓ No issues found on this network.</div>
      )}
    </div>
  );
}
