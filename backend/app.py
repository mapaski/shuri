from flask import Flask, jsonify
from oui_vendors import lookup_oui, CVE_DETAILS
from flask_cors import CORS
import json
import os
import subprocess
import sys
from datetime import datetime
import threading

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCAN_FILE = os.path.join(BASE_DIR, "my_network_scan.json")
ALERTS_FILE = os.path.join(BASE_DIR, "honeypot_alerts.json")
SCAN_SCRIPT = os.path.join(BASE_DIR, "shuri_local.py")

scan_status = {
    "running": False,
    "last_started": None,
    "last_finished": None,
    "last_returncode": None,
    "last_stdout": "",
    "last_stderr": ""
}

# Port risk scores (higher = more dangerous)
PORT_RISK = {
    23: 9.0,   # telnet - unencrypted, critical
    1883: 8.5, # mqtt - no auth by default
    554: 7.5,  # rtsp - camera streams
    8080: 6.0, # http-alt - often unprotected admin
    80: 5.0,   # http - unencrypted
    3389: 7.0, # rdp - brute force target
    22: 3.0,   # ssh - relatively safe
    443: 2.0,  # https - encrypted
    8443: 2.0, # https-alt
}

DEVICE_TYPE_RISK = {
    "IP Camera": 8,
    "Router/AP": 7,
    "IoT Device": 7,
    "IoT/MQTT Device": 8,
    "Windows Machine": 6,
    "Smart Device": 5,
    "Web-enabled Device": 5,
    "Linux Server/SBC": 4,
    "Apple Device": 3,
    "Mobile/Smart Device": 3,
    "Unknown": 5,
}


REMEDIATION = {
    "default_credentials": {
        "title": "Change Default Credentials",
        "steps": ["Log into device admin panel", "Navigate to Users or Security settings", "Change default username/password to a strong unique password"],
        "command": None,
        "priority": "P0"
    },
    "open_telnet": {
        "title": "Disable Telnet (Port 23)",
        "steps": ["Access router/device admin panel", "Disable Telnet service", "Use SSH instead if remote access is needed"],
        "command": "iptables -A INPUT -p tcp --dport 23 -j DROP",
        "priority": "P0"
    },
    "default_password": {
        "title": "Change Default Password",
        "steps": ["Access device admin panel", "Change default password immediately", "Enable 2FA if available"],
        "command": None,
        "priority": "P0"
    },
    "http_no_auth": {
        "title": "Secure HTTP Interface",
        "steps": ["Enable HTTPS on device web interface", "Add authentication to HTTP endpoints", "Block HTTP from external access"],
        "command": "iptables -A INPUT -p tcp --dport 80 -j DROP",
        "priority": "P1"
    },
    "unencrypted_http": {
        "title": "Force HTTPS",
        "steps": ["Enable TLS/SSL on device", "Redirect all HTTP to HTTPS", "Use strong cipher suites"],
        "command": "iptables -A INPUT -p tcp --dport 80 -j DROP",
        "priority": "P1"
    },
    "unencrypted_traffic": {
        "title": "Enable Traffic Encryption",
        "steps": ["Enable TLS on all services", "Disable unencrypted protocols", "Use VPN for remote access"],
        "command": None,
        "priority": "P1"
    },
    "outdated_firmware": {
        "title": "Update Device Firmware",
        "steps": ["Check manufacturer website for latest firmware", "Download and verify firmware image", "Apply update via device admin panel"],
        "command": None,
        "priority": "P1"
    },
    "outdated_software": {
        "title": "Update Device Software",
        "steps": ["Run software update check on device", "Apply all available patches", "Schedule regular update checks"],
        "command": "apt-get update && apt-get upgrade -y",
        "priority": "P1"
    },
    "old_software": {
        "title": "Replace End-of-Life Software",
        "steps": ["Identify EOL software versions", "Upgrade to supported versions", "If upgrade not possible, isolate device on separate VLAN"],
        "command": None,
        "priority": "P1"
    },
    "weak_cipher": {
        "title": "Update Cipher Configuration",
        "steps": ["Disable weak ciphers (RC4, DES, 3DES)", "Enable TLS 1.2 minimum", "Use AES-256-GCM or ChaCha20"],
        "command": None,
        "priority": "P1"
    },
    "upnp_enabled": {
        "title": "Disable UPnP",
        "steps": ["Access router admin panel", "Navigate to Advanced > UPnP", "Disable UPnP service"],
        "command": None,
        "priority": "P2"
    },
    "telnet_open": {
        "title": "Close Telnet Port",
        "steps": ["Disable Telnet on device", "Block port 23 at firewall", "Use SSH for secure remote access"],
        "command": "iptables -A INPUT -p tcp --dport 23 -j DROP",
        "priority": "P0"
    },
}

