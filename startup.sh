# startup.sh (Optimized - Correct PM2 Startup Command from Azure Docs)
#!/bin/bash
# startup.sh (Optimized Version)
#!/bin/bash

echo "Starting startup script - Bullet-Proof Version..."

# Set to debug mode for troubleshooting
set -x

# Function to log and exit with an error message
error_exit() {
  echo "ERROR: $1"
  exit 1
}
LOG_FILE="/home/LogFiles/startup.log"
exec &> >(tee -a "$LOG_FILE") # Redirect all output to log file and stdout

echo "$(date) - Startup script started."

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
echo "$(date) - Current directory: $(pwd)"
echo "$(date) - Listing contents of /home/site/wwwroot:"
ls -l /home/site/wwwroot/
cd /home/site/wwwroot || error_exit "Failed to navigate to /home/site/wwwroot"
echo "$(date) - Successfully navigated to /home/site/wwwroot"

# --- Install Server Dependencies (Redundant if done in CI, but safer to keep for now) ---
echo "$(date) - Checking and installing server dependencies with npm ci..."
if [ -f package.json ]; then
  npm ci || error_exit "Server dependencies installation failed!"
  echo "$(date) - Server dependencies check complete"
else
  echo "$(date) - WARNING: package.json not found in /home/site/wwwroot. Skipping npm ci (assuming dependencies are deployed)."
fi

# --- Start the Node.js Server using PM2 (Correct Command from Azure Docs) ---
echo "$(date) - Starting the server with pm2-runtime..."
PM2_LOG_FILE="/home/LogFiles/pm2.log" # Define PM2 log file variable
pm2-runtime start server.js --no-daemon --name executrainserver --update-env --log "$PM2_LOG_FILE" || { # Correct PM2 command with --no-daemon
  echo "ERROR: pm2-runtime failed to start server! Check pm2 logs: $PM2_LOG_FILE"
  pm2 logs executrainserver --lines 50 --error # Show last 50 lines of pm2 error logs
  error_exit "pm2-runtime failed to start."
}

echo "$(date) - Successfully started server with pm2-runtime, listening on port $PORT"
echo "$(date) - Application is running and listening on port $PORT"

# --- Keep Container Running ---
echo "$(date) - Startup script execution finished. Keeping container running with tail -f /dev/null"
tail -f /dev/null