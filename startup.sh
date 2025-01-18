#!/bin/bash

echo "Starting startup script..."

# Navigate to the correct directory for the server and install dependencies
echo "Navigating to /home/site/wwwroot/deploy/executrainserver and installing dependencies..."
cd /home/site/wwwroot/deploy/executrainserver
npm ci
echo "Server dependencies installed."


#Install the app's dependencies
echo "Navigating to /home/site/wwwroot/deploy/executrainsim and installing dependencies..."
cd /home/site/wwwroot/deploy/executrainsim
npm ci
echo "App dependencies installed."


# Navigate back to the root of the deploy directory
echo "Navigating to the root of the deploy directory"
cd /home/site/wwwroot/deploy

# Start the Node.js server using pm2 (with absolute path)
echo "Starting the server using pm2..."
pm2 start /home/site/wwwroot/deploy/executrainserver/server.js --name executrainserver
echo "Server started."


echo "Startup script completed."