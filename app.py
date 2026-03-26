from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import subprocess
import sys

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
        "message": "SHURI Flask API is running"
    })


@app.route("/devices", methods=["GET"])
def get_devices():
    data = load_json_file(SCAN_FILE, None)
    if data is None:
        return jsonify({"error": "my_network_scan.json not found"}), 404
    return jsonify(data)


@app.route("/alerts", methods=["GET"])
def get_alerts():
    data = load_json_file(ALERTS_FILE, [])
    return jsonify(data)


@app.route("/scan", methods=["POST"])
def run_scan():
    try:
        result = subprocess.run(
            [sys.executable, SCAN_SCRIPT],
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )

        return jsonify({
            "message": "Scan completed",
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        })
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)