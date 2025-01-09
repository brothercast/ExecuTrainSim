#!/bin/bash

# Ensure the script itself is executable
chmod +x "$0" || { echo "Failed to set executable permissions for the script"; exit 1; }

# Log the working directory
echo "Current working directory: $(pwd)"

# Default PORT to 8080 if not already set
if [ -z "$PORT" ]; then
  export PORT=8080
fi

# Log the set port
echo "Using port: $PORT"

# Ensure backend is started, by setting the working directory and path correctly
cd deploy/backend || { echo "Failed to change directory to deploy/backend"; exit 1; }
echo "Starting backend server in $(pwd)"

# Start the backend server, logging the results
node dist/server.js &> backend.log &

# Wait 5 seconds, then check if the backend has started correctly
sleep 5

# Check if the server process is running correctly using process id
if ! ps -p $! > /dev/null ; then
  echo "Backend server failed to start. Check backend.log for errors."
  exit 1
fi

# Move to deploy and log working directory
cd ../../ || { echo "Failed to change directory back to the deploy root"; exit 1; }
echo "Current working directory: $(pwd)"

# Serve the frontend files, if they're in the deployment package
if [ -d "frontend" ]; then
    echo "Serving static files in /frontend using serve"
    # Install serve (if not already there)
   npm install -g serve 
    #Serve the frontend directory on port $PORT
    serve -s frontend -l $PORT &> frontend.log &
       # Wait 5 seconds, then check if the frontend has started correctly
    sleep 5
  if ! ps -p $! > /dev/null; then
      echo "Frontend failed to start. Check frontend.log for errors."
      exit 1;
   fi
else
    echo "No frontend folder found, not starting frontend server."
fi

# Keep the script running so that server remains active
tail -f /dev/null