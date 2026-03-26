from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({
        "message": "SHURI Flask API is running"
    })

@app.route("/devices", methods=["GET"])
def get_devices():
    if os.path.exists("my_network_scan.json"):
        with open("my_network_scan.json", "r") as f:
            data = json.load(f)
        return jsonify(data)
    else:
        return jsonify({"error": "my_network_scan.json not found"}), 404

@app.route("/alerts", methods=["GET"])
def get_alerts():
    if os.path.exists("honeypot_alerts.json"):
        with open("honeypot_alerts.json", "r") as f:
            data = json.load(f)
        return jsonify(data)
    else:
        return jsonify([])

@app.route("/scan", methods=["POST"])
def run_scan():
    return jsonify({
        "message": "Scan endpoint is ready. We will connect real scan later."
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)