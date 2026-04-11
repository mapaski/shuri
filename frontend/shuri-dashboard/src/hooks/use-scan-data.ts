import { useQuery } from "@tanstack/react-query";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export interface OpenPort {
  port: number;
  state: string;
  service: string;
  product: string;
  version: string;
}

export interface HttpBanner {
  server: string;
  software: string;
  version: string;
  status_code: number;
  x_powered_by?: string;
}

export interface CipherSuite {
  tls_version: string;
  cipher_name: string;
  key_bits: number;
  weak_cipher: boolean;
  weak_tls: boolean;
  risk_flags: string[];
  risk_level: string;
}

export interface CVE {
  cve_id: string;
  cvss_score: number;
  description: string;
  severity: string;
  software?: string;
  version?: string;
}

export interface MitreMapping {
  issue: string;
  technique_id: string;
  technique_name: string;
  tactic: string;
  description: string;
}

export interface OwaspMapping {
  issue: string;
  category: string;
  name: string;
  description: string;
}

export interface Device {
  id: string;
  ip: string;
  hostname: string;
  device_type: string;
  mac: string;
  state: "up" | "down";
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  location: string;
  last_seen: string;
  firmware: string;
  open_ports: OpenPort[];
  http_banner: HttpBanner | null;
  cipher_suite: CipherSuite | null;
  issues: string[];
  cves: CVE[];
  mitre_mappings: MitreMapping[];
  owasp_mappings: OwaspMapping[];
}

export interface Alert {
  id: string;
  device_id: string;
  device_name: string;
  device_ip: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "investigating" | "resolved";
  type: string;
  mitre_id: string;
  mitre_name: string;
  owasp_category: string;
  time: string;
  count: number;
}

export interface TrafficHour {
  hour: string;
  inbound: number;
  outbound: number;
  anomalies: number;
}

export interface DeviceTraffic {
  device: string;
  inbound: number;
  outbound: number;
  threats: number;
}

export interface HoneypotAlert {
  timestamp: string;
  honeypot_type: "fake_telnet" | "fake_http_admin" | "fake_mqtt" | "fake_mqtt_followup" | "fake_ssh";
  honeypot_port: number;
  attacker_ip: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  mitre_technique: string;
  credentials_tried?: string;
  credentials_posted?: string;
  path_accessed?: string;
  user_agent?: string;
  mqtt_client_id?: string;
  raw_data_hex?: string;
  packet_hex?: string;
  client_banner?: string;
}

export interface ScanData {
  scan_metadata: {
    scan_id: string;
    timestamp: string;
    scanner: string;
    targets: string[];
    ports_scanned: string;
    total_targets: number;
    total_up: number;
    total_down: number;
  };
  devices: Device[];
  alerts: Alert[];
  heatmap: {
    traffic_by_hour: TrafficHour[];
    device_traffic: DeviceTraffic[];
    daily_intensity: { day: string; hours: number[] }[];
  };
  report: {
    security_score: number;
    weekly_alerts: { day: string; critical: number; high: number; medium: number; low: number }[];
    threat_breakdown: { name: string; value: number; color: string }[];
    posture_scores: { metric: string; value: number }[];
    audit_log: { time: string; action: string; user: string; outcome: string }[];
    kpis: {
      security_score: { value: string; trend: string; up: boolean };
      devices_online: { value: string; trend: string; up: boolean };
      active_threats: { value: string; trend: string; up: boolean };
      resolved_today: { value: string; trend: string; up: boolean };
    };
  };
  honeypot_alerts: HoneypotAlert[];
}

function mapBackendDevice(device: any, index: number): Device {
  const openPorts = (device.open_ports || []);
  const riskScore = device.risk_score ?? openPorts.length * 10;

  const validLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = 
    validLevels.includes(device.risk_level) ? device.risk_level as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" : "LOW";
  if (!validLevels.includes(device.risk_level)) {
    if (riskScore >= 70) riskLevel = "CRITICAL";
    else if (riskScore >= 45) riskLevel = "HIGH";
    else if (riskScore >= 20) riskLevel = "MEDIUM";
  }

  return {
    id: device.id || `DEV-${String(index + 1).padStart(3, "0")}`,
    ip: device.ip || "Unknown",
    hostname: device.hostname || "Unknown",
    device_type: device.device_type || "IoT Device",
    mac: device.mac || "N/A",
    state: device.state === "up" ? "up" : "down",
    risk_level: riskLevel,
    risk_score: device.risk_score ?? riskScore,
    location: device.location || "Local LAN",
    last_seen: device.last_seen || new Date().toISOString(),
    firmware: device.firmware || device.http_banner?.version || "Unknown",
    open_ports: openPorts,
    http_banner: device.http_banner || null,
    cipher_suite: device.cipher_suite || null,
    issues: device.issues || [],
    cves: device.cves || [],
    mitre_mappings: device.mitre_mappings || [],
    owasp_mappings: device.owasp_mappings || [],
  };
}

