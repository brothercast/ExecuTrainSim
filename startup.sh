#!/bin/bash
# startup.sh - Optimized Startup Script for Azure (Corrected Syntax & Port)

echo "Starting startup script - Optimized Version (Syntax & Port Corrected)..."

# --- Debugging and Error Handling ---
set -x  # Enable shell debugging - print every command
set -e  # Exit immediately if a command exits with a non-zero status (error)

error_exit() {
  echo "ERROR: $1"
  exit 1
}

LOG_FILE="/home/LogFiles/startup.log"
exec &> >(tee -a "$LOG_FILE") # Redirect all output to log file and stdout

echo "$(date) - Startup script execution started. Logging to $LOG_FILE"

# --- Determine Port - Prioritize WEBSITE_PORT, then PORT, then default ---
PORT=${WEBSITE_PORT:-$PORT}  # Prioritize WEBSITE_PORT if set
PORT=${PORT:-8080}          # Default to 8080 if neither is set
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

# --- Navigate to Server Directory ---
SERVER_DIR="/home/site/wwwroot/deploy/executrainserver" # Explicitly define server directory
echo "$(date) - Navigating to server directory: $SERVER_DIR"
cd "$SERVER_DIR" || error_exit "Failed to navigate to server directory: $SERVER_DIR. Check deployment package structure."
echo "$(date) - Successfully navigated to: $(pwd)"

# --- Install Server Dependencies ---
echo "$(date) - Checking and installing server dependencies with npm ci..."
if [ -f package.json ]; then
  echo "$(date) - Found package.json. Proceeding with npm ci."
  npm ci || error_exit "Server dependencies installation failed! Check npm ci logs for errors."
  echo "$(date) - Server dependencies installation completed successfully."
else
  echo "$(date) - WARNING: package.json not found in /home/site/wwwroot/deployment-package. Skipping npm ci (assuming dependencies are pre-installed)."
fi

# --- Start Node.js Server using PM2 Runtime - Corrected Syntax and Port ---
echo "$(date) - Starting server with pm2-runtime..."
PM2_LOG_FILE="/home/LogFiles/pm2.log" # Define PM2 log file path

# Corrected pm2-runtime command with standard if-then error checking (SYNTAX CORRECTED, PORT REMOVED)
if ! pm2-runtime start server.js --no-daemon --name executrainserver --update-env --log "$PM2_LOG_FILE" --no-autorestart; then
  echo "ERROR: pm2-runtime failed to start server! Check pm2 logs: $PM2_LOG_FILE"
  pm2 logs executrainserver --lines 100 --error # Show last 100 lines of pm2 error logs
  error_exit "pm2-runtime failed to start."
fi

echo "$(date) - Successfully started server with pm2-runtime. PM2 logs: $PM2_LOG_FILE"
echo "$(date) - Application (server component) is now running."

# --- Keep Container Running ---
echo "$(date) - Startup script execution finished. Keeping container running with tail -f /dev/null"
tail -f /dev/null