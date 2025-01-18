#!/bin/bash
# Navigate to the directory where server.js is located
cd /home/site/wwwroot/executrainserver

# Install dependencies
npm install

# Run the Node.js server using pm2
pm2 start server.js --name executrainserver

# No logs here, it will hang up the process
# pm2 logs executrainserver