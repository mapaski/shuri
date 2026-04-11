from flask import Flask, jsonify
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
    blast_radius = min(10, reach + trust_bonus)

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
    device["id"] = device.get("ip", "").replace(".", "-")
    device["blast_radius"] = blast_radius

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
    return jsonify({"count": len(data), "alerts": data})

@app.route("/scan", methods=["POST"])
def run_scan():
    global scan_status
    if scan_status["running"]:
        return jsonify({"message": "Scan already running", "scan_status": scan_status}), 202
    thread = threading.Thread(target=run_scan_in_background, daemon=True)
    thread.start()
    return jsonify({"message": "Scan started in background", "scan_status": scan_status}), 202

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
