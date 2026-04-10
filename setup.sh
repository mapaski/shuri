#!/bin/bash
set -e

echo "============================================================"
echo "SHURI - Setup"
echo "============================================================"

# Dependencies
echo "[1/4] Installing system dependencies..."
sudo apt update -qq && sudo apt install -y git python3 python3-venv nmap nodejs npm tmux

# Fix requirements.txt if needed
sed -i 's/flask-corspyngrok/flask-cors\npyngrok/' ~/shuri/backend/requirements.txt 2>/dev/null || true

# Python venv
echo "[2/4] Setting up Python environment..."
cd ~/shuri/backend
python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
pip install -q python-nmap requests

# Frontend
echo "[3/4] Installing frontend dependencies..."
cd ~/shuri/frontend/shuri-dashboard
npm install --silent

# Launch script
echo "[4/4] Creating launch script..."
cat > ~/shuri/start.sh << 'STARTEOF'
#!/bin/bash
cd ~/shuri/backend
NEW_IP=$(hostname -I | awk '{print $1}')
SUBNET=$(echo $NEW_IP | cut -d'.' -f1-3).0/24
sed -i "s|MY_NETWORK = \".*\"|MY_NETWORK = \"$SUBNET\"|" shuri_local.py
echo "✓ Subnet set to $SUBNET"

tmux new-session -d -s shuri -n backend \
  "cd ~/shuri/backend && source venv/bin/activate && python3 app.py"
tmux new-window -t shuri -n honeypots \
  "cd ~/shuri/backend && source venv/bin/activate && python3 shuri_honeypots.py"
tmux new-window -t shuri -n frontend \
  "cd ~/shuri/frontend/shuri-dashboard && npm run dev"
tmux attach -t shuri
STARTEOF
chmod +x ~/shuri/start.sh

echo ""
echo "============================================================"
echo "Setup complete! Run this to start SHURI:"
echo "  bash ~/shuri/start.sh"
echo "Then open: http://localhost:5173"
echo "Trigger scan: curl -X POST http://127.0.0.1:5000/scan"
echo "============================================================"
