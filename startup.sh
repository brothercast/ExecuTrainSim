# startup.sh (Optimized Version)
#!/bin/bash

echo "Starting startup script..."

# Set to debug mode for troubleshooting
set -x

# Function to log and exit with an error message
error_exit() {
  echo "ERROR: $1"
  exit 1
}

# Get the application's port from the PORT environment variable, fallback to 3000
PORT="${PORT:=3000}"

# Navigate to the server directory (already in wwwroot due to deployment package)
echo "Current directory: $(pwd)" # Debugging: Print current directory
echo "Listing contents of /home/site/wwwroot:"
ls -l /home/site/wwwroot/ # Debugging: List wwwroot contents

echo "Navigating to /home/site/wwwroot..."
cd /home/site/wwwroot || error_exit "Failed to navigate to /home/site/wwwroot"
echo "Successfully navigated to /home/site/wwwroot"

# Install server dependencies (redundant if done in CI, but safer to keep for now)
echo "Checking and installing server dependencies with npm ci..."
if [ -f package.json ]; then # Check if package.json exists to avoid errors
  npm ci || error_exit "Server dependencies installation failed!"
  echo "Server dependencies check complete"
else
  echo "package.json not found in /home/site/wwwroot. Skipping npm ci (assuming dependencies are deployed)."
fi

# Start the Node.js server using pm2 (with absolute path, corrected path)
echo "Starting the server with pm2..."
pm2 start server.js --name executrainserver --update-env --log "/home/LogFiles/pm2.log"  || {
  echo "ERROR: pm2 failed to start server! Check pm2 logs:"
  pm2 logs executrainserver --lines 20 # Show last 20 lines of pm2 logs
  error_exit "pm2 failed to start."
}

echo "Successfully started server with pm2, listening on port $PORT"
# Output port information in the logs
echo "Application is running and listening on port $PORT"

# Keep the container running if necessary
tail -f /dev/null