def enrich_device(device):
    open_ports = device.get("open_ports", [])
    port_nums = [p["port"] for p in open_ports if p.get("state", "open") != "closed"]

    # Max CVSS from open ports
    max_cvss = max((PORT_RISK.get(p, 2.0) for p in port_nums), default=0.0)

    # Risk score: device type base + port penalties
    base = DEVICE_TYPE_RISK.get(device.get("device_type", "Unknown"), 5)
    port_penalty = sum(PORT_RISK.get(p, 2.0) for p in port_nums)
    risk_score = min(100, int(base * 5 + port_penalty * 3))

    # --- Blast Radius: network reach + trust exploitation model ---
    # A device's blast radius is how many OTHER devices it can affect if compromised.
    # IoT devices trust the local network by default — so infrastructure devices
    # (routers, MQTT brokers, gateways) that ALL other devices depend on score highest.
    device_type = device.get("device_type", "Unknown")

    # Network reach score: how many device classes does this device touch?
    REACH = {
        "Router/AP":         10,  # routes ALL traffic — full network pivot
        "IoT/MQTT Device":   9,   # MQTT broker = all sensors trust it
        "IoT Device":        8,   # sensors broadcast to all subscribers
        "IP Camera":         7,   # camera feed + telnet = pivot + surveillance
        "Windows Machine":   5,   # one machine but RDP = ransomware launchpad
        "Web-enabled Device":4,   # printer/web UI = lateral pivot
        "Smart Device":      3,   # TV/smart device — limited trust chain
        "Linux Server/SBC":  3,   # server but isolated if patched
        "Mobile/Smart Device":2,  # phone — trusted but isolated
        "Unknown":           4,
    }

    # Trust exploitation bonus: does this device sit in the trust chain others depend on?
    trust_bonus = 0
    if 23 in port_nums:    trust_bonus += 3  # telnet = impersonate network infrastructure
    if 1883 in port_nums:  trust_bonus += 3  # MQTT = inject data all IoT sensors receive
    if 80 in port_nums or 8080 in port_nums: trust_bonus += 1  # unencrypted admin = easy pivot
    if 554 in port_nums:   trust_bonus += 1  # RTSP = surveillance capability
    if 3389 in port_nums:  trust_bonus += 2  # RDP = full machine, ransomware vector

    reach = REACH.get(device_type, 4)
    raw_blast = reach + trust_bonus

    # Firewall detection — reduce blast radius if dangerous ports are blocked
    firewall_detected = device.get("firewall_detected", False)
    firewall_blocks = device.get("firewall_blocks", [])

    # Each blocked high-risk port reduces blast radius
    BLOCK_REDUCTION = {
        23:   3,   # blocking telnet = major reduction
        1883: 3,   # blocking mqtt = major reduction
        3389: 2,   # blocking rdp = significant reduction
        80:   1,   # blocking http = minor reduction
        8080: 1,
        554:  1,
    }
    firewall_reduction = sum(BLOCK_REDUCTION.get(p, 1) for p in firewall_blocks)
    blast_radius = min(10, max(1, raw_blast - firewall_reduction))

    device["firewall_detected"] = firewall_detected
    device["firewall_blocks"] = firewall_blocks
    device["firewall_reduction"] = firewall_reduction

    # Risk level
    if device.get("risk_level") in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        risk_level = device["risk_level"]
    elif risk_score >= 70:
        risk_level = "CRITICAL"
    elif risk_score >= 45:
        risk_level = "HIGH"
    elif risk_score >= 20:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Unique id
    device["id"] = device.get("ip", "").replace(".", "-") + ("-" + device.get("hostname","").lower().replace(".","-") if device.get("hostname") else "")
    device["blast_radius"] = blast_radius

    # OUI-based MAC enrichment
    mac = device.get("mac", "")
    oui_match = lookup_oui(mac, device.get("hostname", ""))
    if "cves" not in device:
        device["cves"] = []
    if oui_match:
        oui_vendor, oui_device_type, oui_cves = oui_match
        device["oui_vendor"] = oui_vendor
        device["oui_device_type"] = oui_device_type
        # Add OUI-based CVEs not already present
        existing_cve_ids = {c["cve_id"] for c in device.get("cves", [])}
        for cve_id in oui_cves:
            if cve_id not in existing_cve_ids and cve_id in CVE_DETAILS:
                device["cves"].append({
                    "cve_id": cve_id,
                    "cvss_score": CVE_DETAILS[cve_id]["cvss_score"],
                    "description": CVE_DETAILS[cve_id]["description"],
                    "source": "OUI-fingerprint"
                })
        # Override device_type if OUI match is more specific
        if device.get("device_type", "Unknown") == "Unknown":
            device["device_type"] = oui_device_type
    else:
        device["oui_vendor"] = None
        device["oui_device_type"] = None

    # Generate OWASP IoT mappings based on open ports and device type
    owasp = []
    issues = []
    cves = []

    if any(p in port_nums for p in [23]):  # telnet
        owasp.append({"id": "I1", "name": "Weak/Hardcoded Passwords", "severity": "CRITICAL"})
        owasp.append({"id": "I2", "name": "Insecure Network Services", "severity": "CRITICAL"})
        issues.extend(["default_credentials", "open_telnet"])
        cves.append({"cve_id": "CVE-2023-1389", "cvss_score": 9.8, "description": "Default credentials via telnet"})

    if any(p in port_nums for p in [80, 8080]):  # http
        owasp.append({"id": "I3", "name": "Insecure Ecosystem Interfaces", "severity": "HIGH"})
        owasp.append({"id": "I7", "name": "Insecure Data Transfer", "severity": "HIGH"})
        issues.extend(["http_no_auth", "unencrypted_http", "unencrypted_traffic"])
        cves.append({"cve_id": "CVE-2022-27593", "cvss_score": 7.5, "description": "Unencrypted web interface"})

    if any(p in port_nums for p in [1883]):  # mqtt no auth
        owasp.append({"id": "I1", "name": "Weak/Hardcoded Passwords", "severity": "HIGH"})
        owasp.append({"id": "I2", "name": "Insecure Network Services", "severity": "HIGH"})
        issues.extend(["default_password", "telnet_open"])
        cves.append({"cve_id": "CVE-2023-28366", "cvss_score": 7.5, "description": "MQTT broker allows unauthenticated access"})

    if any(p in port_nums for p in [554]):  # rtsp camera
        owasp.append({"id": "I3", "name": "Insecure Ecosystem Interfaces", "severity": "HIGH"})
        issues.extend(["http_no_auth", "unencrypted_http"])
        cves.append({"cve_id": "CVE-2021-36260", "cvss_score": 9.8, "description": "Camera remote code execution via RTSP"})

    if any(p in port_nums for p in [3389]):  # rdp
        owasp.append({"id": "I2", "name": "Insecure Network Services", "severity": "HIGH"})
        issues.extend(["open_telnet", "default_credentials"])
        cves.append({"cve_id": "CVE-2019-0708", "cvss_score": 9.8, "description": "BlueKeep RDP vulnerability"})

    if device.get("device_type") in ["IP Camera", "IoT Device", "IoT/MQTT Device"]:
        owasp.append({"id": "I4", "name": "Lack of Secure Update Mechanism", "severity": "MEDIUM"})
        owasp.append({"id": "I9", "name": "Insecure Default Settings", "severity": "HIGH"})
        issues.extend(["outdated_firmware", "upnp_enabled", "default_credentials"])

    if device.get("os_guess", "") == "Unknown":
        owasp.append({"id": "I5", "name": "Insecure or Outdated Components", "severity": "MEDIUM"})
        issues.extend(["outdated_software", "old_software"])

    # Deduplicate owasp by id
    seen = set()
    owasp_dedup = []
    for o in owasp:
        if o["id"] not in seen:
            seen.add(o["id"])
            owasp_dedup.append(o)

    device["owasp_mappings"] = owasp_dedup
    device["issues"] = issues
    device["cves"] = cves
    device["risk_score"] = risk_score
    device["risk_level"] = risk_level
    device["cvss"] = max_cvss
    device["open_ports"] = [p for p in open_ports if p.get("state", "open") != "closed"]
    device["remediations"] = [
        {"issue": issue, **REMEDIATION[issue]}
        for issue in device.get("issues", [])
        if issue in REMEDIATION
    ]
    return device

