from flask import Flask, jsonify
from flask_cors import CORS
import json
import os
import subprocess
import sys
from datetime import datetime

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCAN_FILE = os.path.join(BASE_DIR, "my_network_scan.json")
ALERTS_FILE = os.path.join(BASE_DIR, "honeypot_alerts.json")
SCAN_SCRIPT = os.path.join(BASE_DIR, "shuri_local.py")


def load_json_file(path, default_value):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default_value


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
    try:
        result = subprocess.run(
            [sys.executable, SCAN_SCRIPT],
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )

        refreshed_data = load_json_file(SCAN_FILE, [])

        return jsonify({
            "message": "Scan completed",
            "returncode": result.returncode,
            "device_count": len(refreshed_data),
            "stdout": result.stdout,
            "stderr": result.stderr
        })
    except Exception as e:
        return jsonify({
            "message": "Scan failed",
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)    app.run(debug=True, host="0.0.0.0", port=5000)
