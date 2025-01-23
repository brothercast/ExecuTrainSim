#!/bin/bash
# startup.sh - Refactored for Robustness and Clear Logging (Improved)

echo "Starting startup script..."

# --- Setup & Debugging ---
set -x # Enable debug mode - VERY HELPFUL FOR LOGS
set -e # Exit immediately on error

# --- Helper Functions ---
error_exit() {
  echo "ERROR: $1"
  echo "Detailed Error Log:"
  cat /home/LogFiles/startup_error.log # Capture full error context
  exit 1
}

log_step() {
  echo "--- STEP: $1 ---"
}

# --- Get Port ---
PORT="${PORT:=3000}" # Default to 3000 if PORT env var is not set
export PORT # Ensure PORT is exported for Node.js app to see

# --- Server Directory Setup ---
SERVER_DIR="/home/site/wwwroot/executrainserver" # Explicitly define server directory
APP_DIR="/home/site/wwwroot/executrainsim"      # Explicitly define app directory

log_step "Navigating to server directory: $SERVER_DIR"
cd "$SERVER_DIR" || error_exit "Navigation to server directory failed!"

log_step "Installing server dependencies using npm ci"
npm ci --logs-dir=/home/LogFiles || error_exit "npm ci for server dependencies failed!" # Log npm ci output

# --- App Directory Setup (Serving Static Files - Important!) ---
log_step "Navigating to app directory: $APP_DIR"
cd "$APP_DIR" || error_exit "Navigation to app directory failed!"

# No npm ci here for the app directory in startup.sh - dependencies are built in GitHub Actions

# --- Serve Static Files (If needed - depends on your server setup) ---
# If your server.js is designed to serve the React app's static files,
# you might not need a separate static file server like Nginx here.
# If your server.js *does not* serve static files, you might need to configure
# Azure Web App to serve the files from /home/site/wwwroot/executrainsim/build
# In many cases, Node.js servers *do* serve static assets.

# --- Start Server with pm2 ---
log_step "Starting server with pm2: $SERVER_DIR/server.js"
pm2 start "$SERVER_DIR/server.js" --name executrainserver --update-env --log "/home/LogFiles/pm2.log" || error_exit "pm2 server start failed!"

echo "Server started successfully on port $PORT"
echo "Startup script completed successfully."

# --- Keep Container Running ---
tail -f /dev/null # Keep the container alive