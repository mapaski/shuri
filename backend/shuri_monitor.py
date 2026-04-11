"""
shuri_monitor.py - Continuous network scan daemon
Scans every 90 seconds, diffs results, writes alerts to scan_alerts.json
"""
import json, time, os, datetime
import nmap

SCAN_INTERVAL = 90
SCAN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "my_network_scan.json")
ALERTS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scan_alerts.json")

def get_subnet():
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "shuri_local.py")) as f:
            for line in f:
                if "MY_NETWORK" in line and "=" in line:
                    return line.split("=")[1].strip().strip('"').strip("'")
    except:
        pass
    return "172.20.0.0/24"

def quick_scan(subnet):
    nm = nmap.PortScanner()
    try:
        nm.scan(hosts=subnet, arguments='-sn -T4 --unprivileged', timeout=60)
        devices = {}
        for host in nm.all_hosts():
            p_nm = nmap.PortScanner()
            try:
                p_nm.scan(host, '22,23,80,443,554,1883,8080,3389,9100',
                          arguments='-T4 --unprivileged', timeout=20)
                open_ports = []
                if host in p_nm.all_hosts() and 'tcp' in p_nm[host]:
                    open_ports = [p for p, d in p_nm[host]['tcp'].items()
                                  if d['state'] == 'open']
            except:
                open_ports = []
            devices[host] = {
                'hostname': nm[host].hostname() or host,
                'state': nm[host].state(),
                'open_ports': open_ports,
            }
        return devices
    except Exception as e:
        print(f"[monitor] Scan error: {e}")
        return {}

def load_alerts():
    try:
        with open(ALERTS_FILE) as f:
            return json.load(f)
    except:
        return []

def save_alerts(alerts):
    with open(ALERTS_FILE, 'w') as f:
        json.dump(alerts, f, indent=2)

def make_alert(alert_type, host, hostname, detail, severity="MEDIUM"):
    return {
        "id": f"scan-{int(time.time())}-{host.replace('.', '-')}",
        "timestamp": datetime.datetime.now().isoformat(),
        "type": alert_type,
        "source_ip": host,
        "hostname": hostname,
        "detail": detail,
        "severity": severity,
        "source": "continuous-scan"
    }

def diff_scans(prev, curr):
    alerts = []
    prev_ips = set(prev.keys())
    curr_ips = set(curr.keys())
    HIGH_RISK = {23, 1883, 3389, 554}

    for ip in curr_ips - prev_ips:
        d = curr[ip]
        alerts.append(make_alert("NEW_DEVICE", ip, d['hostname'],
            f"New device detected: {d['hostname']} ({ip}) ports={d['open_ports']}", "HIGH"))

    for ip in prev_ips - curr_ips:
        d = prev[ip]
        alerts.append(make_alert("DEVICE_OFFLINE", ip, d['hostname'],
            f"Device went offline: {d['hostname']} ({ip})", "LOW"))

    for ip in curr_ips & prev_ips:
        prev_ports = set(prev[ip].get('open_ports', []))
        curr_ports = set(curr[ip].get('open_ports', []))
        hostname = curr[ip]['hostname']
        new_ports = curr_ports - prev_ports
        closed_ports = prev_ports - curr_ports
        if new_ports:
            sev = "CRITICAL" if new_ports & HIGH_RISK else "MEDIUM"
            alerts.append(make_alert("PORT_OPENED", ip, hostname,
                f"New ports opened on {hostname}: {sorted(new_ports)}", sev))
        if closed_ports:
            alerts.append(make_alert("PORT_CLOSED", ip, hostname,
                f"Ports closed on {hostname}: {sorted(closed_ports)}", "LOW"))
    return alerts

def main():
    print("[monitor] SHURI continuous scan daemon starting...")
    subnet = get_subnet()
    print(f"[monitor] Watching: {subnet}")
    prev_scan = {}
    if os.path.exists(SCAN_FILE):
        try:
            with open(SCAN_FILE) as f:
                devices = json.load(f)
            for d in devices:
                prev_scan[d['ip']] = {
                    'hostname': d.get('hostname', d['ip']),
                    'open_ports': [p['port'] for p in d.get('open_ports', [])
                                   if p.get('state') == 'open'],
                }
            print(f"[monitor] Baseline: {len(prev_scan)} devices")
        except Exception as e:
            print(f"[monitor] Baseline error: {e}")

    while True:
        print(f"[monitor] Scanning {subnet}...")
        curr_scan = quick_scan(subnet)
        print(f"[monitor] Found {len(curr_scan)} devices")
        if prev_scan:
            new_alerts = diff_scans(prev_scan, curr_scan)
            if new_alerts:
                existing = load_alerts()
                existing = new_alerts + existing
                existing = existing[:200]
                save_alerts(existing)
                print(f"[monitor] {len(new_alerts)} new alert(s)")
            else:
                print("[monitor] No changes")
        prev_scan = curr_scan
        print(f"[monitor] Next scan in {SCAN_INTERVAL}s")
        time.sleep(SCAN_INTERVAL)

if __name__ == "__main__":
    main()
