#!/bin/bash
# startup.sh - Refactored for Robustness and Clear Logging

echo "Starting startup script..."

# --- Setup & Debugging ---
set -x # Enable debug mode - VERY HELPFUL FOR LOGS
set -e # Exit immediately on error

# --- Helper Functions ---
error_exit() {
  echo "ERROR: $1"
  exit 1
}

log_step() {
  echo "--- STEP: $1 ---"
}

# --- Get Port ---
PORT="${PORT:=3000}" # Default to 3000 if PORT env var is not set

# --- Server Directory Setup ---
log_step "Navigating to server directory: /home/site/wwwroot/executrainserver"
cd /home/site/wwwroot/executrainserver || error_exit "Navigation to server directory failed!"

log_step "Installing server dependencies using npm ci"
npm ci || error_exit "npm ci for server dependencies failed!"

# --- App Directory Setup ---
log_step "Navigating to app directory: /home/site/wwwroot/executrainsim"
cd /home/site/wwwroot/executrainsim || error_exit "Navigation to app directory failed!"

log_step "Installing app dependencies using npm ci"
npm ci || error_exit "npm ci for app dependencies failed!"

# --- Start Server with pm2 ---
log_step "Starting server with pm2: /home/site/wwwroot/executrainserver/server.js"
pm2 start /home/site/wwwroot/executrainserver/server.js --name executrainserver --update-env --log "/home/LogFiles/pm2.log" || error_exit "pm2 server start failed!"

echo "Server started successfully on port $PORT"
echo "Startup script completed successfully."

# --- Keep Container Running ---
tail -f /dev/null # Keep the container alive