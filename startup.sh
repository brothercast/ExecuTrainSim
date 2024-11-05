#!/bin/bash  
  
# Ensure working directory is set correctly  
cd "/home/site/wwwroot" || { echo "Failed to change directory to /home/site/wwwroot"; exit 1; }  
  
# Set NODE_PATH  
export NODE_PATH=/usr/local/lib/node_modules:$NODE_PATH  
  
# Set PORT if not already set  
if [ -z "$PORT" ]; then  
  export PORT=8080  
fi  
  
# Navigate to execuTrainServer, install dependencies, and start the server  
if [ -d "execuTrainServer" ]; then  
  cd execuTrainServer || { echo "Failed to change directory to execuTrainServer"; exit 1; }  
  npm install || { echo "Failed to install npm dependencies in execuTrainServer"; exit 1; }  
  pm2 start server.js --name "executrain-server" || { echo "Failed to start pm2 process for execuTrainServer"; exit 1; }  
  cd ..  
else  
  echo "Directory execuTrainServer does not exist"; exit 1;  
fi  
  
# Navigate to executrainsim, install dependencies, build the project, and serve it  
if [ -d "executrainsim" ]; then  
  cd executrainsim || { echo "Failed to change directory to executrainsim"; exit 1; }  
  npm install || { echo "Failed to install npm dependencies in executrainsim"; exit 1; }  
  npm run build || { echo "Failed to build executrainsim"; exit 1; }  
  pm2 serve build 3000 --name "executrainsim" --spa || { echo "Failed to start pm2 process for executrainsim"; exit 1; }  
else  
  echo "Directory executrainsim does not exist"; exit 1;  
fi  