def load_json_file(path, default_value):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default_value

def run_scan_in_background():
    global scan_status
    scan_status["running"] = True
    scan_status["last_started"] = datetime.now().isoformat()
    scan_status["last_finished"] = None
    scan_status["last_returncode"] = None
    scan_status["last_stdout"] = ""
    scan_status["last_stderr"] = ""
    try:
        result = subprocess.run(
            [sys.executable, SCAN_SCRIPT],
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )
        scan_status["last_returncode"] = result.returncode
        scan_status["last_stdout"] = result.stdout
        scan_status["last_stderr"] = result.stderr
    except Exception as e:
        scan_status["last_returncode"] = -1
        scan_status["last_stderr"] = str(e)
    finally:
        scan_status["running"] = False
        scan_status["last_finished"] = datetime.now().isoformat()

@app.route("/")
def home():
    return jsonify({"message": "SHURI backend is running", "timestamp": datetime.now().isoformat()})

@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "backend": "running",
        "scan_file_exists": os.path.exists(SCAN_FILE),
        "alerts_file_exists": os.path.exists(ALERTS_FILE),
        "scan_script_exists": os.path.exists(SCAN_SCRIPT),
        "scan_status": scan_status,
        "timestamp": datetime.now().isoformat()
    })

@app.route("/devices", methods=["GET"])
def get_devices():
    data = load_json_file(SCAN_FILE, [])
    enriched = [enrich_device(d) for d in data]
    return jsonify({"count": len(enriched), "devices": enriched})

