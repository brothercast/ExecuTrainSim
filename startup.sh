name: Build and deploy Node.js app to Azure Web App - ExecuTrainSim

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  AZURE_RESOURCE_GROUP: 'ExecuTrainSimGroup'
  FRONTEND_WEBAPP_NAME: 'ExecuTrainSim-Frontend'
  BACKEND_WEBAPP_NAME: 'ExecuTrainSim-Backend'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Build frontend
        working-directory: ./executrainsim
        run: |
          echo "Installing frontend dependencies..."
          npm install
          echo "Building frontend..."
          npm run build

      - name: Build backend
        working-directory: ./execuTrainServer
        run: |
          echo "Installing backend dependencies..."
          npm install
          echo "Building backend..."
          npm run build

      - name: Prepare deployment package
        run: |
          echo "Creating deployment directory..."
          mkdir -p deploy
          echo "Copying frontend build..."
          cp -r executrainsim/build deploy/frontend
          echo "Copying backend files..."
          cp -r execuTrainServer/dist deploy/backend
          echo "Copying startup script..."
          cp startup.sh deploy
          echo "Copying package.json..."
          cp package.json deploy
          echo "Setting startup script as executable..."
          chmod +x deploy/startup.sh

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: node-app
          path: deploy
          retention-days: 1

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: node-app
          path: .

      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Stop WebApp
        run: |
          echo "Stopping WebApp..."
          az webapp stop --name ExecuTrainSim --resource-group ${{ env.AZURE_RESOURCE_GROUP }}
          sleep 30

      - name: Deploy to Azure Web App
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'ExecuTrainSim'
          slot-name: 'production'
          package: .

      - name: Start WebApp
        run: |
          echo "Starting WebApp..."
          az webapp start --name ExecuTrainSim --resource-group ${{ env.AZURE_RESOURCE_GROUP }}
          sleep 30

      - name: Verify deployment
        run: |
          sleep 30
          for i in {1..3}; do
              echo "Attempt $i"
            response=$(curl -f -s -I ${{ steps.deploy-to-webapp.outputs.webapp-url }}/health)
            echo "Response Headers: $response"
            status_code=$(echo "$response" | grep "HTTP/" | awk '{print $2}')
              echo "Status code: $status_code"
            if [[ "$status_code" == "200" ]]; then
                 response_body=$(curl -f -s  ${{ steps.deploy-to-webapp.outputs.webapp-url }}/health)
                if [[ "$response_body" == "OK" ]]; then
                    echo "Deployment verified successfully"
                    exit 0
                else
                  echo "Health endpoint did not return 'OK'."
               fi
            fi
            echo "Attempt $i failed, retrying..."
            sleep 10
          done
          echo "Deployment verification failed after 3 attempts"
          exit 1