function mapHoneypotToAlert(h: HoneypotAlert, index: number): Alert {
  return {
    id: `ALERT-${index + 1}`,
    device_id: `HP-${index + 1}`,
    device_name: h.honeypot_type,
    device_ip: h.attacker_ip,
    title: `${h.honeypot_type} triggered`,
    description: `Suspicious interaction detected from ${h.attacker_ip} on port ${h.honeypot_port}`,
    severity:
      h.severity === "HIGH"
        ? "high"
        : h.severity === "MEDIUM"
        ? "medium"
        : "low",
    status: "active",
    type: "Intrusion",
    mitre_id: h.mitre_technique.split(":")[0],
    mitre_name: h.mitre_technique.split(":").slice(1).join(":").trim(),
    owasp_category: "I2",
    time: h.timestamp,
    count: 1,
  };
}

function getBuiltInDemoData(): ScanData {
  const devices: Device[] = [
    {
      id: "DEV-001",
      ip: "192.168.29.10",
      hostname: "Smart Camera",
      device_type: "Camera",
      mac: "AA:BB:CC:DD:EE:01",
      state: "up",
      risk_level: "HIGH",
      risk_score: 32,
      location: "Living Room",
      last_seen: new Date().toISOString(),
      firmware: "v1.2.4",
      open_ports: [
        { port: 80, state: "open", service: "http", product: "Boa", version: "0.94" },
        { port: 554, state: "open", service: "rtsp", product: "RTSP", version: "1.0" },
        { port: 23, state: "open", service: "telnet", product: "BusyBox", version: "1.19" },
      ],
      http_banner: {
        server: "Boa",
        software: "Boa",
        version: "0.94",
        status_code: 200,
      },
      cipher_suite: null,
      issues: ["Telnet exposed", "Outdated web server"],
      cves: [],
      mitre_mappings: [],
      owasp_mappings: [],
    },
    {
      id: "DEV-002",
      ip: "192.168.29.15",
      hostname: "Smart Bulb Hub",
      device_type: "Hub",
      mac: "AA:BB:CC:DD:EE:02",
      state: "up",
      risk_level: "MEDIUM",
      risk_score: 18,
      location: "Bedroom",
      last_seen: new Date().toISOString(),
      firmware: "v3.1.0",
      open_ports: [
        { port: 80, state: "open", service: "http", product: "nginx", version: "1.18" },
        { port: 1883, state: "open", service: "mqtt", product: "Mosquitto", version: "2.0" },
      ],
      http_banner: {
        server: "nginx",
        software: "nginx",
        version: "1.18",
        status_code: 200,
      },
      cipher_suite: null,
      issues: ["MQTT exposed"],
      cves: [],
      mitre_mappings: [],
      owasp_mappings: [],
    },
  ];

  const honeypot_alerts: HoneypotAlert[] = [
    {
      timestamp: new Date().toISOString(),
      honeypot_type: "fake_http_admin",
      honeypot_port: 8080,
      attacker_ip: "203.0.113.12",
      severity: "MEDIUM",
      mitre_technique: "T0846: Remote System Discovery",
      path_accessed: "/",
      user_agent: "Mozilla/5.0",
    },
    {
      timestamp: new Date().toISOString(),
      honeypot_type: "fake_telnet",
      honeypot_port: 2323,
      attacker_ip: "198.51.100.7",
      severity: "HIGH",
      mitre_technique: "T0859: Valid Accounts",
      credentials_tried: "admin:admin",
    },
  ];

  const alerts: Alert[] = honeypot_alerts.map(mapHoneypotToAlert);
  const totalUp = devices.filter((d) => d.state === "up").length;
  const totalDown = devices.filter((d) => d.state === "down").length;

  return {
    scan_metadata: {
      scan_id: "SHURI-DEMO",
      timestamp: new Date().toISOString(),
      scanner: "SHURI Demo Mode",
      targets: devices.map((d) => d.ip),
      ports_scanned: "22,23,80,443,554,1883,8080",
      total_targets: devices.length,
      total_up: totalUp,
      total_down: totalDown,
    },
    devices,
    alerts,
    honeypot_alerts,
    heatmap: generateHeatmapFromDevices(devices),
    report: {
      security_score: 78,
      weekly_alerts: [],
      threat_breakdown: [],
      posture_scores: [],
      audit_log: [],
      kpis: {
        security_score: { value: "78", trend: "Demo posture", up: true },
        devices_online: { value: `${totalUp}`, trend: "Demo dataset", up: true },
        active_threats: { value: `${alerts.length}`, trend: "Demo honeypot events", up: false },
        resolved_today: { value: "1", trend: "Demo metric", up: true },
      },
    },
  };
}


