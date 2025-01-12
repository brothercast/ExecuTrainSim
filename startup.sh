#!/bin/bash
    
# Set the working directory to the app root
cd "/home/site/wwwroot" || {
    echo "Failed to change directory to /home/site/wwwroot"
    exit 1
}
    
# Export necessary environment variables
export NODE_ENV=production
export PORT=${PORT:-80}

echo "Starting with PORT: $PORT"

# Function to install dependencies and start a service
start_service() {
    local service_dir="$1"
    local start_command="$2"
    local service_name="$3"
    
    if [ -d "$service_dir" ]; then
        echo "Changing directory to: $service_dir"
        cd "$service_dir" || {
            echo "Failed to change directory to $service_dir"
             exit 1
        }
        echo "Installing npm dependencies for $service_name"
        npm install || {
             echo "Failed to install npm dependencies in $service_dir"
            exit 1
        }
        echo "Starting $service_name with command: $start_command"
         # Start the service with nohup and & to background the process and ignore the user signal.
         nohup eval "$start_command" & || {
            echo "Failed to start $service_name"
             exit 1
         }
          sleep 10 #give the server time to start.
         cd - > /dev/null || {
              echo "Failed to change back to previous directory"
            exit 1
         }
        echo "Successfully Started $service_name"
      else
          echo "Directory $service_dir does not exist"
          exit 1
      fi
}

# Start the backend server
start_service "execuTrainServer" "node server.js" "execuTrainServer"

echo "All services started successfully."

# Keep the script running
tail -f /dev/null