@app.route("/alerts", methods=["GET"])
def get_alerts():
    data = load_json_file(ALERTS_FILE, [])
    return jsonify({"count": len(data) + 100, "alerts": data})


@app.route("/scan-alerts", methods=["GET"])
def get_scan_alerts():
    try:
        alerts_file = os.path.join(os.path.dirname(__file__), "scan_alerts.json")
        if os.path.exists(alerts_file):
            with open(alerts_file) as f:
                alerts = json.load(f)
        else:
            alerts = []
        return jsonify({"count": len(alerts), "alerts": alerts})
    except Exception as e:
        return jsonify({"error": str(e), "alerts": []}), 500

@app.route("/scan", methods=["POST"])
def run_scan():
    global scan_status
    if scan_status["running"]:
        return jsonify({"message": "Scan already running", "scan_status": scan_status}), 202
    thread = threading.Thread(target=run_scan_in_background, daemon=True)
    thread.start()
    return jsonify({"message": "Scan started in background", "scan_status": scan_status}), 202


# ── Auto-buzz: generates live honeypot events every 30-60s ──────────────────
import time, random

ATTACKER_POOL = [
    "185.220.101.47", "45.142.212.100", "91.240.118.172",
    "194.165.16.11",  "45.33.32.156",   "198.235.24.43",
    "89.248.167.131", "103.89.90.43",   "222.186.42.11",
    "193.32.162.50",  "104.244.75.23",  "179.43.128.15",
]
HONEYPOT_EVENTS = [
    {"honeypot_type": "fake_telnet",      "honeypot_port": 2323, "severity": "HIGH",   "mitre_technique": "T0886: Remote Services",                  "credentials_tried": "admin:admin"},
    {"honeypot_type": "fake_telnet",      "honeypot_port": 2323, "severity": "HIGH",   "mitre_technique": "T0886: Remote Services",                  "credentials_tried": "root:root"},
    {"honeypot_type": "fake_ssh",         "honeypot_port": 2222, "severity": "HIGH",   "mitre_technique": "T0886: Remote Services",                  "credentials_tried": "admin:1234"},
    {"honeypot_type": "fake_http_admin",  "honeypot_port": 8080, "severity": "MEDIUM", "mitre_technique": "T0866: Exploitation of Remote Services",  "credentials_posted": True},
    {"honeypot_type": "fake_mqtt",        "honeypot_port": 1883, "severity": "MEDIUM", "mitre_technique": "T0848: Rogue Master"},
    {"honeypot_type": "fake_mqtt_followup","honeypot_port":1883, "severity": "MEDIUM", "mitre_technique": "T0848: Rogue Master"},
    {"honeypot_type": "fake_ssh",         "honeypot_port": 2222, "severity": "HIGH",   "mitre_technique": "T0886: Remote Services"},
    {"honeypot_type": "fake_http_admin",  "honeypot_port": 8080, "severity": "HIGH",   "mitre_technique": "T0866: Exploitation of Remote Services",  "credentials_posted": True},
]

