#!/bin/bash

# Navigate to the correct directory for the server
cd /home/site/wwwroot/deploy/executrainserver

# Install server dependencies using npm ci (faster for CI)
echo "Installing server dependencies..."
npm ci
echo "Server dependencies installed."

# Navigate to the root of the deploy directory
cd /home/site/wwwroot/deploy

# Start the Node.js server using pm2
echo "Starting the server using pm2..."
pm2 start executrainserver/server.js --name executrainserver
echo "Server started."

echo "Script completed."