#!/bin/bash

# Ensure the script itself is executable
chmod +x "$0" || { echo "Failed to set executable permissions for the script"; exit 1; }

# Ensure working directory is set correctly
cd "/home/site/wwwroot" || { echo "Failed to change directory to /home/site/wwwroot"; exit 1; }

# Set NODE_PATH
export NODE_PATH=/usr/local/lib/node_modules:$NODE_PATH

# Set PORT if not already set
if [ -z "$PORT" ]; then
  export PORT=8080
fi

# Function to install dependencies and start the server for a given directory
start_service() {
  local service_dir="$1"
  local start_command="$2"
  local service_name="$3"

  if [ -d "$service_dir" ]; then
    cd "$service_dir" || { echo "Failed to change directory to $service_dir"; exit 1; }
    npm install &> npm_install_$service_name.log || { echo "Failed to install npm dependencies in $service_dir, check npm_install_$service_name.log"; exit 1; }
    eval "$start_command" &> service_$service_name.log || { echo "Failed to start $service_name, check service_$service_name.log"; exit 1; }
    cd - > /dev/null || { echo "Failed to change back to previous directory"; exit 1; }
  else
    echo "Directory $service_dir does not exist"; exit 1;
  fi
}

# Start execuTrainServer
start_service "execuTrainServer" "pm2 start server.js --name 'executrain-server'" "execuTrainServer"

# Start executrainsim
start_service "executrainsim" "npm run build && pm2 serve build 3000 --name 'executrainsim' --spa" "executrainsim"

echo "*All* services started successfully."
tail -f /dev/null