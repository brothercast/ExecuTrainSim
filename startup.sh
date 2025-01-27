#!/bin/bash
# Optimized startup.sh for Azure App Service - ExecuTrainSim

echo "Starting optimized startup script..."

# --- Setup & Debugging ---
set -e  # Exit immediately on error
set -x  # Enable debug mode for detailed logging

LOG_FILE="/home/LogFiles/startup.log"
exec &> >(tee -a "$LOG_FILE") # Redirect all output to log file and stdout

echo "$(date) - Startup script initialized. Logging to $LOG_FILE"

# --- Helper Functions ---
error_exit() {
  echo "$(date) - ERROR: $1"
  echo "$(date) - Check $LOG_FILE for detailed logs."
  exit 1
}

log_step() {
  echo "$(date) - --- STEP: $1 ---"
}

# --- Determine Port (Azure Standard) ---
PORT="${PORT:=8080}" # Default to 8080 if PORT env var is not set (Azure convention)
export PORT
log_step "Using PORT: $PORT"

# --- Set Node.js Version (Explicitly set engine in package.json is preferred, but this is a fallback) ---
NODE_VERSION="~20" # Specify desired Node.js version here
if [ -z "$WEBSITE_NODE_DEFAULT_VERSION" ]; then
  log_step "WEBSITE_NODE_DEFAULT_VERSION not set, defaulting to $NODE_VERSION"
  export WEBSITE_NODE_DEFAULT_VERSION="$NODE_VERSION"
else
  log_step "WEBSITE_NODE_DEFAULT_VERSION is set to: $WEBSITE_NODE_DEFAULT_VERSION"
fi

log_step "Setting Node.js version using NVM to: $WEBSITE_NODE_DEFAULT_VERSION"
nvm use "$WEBSITE_NODE_DEFAULT_VERSION" || error_exit "Failed to set Node.js version using NVM. Ensure NVM is correctly configured."
node -v
npm -v

# --- Navigate to Server Directory ---
log_step "Navigating to server directory: /home/site/wwwroot/deployment-package/executrainserver"
cd /home/site/wwwroot/deployment-package/executrainserver || error_exit "Navigation to server directory failed!"

# --- Install Server Dependencies ---
log_step "Installing server dependencies using npm ci (clean install)..."
if [ -f package.json ]; then
  npm ci || error_exit "npm ci failed for server dependencies. Check npm logs for errors."
  log_step "Server dependencies installed successfully."
else
  log_step "WARNING: package.json not found in server directory. Assuming dependencies are pre-installed."
fi

# --- Start Server with PM2 ---
log_step "Starting server with pm2-runtime..."
PM2_LOG_FILE="/home/LogFiles/pm2.log"
pm2-runtime start server.js --no-daemon --name executrainserver --update-env --log "$PM2_LOG_FILE" --port "$PORT" --no-autorestart || error_exit "PM2 failed to start server. Check PM2 logs: $PM2_LOG_FILE"

log_step "Server started successfully with pm2-runtime on port $PORT."

echo "$(date) - Startup script completed successfully."

# --- Keep Container Running ---
log_step "Keeping container alive with tail -f /dev/null"
tail -f /dev/null