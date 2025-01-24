 #!/bin/bash
 echo "Starting VERY basic startup script..."
 set -x
 cd /home/site/wwwroot/executrainserver  # Corrected lowercase path
 npm ci # Keep dependency install for now
 pm2 start server.js --name executrainserver --update-env --log "/home/LogFiles/pm2.log"
 echo "Basic startup script complete."
 tail -f /dev/null
 