#!/bin/bash  
  
# Set the working directory to the app root  
cd "/home/site/wwwroot" || {  
  echo "Failed to change directory to /home/site/wwwroot"  
  exit 1  
}  
  
# Export necessary environment variables  
export NODE_ENV=production  
export PORT=${PORT:-80}  
  
# Function to install dependencies and start a service  
start_service() {  
  local service_dir="$1"  
  local start_command="$2"  
  local service_name="$3"  
  
  if [ -d "$service_dir" ]; then  
    cd "$service_dir" || {  
      echo "Failed to change directory to $service_dir"  
      exit 1  
    }  
    npm install || {  
      echo "Failed to install npm dependencies in $service_dir"  
      exit 1  
    }  
    eval "$start_command" || {  
      echo "Failed to start $service_name"  
      exit 1  
    }  
    cd - > /dev/null || {  
      echo "Failed to change back to previous directory"  
      exit 1  
    }  
  else  
    echo "Directory $service_dir does not exist"  
    exit 1  
  }  
}  
  
# Start the backend server  
start_service "execuTrainServer" "pm2 start server.js --name 'executrain-server'" "execuTrainServer"  
  
# Start the frontend server  
start_service "executrainsim" "pm2 serve build 3000 --name 'executrainsim' --spa" "executrainsim"  
  
echo "All services started successfully."  
  
# Keep the script running  
tail -f /dev/null  