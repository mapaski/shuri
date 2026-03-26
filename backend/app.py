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
    return jsonify({
        "message": "SHURI backend is running",
        "timestamp": datetime.now().isoformat()
    })


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
    return jsonify({
        "count": len(data),
        "devices": data
    })


@app.route("/alerts", methods=["GET"])
def get_alerts():
    data = load_json_file(ALERTS_FILE, [])
    return jsonify({
        "count": len(data),
        "alerts": data
    })


@app.route("/scan", methods=["POST"])
def run_scan():
    global scan_status

    if scan_status["running"]:
        return jsonify({
            "message": "Scan already running",
            "scan_status": scan_status
        }), 202

    thread = threading.Thread(target=run_scan_in_background, daemon=True)
    thread.start()

    return jsonify({
        "message": "Scan started in background",
        "scan_status": scan_status
    }), 202


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)