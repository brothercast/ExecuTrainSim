#!/bin/bash
# startup.sh - Robust Version with Explicit Port Handling & Logging

echo "Starting startup script - Robust Version..."

# --- Debugging and Error Handling ---
set -x  # Enable shell debugging - print every command
error_exit() {
  echo "ERROR: $1"
  exit 1
}
LOG_FILE="/home/LogFiles/startup.log"
exec &> >(tee -a "$LOG_FILE") # Redirect all output to log file and stdout

echo "$(date) - Startup script started."

# --- Determine Port - Prioritize WEBSITE_PORT, then PORT, then default ---
PORT=${WEBSITE_PORT:-$PORT}  # Prioritize WEBSITE_PORT if set
PORT=${PORT:-3000}          # Default to 3000 if neither is set
export PORT                  # Ensure PORT is exported for Node.js

echo "$(date) - Determined PORT to be: $PORT" # Explicitly log the determined port

# --- Set Node.js Version (Redundant if WEBSITE_NODE_DEFAULT_VERSION is set, but safer) ---
if [ -z "$WEBSITE_NODE_DEFAULT_VERSION" ]; then
  echo "$(date) - WEBSITE_NODE_DEFAULT_VERSION is not set, setting to ~20"
  export WEBSITE_NODE_DEFAULT_VERSION="~20" # Or your desired version
fi
echo "$(date) - Using Node.js version: $WEBSITE_NODE_DEFAULT_VERSION"
nvm use "$WEBSITE_NODE_DEFAULT_VERSION" || error_exit "Failed to set Node.js version using NVM"
node -v
npm -v

# --- Navigate to Deployment Package Root ---
echo "$(date) - Current directory: $(pwd)"
echo "$(date) - Listing contents of /home/site/wwwroot/deployment-package:"
ls -l /home/site/wwwroot/deployment-package/
cd /home/site/wwwroot/deployment-package || error_exit "Failed to navigate to /home/site/wwwroot/deployment-package"
echo "$(date) - Successfully navigated to /home/site/wwwroot/deployment-package"

# --- Install Server Dependencies ---
echo "$(date) - Checking and installing server dependencies with npm ci..."
if [ -f package.json ]; then # Check for package.json in deployment-package (where server.js is)
  npm ci || error_exit "Server dependencies installation failed!"
  echo "$(date) - Server dependencies check complete"
else
  echo "$(date) - WARNING: package.json not found in /home/site/wwwroot/deployment-package. Skipping npm ci (assuming dependencies are deployed)."
fi

# --- Start the Node.js Server using PM2 (Correct Command from Azure Docs) ---
echo "$(date) - Starting server with pm2-runtime on port $PORT, serving React client from ./executrainsim-build..."
PM2_LOG_FILE="/home/LogFiles/pm2.log" # Define PM2 log file variable

# Correct pm2-runtime command to serve static files and start server.js
pm2-runtime start server.js --no-daemon --name executrainserver --update-env --log "$PM2_LOG_FILE" --port $PORT --no-autorestart {
  echo "ERROR: pm2-runtime failed to start server! Check pm2 logs: $PM2_LOG_FILE"
  pm2 logs executrainserver --lines 50 --error # Show last 50 lines of pm2 error logs
  error_exit "pm2-runtime failed to start."
}

echo "$(date) - Successfully started server with pm2-runtime, serving React client and listening on port $PORT"
echo "$(date) - Application is running and serving React client on port $PORT"

# --- Keep Container Running ---
echo "$(date) - Startup script execution finished. Keeping container running with tail -f /dev/null"
tail -f /dev/null