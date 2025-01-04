#!/bin/bash
# Ensure the script itself is executable
chmod +x "$0" || { echo "Failed to set executable permissions for the script"; exit 1; }
# Ensure working directory is set correctly
cd deploy/backend || { echo "Failed to change directory to deploy/backend"; exit 1; }
# Set PORT if not already set
if [ -z "$PORT" ]; then
  export PORT=8080
fi
echo "Starting Node.js server on port $PORT"
# Start the server
node server.js