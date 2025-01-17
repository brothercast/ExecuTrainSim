#!/bin/bash
# Navigate to the directory where server.js is located
cd /home/site/wwwroot/

# Install dependencies if you want to
# npm install

# Run the Node.js server using pm2
pm2 start server.js --name executrainserver

# Monitor server logs (optional for debugging)
pm2 logs executrainserver