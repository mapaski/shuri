import { useQuery } from "@tanstack/react-query";

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
  x_powered_by: string;
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
  software: string;
  version: string;
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

export function useScanData() {
  return useQuery<ScanData>({
    queryKey: ["scan-data"],
    queryFn: async () => {
      const res = await fetch(import.meta.env.BASE_URL + "mock_data.json");
      if (!res.ok) throw new Error("Failed to load scan data");
      return res.json();
    },
    staleTime: Infinity,
    retry: 2,
  });
}
