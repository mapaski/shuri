"""
SHURI Honeypot Services
Run in Google Colab: each service in a separate thread.

Usage:
    from shuri_honeypots import start_all_honeypots
    start_all_honeypots()   # starts Telnet, HTTP, MQTT, SSH in background threads
"""

import socket
import json
import threading
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

LOG_FILE = "honeypot_alerts.json"


# Shared logging

def log_alert(alert: dict):
    """Append alert to the JSON log file. Thread-safe via a lock."""
    try:
        with _log_lock:
            try:
                with open(LOG_FILE, "r") as f:
                    alerts = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                alerts = []

            alerts.append(alert)

            with open(LOG_FILE, "w") as f:
                json.dump(alerts, f, indent=2)

        print(f"[ALERT] {alert['honeypot_type']} - attacker {alert['attacker_ip']} - {alert.get('mitre_technique', '')}")
    except Exception as e:
        print(f"[LOG ERROR] {e}")

_log_lock = threading.Lock()


# Fake Telnet

def _handle_telnet_client(conn, attacker_ip, port):
    try:
        conn.settimeout(10)
        conn.send(b"\r\nWelcome to IoT Device Management\r\nLogin: ")

        username = conn.recv(256).decode("utf-8", errors="ignore").strip()
        conn.send(b"Password: ")
        password = conn.recv(256).decode("utf-8", errors="ignore").strip()

        log_alert({
            "timestamp": datetime.now().isoformat(),
            "honeypot_type": "fake_telnet",
            "honeypot_port": port,
            "attacker_ip": attacker_ip,
            "credentials_tried": f"{username}:{password}",
            "mitre_technique": "T0812: Default Credentials",
            "severity": "HIGH"
        })

        import time
        time.sleep(1.5)
        conn.send(b"\r\nLogin incorrect\r\n")
    except Exception:
        pass
    finally:
        conn.close()


def run_fake_telnet(port=2323):
    """Fake Telnet honeypot. Logs every credential attempt."""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", port))
    server.listen(10)
    print(f"[HONEYPOT] Fake Telnet on port {port}")

    while True:
        try:
            conn, addr = server.accept()
            t = threading.Thread(target=_handle_telnet_client, args=(conn, addr[0], port), daemon=True)
            t.start()
        except Exception as e:
            print(f"[TELNET ERROR] {e}")


# Fake HTTP Admin

class FakeAdminHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        log_alert({
            "timestamp": datetime.now().isoformat(),
            "honeypot_type": "fake_http_admin",
            "honeypot_port": self.server.server_address[1],
            "attacker_ip": self.client_address[0],
            "path_accessed": self.path,
            "user_agent": self.headers.get("User-Agent", "Unknown"),
            "mitre_technique": "T0846: Remote System Discovery",
            "severity": "MEDIUM"
        })

        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.send_header("Server", "IoT-Device-Admin/1.0")
        self.end_headers()
        self.wfile.write(_FAKE_LOGIN_PAGE.encode())

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8", errors="ignore")
        except Exception:
            body = ""

        log_alert({
            "timestamp": datetime.now().isoformat(),
            "honeypot_type": "fake_http_admin",
            "honeypot_port": self.server.server_address[1],
            "attacker_ip": self.client_address[0],
            "path_accessed": self.path,
            "credentials_posted": body,
            "mitre_technique": "T0812: Default Credentials",
            "severity": "HIGH"
        })

        self.send_response(401)
        self.end_headers()
        self.wfile.write(b"Invalid credentials")


_FAKE_LOGIN_PAGE = """
<!DOCTYPE html>
<html>
<head><title>Smart Camera - Admin Panel</title></head>
<body style="font-family:Arial; background:#f0f0f0; padding:40px;">
<div style="max-width:320px; margin:auto; background:white; padding:24px; border-radius:8px;">
  <h2 style="color:#333; margin-top:0;">Device Admin Panel</h2>
  <p style="color:#666; font-size:12px;">Firmware: lighttpd/1.4.35 | Model: IP-CAM-720P</p>
  <form method="POST" action="/login">
    <label style="font-size:13px;">Username</label><br>
    <input name="user" style="width:100%; padding:6px; margin:4px 0 12px; box-sizing:border-box;"><br>
    <label style="font-size:13px;">Password</label><br>
    <input name="pass" type="password" style="width:100%; padding:6px; margin:4px 0 12px; box-sizing:border-box;"><br>
    <button type="submit" style="width:100%; padding:8px; background:#0066cc; color:white; border:none; border-radius:4px; cursor:pointer;">Login</button>
  </form>
</div>
</body>
</html>
"""


