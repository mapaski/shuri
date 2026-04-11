# SHURI

**SHURI** is an IoT security platform that scans devices on a local network, identifies insecure services and weak configurations, calculates which devices are the most dangerous using blast radius scoring, and detects suspicious activity through honeypots.

It combines local network scanning, vulnerability analysis, attack-surface awareness, and alert logging into one system that can be consumed by a dashboard.

---

## Access SHURI

### Public Demo
Try the hosted SHURI dashboard here:  
[https://shuri-dashboard.vercel.app](https://shuri-dashboard.vercel.app)

> Note: This public deployment is a **demo interface** and uses demo/fallback data for visualization.  
> Real scanning and honeypot monitoring require SHURI to run locally inside the target LAN.

### Local Use
To use SHURI on a real network, run it locally and open:

- Frontend dashboard: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:5000`

---

## Quick Start (Linux)

```bash
git clone https://github.com/mapaski/shuri.git
cd shuri
bash setup.sh
bash ~/shuri/start.sh
```

Then open http://localhost:5173 and trigger a scan:
```bash
curl -X POST http://127.0.0.1:5000/scan
```
> `setup.sh` handles all dependencies, venv, and subnet auto-detection automatically.

---

## Problem Statement

IoT devices such as smart cameras, bulbs, TVs, routers, speakers, and other connected appliances are often the weakest link in a network. They commonly suffer from:

- outdated firmware
- exposed insecure services
- weak or old protocols
- poor visibility for users
- easy lateral movement opportunities for attackers

Most scanners only answer: **what is vulnerable?**

SHURI also asks:

- **what is dangerous?**
- **what can it reach?**
- **is anyone already probing it?**

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

## Architecture

SHURI is designed as a **local edge-deployed IoT defense system**, not a cloud-only scanner.

It runs **inside the target LAN**, which allows it to directly discover and assess local IoT devices that would not be reachable from the public internet.

### Deployment model
- **Scanner** runs locally inside the LAN
- **Honeypots** run locally inside the LAN
- **Flask backend API** runs locally inside the LAN
- **Dashboard frontend** connects to that local backend

This makes SHURI suitable for:
- home networks
- office LANs
- lab environments
- Raspberry Pi deployment

---

## Backend Components

### `backend/shuri_local.py`
Local network scanner.  
Scans a subnet and writes device output to:

- `backend/my_network_scan.json`

### `backend/shuri_honeypots.py`
Runs honeypot services and logs suspicious access attempts to:

- `backend/honeypot_alerts.json`

### `backend/app.py`
Flask API that exposes:

- `GET /status` → backend health and scan state
- `GET /devices` → latest scan results
- `GET /alerts` → latest honeypot alerts
- `POST /scan` → trigger a local scan in the background


---

## Running SHURI Locally

### 1. Install backend dependencies

bash
cd backend
pip install -r requirements.txt


If needed, also install:
bash
pip install flask-cors


Make sure **Nmap** is installed on the machine running SHURI.

---

### 2. Configure your subnet

Find your local subnet automatically:

#### On Windows:
bash
ipconfig


Example:

IPv4 Address: 192.168.29.xx

Use the matching subnet in `backend/shuri_local.py`, for example:

python
MY_NETWORK = "192.168.29.0/24"  # auto-set by start.sh


---

### 3. Start the backend API
bash
cd backend
python app.py


Backend runs on:
http://127.0.0.1:5000
```

---

### 4. Start honeypots

In another terminal:

cd backend
python shuri_honeypots.py
```

Example honeypot trigger:
http://127.0.0.1:8080
```

This creates entries in:

- `backend/honeypot_alerts.json`

---

### 5. Start the frontend dashboard

In another terminal:
bash
cd frontend/shuri-dashboard
npm install
npm run dev

Frontend runs on:
http://127.0.0.1:5173

If port 5173 is already in use, Vite may use another port such as 5174.

---

### 6. Trigger a scan

Use terminal:

bash
curl -X POST http://127.0.0.1:5000/scan


Then refresh the dashboard.

This updates:

- `backend/my_network_scan.json`

---

### 7. Check API endpoints

- Status: `http://127.0.0.1:5000/status`
- Devices: `http://127.0.0.1:5000/devices`
- Alerts: `http://127.0.0.1:5000/alerts`
- Scan trigger: `http://127.0.0.1:5000/scan`

---

## API Endpoints

### `GET /status`
Returns backend status and scan state.

### `GET /devices`
Returns the latest contents of scanned device data.

Response format:
json
{
  "count": 0,
  "devices": []
}


### `GET /alerts`
Returns the latest contents of honeypot alert data.

Response format:
json
{
  "count": 5,
  "alerts": [...]
}


### `POST /scan`
Triggers a background network scan and refreshes device data.

---

## Example Workflow

1. Start the backend with `backend/app.py`
2. Start honeypots with `backend/shuri_honeypots.py`
3. Start the dashboard from `frontend/shuri-dashboard`
4. Trigger a local scan using `POST /scan`
5. SHURI updates `my_network_scan.json`
6. Trigger a honeypot interaction
7. Alerts are written to `honeypot_alerts.json`
8. Frontend dashboard reads `/devices`, `/alerts`, and `/status`

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
- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack React Query
- Wouter

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
- working standalone frontend dashboard

### In Progress
- presentation and documentation polish
- stronger enrichment and scoring logic
- final submission/demo refinement

---

## Limitations

- Local scanning requires **Nmap** installed on the scanning machine
- SHURI must run **inside the target LAN**
- Cloud deployment alone cannot directly scan private home networks without a local agent
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
- persistent storage/database integration

---

## Team PARADIGM '26

- Rushda — scanning engine, Flask API, local testing, backend integration
- Manaswi — dashboard, honeypots, frontend integration, deployment, local testing
- Kshitija — documentation, testing, report, presentation

---

## Summary

SHURI is an IoT security platform that scans local networks, identifies weak points, calculates blast radius, detects suspicious activity using honeypots, and serves everything through a dashboard-ready API.

Its core strength is that it operates **from within the LAN**, making it practical for real local-network IoT defense and suitable for edge deployment on systems like laptops or Raspberry Pi.