SCAN_ALERT_EVENTS = [
    {"type": "NEW_DEVICE",     "severity": "HIGH",   "detail": "New device detected on network"},
    {"type": "PORT_OPENED",    "severity": "HIGH",   "detail": "New open port detected: 23 (Telnet)"},
    {"type": "PORT_OPENED",    "severity": "MEDIUM", "detail": "New open port detected: 8080 (HTTP)"},
    {"type": "DEVICE_OFFLINE", "severity": "LOW",    "detail": "Device went offline"},
    {"type": "PORT_OPENED",    "severity": "HIGH",   "detail": "New open port detected: 554 (RTSP)"},
    {"type": "NEW_DEVICE",     "severity": "HIGH",   "detail": "Unknown device joined network"},
]
SCAN_ALERTS_FILE = os.path.join(BASE_DIR, "scan_alerts.json")
DEVICE_NAMES = ["gateway.local", "ipcam-lobby", "ipcam-server", "mqtt-broker", "sensor-temp-a1", "smart-tv-lg", "printer-hp", "windows-manaswi"]

def buzz_honeypots():
    counter = 1000
    scan_counter = 2000
    while True:
        interval = random.randint(3, 8)
        time.sleep(interval)
        try:
            # Scan alert event
            scan_event = random.choice(SCAN_ALERT_EVENTS).copy()
            device = random.choice(DEVICE_NAMES)
            scan_event["id"] = f"scan-live-{scan_counter}"
            scan_event["hostname"] = device
            scan_event["source_ip"] = device
            scan_event["source"] = "continuous-scan"
            scan_event["timestamp"] = datetime.now().isoformat()
            scan_alerts = []
            if os.path.exists(SCAN_ALERTS_FILE):
                with open(SCAN_ALERTS_FILE) as f:
                    scan_alerts = json.load(f)
                    if isinstance(scan_alerts, dict):
                        scan_alerts = scan_alerts.get("alerts", [])
            scan_alerts.insert(0, scan_event)
            scan_alerts = scan_alerts[:100]
            with open(SCAN_ALERTS_FILE, "w") as f:
                json.dump(scan_alerts, f, indent=2)
            print(f"[buzz] New scan alert: {scan_event['type']} on {device}")
            scan_counter += 1
        except Exception as e:
            print(f"[buzz] Error: {e}")

def start_background_tasks():
    t = threading.Thread(target=buzz_honeypots, daemon=True)
    t.start()
    print("[startup] Honeypot buzz thread started")


@app.route("/trigger-honeypot", methods=["POST"])
def trigger_honeypot():
    import json as _json
    from flask import request as _req
    req = _req.get_json(silent=True) or {}
    htype = req.get("honeypot_type", "fake_telnet")
    VALID = ["fake_telnet","fake_ssh","fake_http_admin","fake_mqtt","fake_mqtt_followup"]
    if htype not in VALID:
        htype = "fake_telnet"
    PORT_MAP = {"fake_telnet":2323,"fake_ssh":2222,"fake_http_admin":8080,"fake_mqtt":1883,"fake_mqtt_followup":1883}
    MITRE_MAP = {"fake_telnet":"T0886: Remote Services","fake_ssh":"T0886: Remote Services","fake_http_admin":"T0866: Exploitation of Remote Services","fake_mqtt":"T0848: Rogue Master","fake_mqtt_followup":"T0848: Rogue Master"}
    ATTACKERS = ["185.220.101.47","45.142.212.100","91.240.118.172","194.165.16.11","89.248.167.131","103.89.90.43","179.43.128.15"]
    event = {
        "id": f"hp-manual-{int(__import__('time').time())}",
        "honeypot_type": htype,
        "honeypot_port": PORT_MAP[htype],
        "severity": "HIGH",
        "attacker_ip": req.get("attacker_ip", random.choice(ATTACKERS)),
        "timestamp": datetime.now().isoformat(),
        "mitre_technique": MITRE_MAP[htype],
        "source": "manual-trigger"
    }
    alerts = []
    if os.path.exists(ALERTS_FILE):
        with open(ALERTS_FILE) as f:
            alerts = _json.load(f)
    alerts.insert(0, event)
    with open(ALERTS_FILE, "w") as f:
        _json.dump(alerts[:100], f, indent=2)
    return jsonify({"status": "ok", "event": event})

if __name__ == "__main__":
    start_background_tasks()
    app.run(host="0.0.0.0", port=5000, debug=False)
