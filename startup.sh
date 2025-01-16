#!/bin/bash

# --- Setup Environment & Logging ---

# Set the working directory to the app root
cd "/home/site/wwwroot" || {
    echo "ERROR: Failed to change directory to /home/site/wwwroot"
    exit 1
}

# Export necessary environment variables
export NODE_ENV=production
export PORT=${PORT:-80}

echo "INFO: Starting with PORT: $PORT"

# Log all environment variables for debugging
echo "INFO: Environment Variables:"
env | sort

# --- Function to Install & Start a Service ---
start_service() {
    local service_dir="$1"
    local start_command="$2"
    local service_name="$3"

    if [ -d "$service_dir" ]; then
        echo "INFO: Changing directory to: $service_dir"
        cd "$service_dir" || {
            echo "ERROR: Failed to change directory to $service_dir"
            exit 1
        }
        
        echo "INFO: Installing npm dependencies for $service_name"
        npm install || {
             echo "ERROR: Failed to install npm dependencies in $service_dir"
             exit 1
         }
         
        echo "INFO: Starting $service_name with command: $start_command"
         # Start the service with nohup and & to background the process and ignore the user signal.
         nohup eval "$start_command" & || {
            echo "ERROR: Failed to start $service_name"
             exit 1
         }
          sleep 10 # Give the server time to start.
          
         # Change back to root directory
        cd .. > /dev/null || {
            echo "ERROR: Failed to change back to previous directory"
             exit 1
        }
          

        echo "INFO: Successfully Started $service_name"
    else
        echo "ERROR: Directory $service_dir does not exist"
        exit 1
    fi
}

# --- Start the Backend Server ---
start_service "execuTrainServer" "node server.js" "execuTrainServer"

echo "INFO: All services started successfully."

# --- Keep the Script Running ---
tail -f /dev/null