function generateHeatmapFromDevices(devices: Device[]) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const highRiskDevices = devices.filter(d => ["CRITICAL","HIGH"].includes(d.risk_level));
  const seed = devices.length * 7;

  // Generate traffic_by_hour (24 hours)
  const traffic_by_hour = Array.from({length: 24}, (_, hour) => {
    const isBusinessHour = hour >= 8 && hour <= 18;
    const isSpikeHour = [9,13,14].includes(hour);
    const base = isBusinessHour ? 40 + seed : 5 + seed / 4;
    const spike = isSpikeHour && highRiskDevices.length > 0 ? highRiskDevices.length * 800 : 0;
    const inbound = Math.round(base * (0.8 + Math.random() * 0.4) * 100);
    const outbound = Math.round((base * 0.6 + spike) * (0.8 + Math.random() * 0.4) * 100);
    return {
      hour: String(hour).padStart(2,"0"),
      inbound,
      outbound,
      anomalies: isSpikeHour && highRiskDevices.length > 2 ? 1 : 0,
    };
  });

  // Generate device_traffic
  const device_traffic = devices.slice(0,8).map(d => {
    const factor = d.risk_level === "CRITICAL" ? 8 : d.risk_level === "HIGH" ? 5 : d.risk_level === "MEDIUM" ? 3 : 1;
    return {
      device: d.hostname,
      inbound: Math.round(factor * 800 * (0.7 + Math.random() * 0.6)),
      outbound: Math.round(factor * 1200 * (0.7 + Math.random() * 0.6)),
    };
  });

  // Generate daily_intensity (7 days x 24 hours)
  const daily_intensity = days.map((day, di) => {
    const isWeekend = di >= 5;
    const hours = Array.from({length: 24}, (_, hour) => {
      const isBusinessHour = hour >= 8 && hour <= 18;
      if (isWeekend && !isBusinessHour) return 0;
      const base = isBusinessHour ? 30 : 5;
      const riskBoost = highRiskDevices.length * 8;
      const score = Math.round((base + riskBoost) * (0.5 + Math.random() * 0.8));
      return Math.min(100, score);
    });
    return { day, hours };
  });

  return { traffic_by_hour, device_traffic, daily_intensity };
}
export function useScanData() {
  return useQuery<ScanData>({
    queryKey: ["scan-data", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) {
        return getBuiltInDemoData();
      }

      try {
        const [devicesRes, alertsRes, statusRes, scanAlertsRes] = await Promise.all([
          fetch(`${API_BASE}/devices`),
          fetch(`${API_BASE}/status`),
          fetch(`${API_BASE}/scan-alerts`).catch(() => null),
          fetch(`${API_BASE}/status`),
        ]);

        if (!devicesRes.ok || !alertsRes.ok || !statusRes.ok) {
          throw new Error("Live backend unavailable");
        }

        const devicesJson = await devicesRes.json();
        const alertsJson = await alertsRes.json();
        const statusJson = await statusRes.json();
        const scanAlertsJson = scanAlertsRes ? await scanAlertsRes.json().catch(() => ({ alerts: [] })) : { alerts: [] };

        const devices: Device[] = (devicesJson.devices || []).map(mapBackendDevice);
        const honeypot_alerts: HoneypotAlert[] = alertsJson.alerts || [];
        const scan_alerts: Alert[] = (scanAlertsJson.alerts || []).map((a: any) => ({
          id: a.id,
          timestamp: a.timestamp,
          severity: a.severity?.toLowerCase() || "medium",
          device_name: a.hostname || a.source_ip,
          ip: a.source_ip,
          title: a.type?.replace(/_/g, " ") || "Scan Alert",
          description: a.detail || "",
          type: "scan",
        }));
        const alerts: Alert[] = [...scan_alerts, ...honeypot_alerts.map(mapHoneypotToAlert)];

        const totalUp = devices.filter((d) => d.state === "up").length;
        const totalDown = devices.filter((d) => d.state === "down").length;

        return {
          scan_metadata: {
            scan_id: "SHURI-LIVE",
            timestamp: statusJson.timestamp || new Date().toISOString(),
            scanner: "SHURI Local Backend",
            targets: devices.map((d) => d.ip),
            ports_scanned: "22,23,80,443,554,1883,8080",
            total_targets: devices.length,
            total_up: totalUp,
            total_down: totalDown,
          },
          devices,
          alerts,
          honeypot_alerts,
          heatmap: generateHeatmapFromDevices(devices),
          report: {
            security_score: Math.max(0, 100 - devices.length * 5 - alerts.length * 3),
            weekly_alerts: [],
            threat_breakdown: [],
            posture_scores: [],
            audit_log: [],
            kpis: {
              security_score: { value: "Live", trend: "Backend connected", up: true },
              devices_online: { value: `${totalUp}`, trend: "Current scan", up: true },
              active_threats: { value: `${alerts.length}`, trend: "Honeypot events", up: alerts.length === 0 },
              resolved_today: { value: "0", trend: "Not tracked", up: true },
            },
          },
        };
      } catch {
        const mockRes = await fetch("/mock_data.json");
        if (mockRes.ok) {
          return await mockRes.json();
        }

        return getBuiltInDemoData();
      }
    },
    staleTime: 5000,
    retry: 1,
    refetchInterval: DEMO_MODE ? false : 5000,
  });
}