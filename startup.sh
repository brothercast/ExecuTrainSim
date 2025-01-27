#!/bin/bash
# startup.sh - Optimized Startup Script for Azure (Based on Previous Commit)

echo "Starting startup script - Optimized Version (Previous Commit Base)..."

# --- Enhanced Debugging and Error Handling ---
set -x  # Enable shell debugging - print every command
set -e  # Exit immediately if a command exits with a non-zero status (error)

error_exit() {
  echo "$(date) - ERROR: $1"
  exit 1
}

LOG_FILE="/home/LogFiles/startup.log"
exec &> >(tee -a "$LOG_FILE") # Redirect all output to log file and stdout

echo "$(date) - Startup script execution started. Logging to $LOG_FILE"

# --- Determine Port - Azure Convention Prioritization ---
PORT=${WEBSITE_PORT:-$PORT}  # Prioritize WEBSITE_PORT if set by Azure
PORT=${PORT:-8080}          # Default to 8080 if neither is set (Standard Azure Default)
export PORT                  # Ensure PORT is exported for Node.js

echo "$(date) - Determined PORT to be: $PORT" # Explicitly log the determined port

# --- Set Node.js Version - Azure Standard Approach ---
NODE_VERSION="~20" # Define desired Node.js version here (e.g., "~20", "~18", etc.)
if [ -z "$WEBSITE_NODE_DEFAULT_VERSION" ]; then
  echo "$(date) - WEBSITE_NODE_DEFAULT_VERSION is not set, setting to ~20"
  export WEBSITE_NODE_DEFAULT_VERSION="$NODE_VERSION" # Or your desired version
fi
echo "$(date) - Using Node.js version: $WEBSITE_NODE_DEFAULT_VERSION"
nvm use "$WEBSITE_NODE_DEFAULT_VERSION" || error_exit "Failed to set Node.js version using NVM"
node -v
npm -v

# --- Navigate to Server Directory ---
SERVER_DIR="/home/site/wwwroot/deploy/executrainserver" # Explicitly define server directory - Adjusted path to 'deploy'
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
  echo "$(date) - WARNING: package.json not found in server directory ($(pwd)). Assuming dependencies are pre-installed."
fi

# --- Start Node.js Server using PM2 Runtime ---
echo "$(date) - Starting Node.js server with pm2-runtime..."
PM2_LOG_FILE="/home/LogFiles/pm2.log" # Define PM2 log file path

# Robust pm2-runtime start with detailed error handling - Corrected path to server.js
if ! pm2-runtime start server.js --no-daemon --name executrainserver --update-env --log "$PM2_LOG_FILE" --no-autorestart; then
  echo "ERROR: pm2-runtime failed to start server! Check PM2 logs for details: $PM2_LOG_FILE"
  pm2 logs executrainserver --lines 100 --error # Show last 100 lines of pm2 error logs
  error_exit "PM2 server startup failure. Terminating startup script."
else
  echo "$(date) - Node.js server started successfully with pm2-runtime on port $PORT. PM2 logs: $PM2_LOG_FILE"
fi

echo "$(date) - Startup script execution completed successfully. Application should be running."

# --- Keep Container Running ---
echo "$(date) - Keeping container alive using 'tail -f /dev/null'"
tail -f /dev/null