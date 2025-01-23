# startup.sh
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

# Navigate to the correct directory for the server
echo "Navigating to /home/site/wwwroot/executrainserver..."
cd /home/site/wwwroot/executrainserver || error_exit "Failed to navigate to /home/site/wwwroot/executrainserver"
echo "Successfully navigated to /home/site/wwwroot/executrainserver"

# Install server dependencies
echo "Installing server dependencies with npm ci..."
npm ci || error_exit "Server dependencies installation failed!"
echo "Server dependencies check complete"

# Navigate to the app directory
echo "Navigating to /home/site/wwwroot/executrainsim..."
cd /home/site/wwwroot/executrainsim || error_exit "Failed to navigate to /home/site/wwwroot/executrainsim"
echo "Successfully navigated to /home/site/wwwroot/executrainsim"

# Install app dependencies
echo "Installing app dependencies with npm ci..."
npm ci || error_exit "App dependencies installation failed!"
echo "App dependencies check complete"

# Start the Node.js server using pm2 (with absolute path)
echo "Starting the server with pm2..."
pm2 start /home/site/wwwroot/executrainserver/server.js --name executrainserver --update-env --log "/home/LogFiles/pm2.log"  || {
  echo "ERROR: pm2 failed to start server!"
  pm2 logs executrainserver # Display pm2 logs to see the reason for failure
  error_exit "pm2 failed to start."
}

echo "Successfully started server with pm2, listening on port $PORT"
# Output port information in the logs
echo "Application is running and listening on port $PORT"

# Keep the container running if necessary
tail -f /dev/null