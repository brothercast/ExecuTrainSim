#!/bin/bash  
  
# Ensure working directory is set correctly  
cd "/home/site/wwwroot"  
  
# Set NODE_PATH  
export NODE_PATH=/usr/local/lib/node_modules:$NODE_PATH  
  
# Set PORT if not already set  
if [ -z "$PORT" ]; then  
  export PORT=8080  
fi  
  
# Navigate to executrainserver, install dependencies, and start the server  
cd executrainserver  
npm install  
pm2 start server.js --name "executrain-server"  
  
# Navigate to executrainsim, install dependencies, build the project, and serve it  
cd ../executrainsim  
npm install  
npm run build  
pm2 serve build 3000 --name "executrainsim" --spa  