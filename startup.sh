#!/bin/bash

# --- Setup Environment ---

echo "--- STEP: Setting up environment ---"

# Navigate to the root directory containing both frontend and backend directories
cd /home/site/wwwroot

# Make sure this points to the correct react directory
FRONTEND_DIR="executrainsim"
BACKEND_DIR="executrainserver"

# --- Install Server Dependencies ---

echo "--- STEP: Installing server dependencies ---"
cd "$BACKEND_DIR"
if [ -f "package.json" ]; then
    echo "package.json found, running npm ci"
    npm ci
  if [ $? -ne 0 ]; then
    echo "npm ci failed, attempting npm install"
     npm install
    if [ $? -ne 0 ]; then
      echo "npm install failed, exiting"
      exit 1
    fi
  fi
else
    echo "package.json not found, exiting"
    exit 1
fi
cd ..

# --- Install Frontend Dependencies ---

echo "--- STEP: Installing frontend dependencies ---"
cd "$FRONTEND_DIR"

if [ -f "package.json" ]; then
    echo "package.json found, running npm ci"
     npm ci
  if [ $? -ne 0 ]; then
     echo "npm ci failed, attempting npm install"
      npm install
    if [ $? -ne 0 ]; then
      echo "npm install failed, exiting"
      exit 1
    fi
  fi
else
    echo "package.json not found, exiting"
    exit 1
fi
cd ..

# --- Build Frontend ---
echo "--- STEP: Building frontend ---"
cd "$FRONTEND_DIR"
npm run build
if [ $? -ne 0 ]; then
  echo "npm run build failed, exiting"
  exit 1
fi
cd ..


# --- Start Server Application ---
echo "--- STEP: Starting the server application ---"
cd "$BACKEND_DIR"

start_command="node server.js"

echo "Starting server with: $start_command"
nohup eval "$start_command" &

# Check if the server started
if [ $? -eq 0 ]; then
 echo "Server started successfully!"
else
 echo "Failed to start server."
 exit 1
fi


echo "--- STEP: Server startup script complete ---"