def run_fake_http(port=8080):
    """Fake HTTP admin panel honeypot. Logs GET visits and POST credential attempts."""
    server = HTTPServer(("0.0.0.0", port), FakeAdminHandler)
    print(f"[HONEYPOT] Fake HTTP Admin on port {port}")
    server.serve_forever()


# Fake MQTT

def _handle_mqtt_client(conn, attacker_ip, port):
    try:
        conn.settimeout(10)
        data = conn.recv(1024)

        client_id = _parse_mqtt_client_id(data)

        log_alert({
            "timestamp": datetime.now().isoformat(),
            "honeypot_type": "fake_mqtt",
            "honeypot_port": port,
            "attacker_ip": attacker_ip,
            "mqtt_client_id": client_id,
            "raw_data_hex": data.hex()[:80],
            "mitre_technique": "T0885: Commonly Used Port",
            "severity": "MEDIUM"
        })

        conn.send(bytes([0x20, 0x02, 0x00, 0x00]))

        try:
            more_data = conn.recv(1024)
            if more_data:
                log_alert({
                    "timestamp": datetime.now().isoformat(),
                    "honeypot_type": "fake_mqtt_followup",
                    "honeypot_port": port,
                    "attacker_ip": attacker_ip,
                    "packet_hex": more_data.hex()[:80],
                    "mitre_technique": "T0885: Commonly Used Port",
                    "severity": "LOW"
                })
        except Exception:
            pass

    except Exception:
        pass
    finally:
        conn.close()


def _parse_mqtt_client_id(data: bytes) -> str:
    try:
        if len(data) < 14 or data[0] != 0x10:
            return "unknown"
        idx = 10
        client_id_len = (data[idx] << 8) | data[idx + 1]
        client_id = data[idx + 2: idx + 2 + client_id_len].decode("utf-8", errors="ignore")
        return client_id or "empty"
    except Exception:
        return "parse_error"


def run_fake_mqtt(port=1883):
    """Fake MQTT broker honeypot. Logs every connection and client ID."""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", port))
    server.listen(10)
    print(f"[HONEYPOT] Fake MQTT on port {port}")

    while True:
        try:
            conn, addr = server.accept()
            t = threading.Thread(target=_handle_mqtt_client, args=(conn, addr[0], port), daemon=True)
            t.start()
        except Exception as e:
            print(f"[MQTT ERROR] {e}")


# Fake SSH

def run_fake_ssh(port=2222):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", port))
    server.listen(10)
    print(f"[HONEYPOT] Fake SSH on port {port}")

    while True:
        try:
            conn, addr = server.accept()
            t = threading.Thread(target=_handle_ssh_client, args=(conn, addr[0], port), daemon=True)
            t.start()
        except Exception as e:
            print(f"[SSH ERROR] {e}")


def _handle_ssh_client(conn, attacker_ip, port):
    try:
        conn.settimeout(10)
        conn.send(b"SSH-2.0-OpenSSH_7.4p1 Ubuntu-10ubuntu0.1\r\n")
        client_banner = conn.recv(256).decode("utf-8", errors="ignore").strip()

        log_alert({
            "timestamp": datetime.now().isoformat(),
            "honeypot_type": "fake_ssh",
            "honeypot_port": port,
            "attacker_ip": attacker_ip,
            "client_banner": client_banner,
            "mitre_technique": "T0886: Remote Services",
            "severity": "HIGH"
        })

    except Exception:
        pass
    finally:
        conn.close()


# Start all honeypots

def start_all_honeypots(telnet_port=2323, http_port=8080, mqtt_port=1883, ssh_port=2222):
    services = [
        ("Telnet", run_fake_telnet, telnet_port),
        ("HTTP",   run_fake_http,   http_port),
        ("MQTT",   run_fake_mqtt,   mqtt_port),
        ("SSH",    run_fake_ssh,    ssh_port),
    ]

    for name, fn, port in services:
        t = threading.Thread(target=fn, args=(port,), daemon=True, name=f"honeypot-{name}")
        t.start()

    print("\n" + "=" * 40)
    print("SHURI Honeypots running:")
    print(f"  Fake Telnet  -> port {telnet_port}")
    print(f"  Fake HTTP    -> port {http_port}")
    print(f"  Fake MQTT    -> port {mqtt_port}")
    print(f"  Fake SSH     -> port {ssh_port}")
    print(f"  Alerts log   -> {LOG_FILE}")
    print("=" * 40 + "\n")


if __name__ == "__main__":
    start_all_honeypots()

    import time
    print("Honeypots active. Waiting for connections...")
    try:
        while True:
            time.sleep(60)
            try:
                with open(LOG_FILE) as f:
                    alerts = json.load(f)
                print(f"[STATUS] {len(alerts)} total alerts logged.")
            except Exception:
                pass
    except KeyboardInterrupt:
        print("Honeypots stopped.")