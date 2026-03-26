# SHURI

SHURI is an IoT security platform that scans devices on a local network, identifies insecure services and weak configurations, calculates which devices are the most dangerous using blast radius scoring, and detects suspicious activity through honeypots.

It combines local network scanning, vulnerability analysis, attack-surface awareness, and alert logging into one system that can be consumed by a dashboard.

---

## Problem Statement

IoT devices such as smart cameras, bulbs, TVs, routers, speakers, and other connected appliances are often the weakest link in a network. They commonly suffer from:

- outdated firmware
- exposed insecure services
- weak or old protocols
- poor visibility for users
- easy lateral movement opportunities for attackers

Most scanners only answer: **what is vulnerable?**

SHURI also asks: **what is dangerous, what can it reach, and is anyone already probing it?**

---

## Key Features

- Local network scanning with Nmap
- Device and port discovery
- HTTP/HTTPS banner grabbing
- Weak protocol and service detection
- CVE lookup support
- OWASP IoT Top 10 mapping
- MITRE ATT&CK mapping
- Blast radius scoring
- Honeypot-based suspicious activity detection
- Flask API for dashboard integration
- JSON-based scan and alert outputs

---

## How SHURI Works

### 1. Scanning
SHURI scans a local subnet and finds active devices, open ports, and available services.

### 2. Analysis
It checks exposed services, performs banner grabbing, identifies weak protocols, and maps findings to known security frameworks.

### 3. Risk Prioritization
Instead of only counting vulnerabilities, SHURI calculates a **blast radius score** to estimate how dangerous a device is based on what else it can expose on the network.

### 4. Honeypots
SHURI runs lightweight fake services such as Telnet, HTTP admin, MQTT, and SSH. If anything interacts with them, the activity is logged as suspicious.

### 5. API Integration
All scan and alert data is served through a Flask API so a frontend dashboard can display devices, alerts, heatmaps, and details.

---

## Backend Components

### `shuri_local.py`
Local network scanner.  
Scans a subnet and writes device output to:
my_network_scan.json

### `shuri_honeypots.py`
Runs honeypot services and logs suspicious access attempts to:

honeypot_alerts.json

### `app.py`
Flask API that exposes:

- `GET / → API status
- `GET /devices → latest scan results
- `GET /alerts → latest honeypot alerts
- `POST /scan → trigger a local scan

---

## Project Structure
shuri/
├── app.py
├── shuri_local.py
├── shuri_honeypots.py
├── my_network_scan.json
├── honeypot_alerts.json
├── requirements.txt
├── render.yaml
└── ...

---

## Running SHURI Locally

### 1. Install dependencies
bash
pip install -r requirements.txt

### 2. Find your network subnet
On Windows:
ipconfig

Example:
IPv4 Address: 192.168.29.69

Use the subnet in shuri_local.py:
python
MY_NETWORK = "192.168.29.0/24"

### 3. Run the scanner
python shuri_local.py

This creates:
my_network_scan.json

### 4. Start the Flask API
python app.py

### 5. Start honeypots
In another terminal:
python shuri_honeypots.py

### 6. Trigger a honeypot
Open:
http://127.0.0.1:8080

This creates entries in:
honeypot_alerts.json

### 7. Check API endpoints
Devices:
http://127.0.0.1:5000/devices

Alerts:
http://127.0.0.1:5000/alerts


Scan trigger:
http://127.0.0.1:5000/scan

---

## API Endpoints

### `GET /`
Returns API status.

### `GET /devices`
Returns the latest contents of my_network_scan.json.

### `GET /alerts`
Returns the latest contents of honeypot_alerts.json.

### `POST /scan`
Runs the scanner and refreshes device data.

---

## Example Workflow

1. Run a local scan using shuri_local.py
2. SHURI generates my_network_scan.json
3. Start the Flask API with app.py
4. Start honeypots with shuri_honeypots.py
5. Trigger a honeypot interaction
6. Alerts are written to honeypot_alerts.json
7. Frontend dashboard reads /devices and /alerts

---

## Tech Stack

### Backend
- Python
- Flask
- Flask-CORS
- Nmap
- python-nmap
- requests
- socket
- threading
- JSON

### Security Logic
- CVE lookup
- OWASP IoT Top 10 mapping
- MITRE ATT&CK mapping
- custom blast radius scoring

### Frontend
- React dashboard
- integrated separately

---

## Current Status

### Implemented
- local network scanning
- device discovery
- banner grabbing
- basic protocol analysis
- Flask API
- honeypot services
- alert logging
- local WiFi testing
- backend integration for dashboard

### In Progress
- final frontend integration
- full dashboard live flow
- presentation and documentation polish

---

## Limitations

- Local scanning requires Nmap installed on the scanning machine
- Cloud deployment cannot directly scan private home networks without a local agent
- Honeypots are lightweight demonstration services
- Some device information depends on what the target exposes

---

## Future Improvements

- Raspberry Pi deployment
- passive traffic monitoring
- richer firmware fingerprinting
- better real-time alert streaming
- automated mitigation actions
- stronger device classification

---

## Team PARADIGM '26

- **Rushda** — scanning engine, Flask API, local testing, backend integration
- **Manaswi** — dashboard, honeypots, frontend integration, deployment
- **Kshitija** — documentation, testing, report, presentation

---

## Summary

SHURI is an IoT security platform that scans local networks, identifies weak points, calculates blast radius, detects suspicious activity using honeypots, and serves everything through a dashboard-ready API.
