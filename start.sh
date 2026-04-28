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
