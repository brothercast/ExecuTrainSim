#!/bin/bash

echo "Starting startup script..."
# Navigate to the correct directory for the server and install dependencies
echo "Navigating to /home/site/wwwroot/deploy/executrainserver..."
cd /home/site/wwwroot/deploy/executrainserver
echo "Successfully navigated to /home/site/wwwroot/deploy/executrainserver"

echo "Installing server dependencies with npm ci..."
npm ci
if [ $? -eq 0 ]; then
 echo "Server dependencies installed successfully."
else
 echo "ERROR: Server dependencies installation failed!"
 exit 1
fi
echo "Server dependencies check complete"


#Install the app's dependencies
echo "Navigating to /home/site/wwwroot/deploy/executrainsim..."
cd /home/site/wwwroot/deploy/executrainsim
echo "Successfully navigated to /home/site/wwwroot/deploy/executrainsim"

echo "Installing app dependencies with npm ci..."
npm ci
if [ $? -eq 0 ]; then
 echo "App dependencies installed successfully."
else
 echo "ERROR: App dependencies installation failed!"
 exit 1
fi
echo "App dependencies check complete"

# Navigate back to the root of the deploy directories
echo "Navigating to /home/site/wwwroot/deploy..."
cd /home/site/wwwroot/deploy
echo "Successfully navigated to /home/site/wwwroot/deploy"

# Start the Node.js server using pm2 (with absolute path)
echo "Starting the server with pm2..."
pm2 start /home/site/wwwroot/deploy/executrainserver/server.js --name executrainserver
if [ $? -eq 0 ]; then
 echo "Successfully started server with pm2."
else
 echo "ERROR: pm2 failed to start server!"
 exit 1
fi
echo "Startup script completed."