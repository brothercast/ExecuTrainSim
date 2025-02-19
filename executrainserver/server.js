// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { AzureOpenAI } = require('openai');
const readline = require('readline');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser'); // Import body-parser

const app = express();
const port = process.env.PORT || 8080;
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');
console.log('[NegotiationModule] API_BASE_URL at runtime:', API_BASE_URL);

// ---------------------
// Logging Functions
// ---------------------
const logMessage = (message, data) => {
    console.log(`[DEBUG] ${message}:`, JSON.stringify(data, null, 2));
};

const logError = (message, error) => {
    console.error(`[ERROR] ${message}:`, error);
};

// ---------------------
// Environment Validation
// ---------------------
const requiredEnvVars = [
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_DEPLOYMENT_NAME',
    'AZURE_OPENAI_API_VERSION',
    'AZURE_ASSISTANT_API_VERSION',
    'AZURE_DALLE_API_VERSION',
    'AZURE_REALTIME_API_KEY',  // Add real-time vars
    'AZURE_REALTIME_ENDPOINT',
    'AZURE_REALTIME_NAME',
    'AZURE_REALTIME_API_VERSION'
];

const validateEnvironment = () => {
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
        logError('[FATAL]', 'Missing required environment variables: ' + missingVars.join(', '));
        process.exit(1);
    }
    logMessage('[BOOT]', 'All environment variables validated');
};

// ---------------------
// Azure OpenAI Client Setup
// ---------------------
const initializeAzureClient = () => {
    try {
        const client = new AzureOpenAI({
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiVersion: process.env.AZURE_ASSISTANT_API_VERSION,
            apiKey: process.env.AZURE_OPENAI_API_KEY
        });
        logMessage('[BOOT]', 'Azure OpenAI Client initialized successfully.');
        return client;
    } catch (error) {
        logError('[FATAL]', 'Azure client initialization failed');
        process.exit(1);
    }
};

// ---------------------
// Express Middleware Setup
// ---------------------
const setupMiddleware = () => {
    // Security & Monitoring
    const corsOptions = {
        origin: '*', // Use more restrictive settings in production
        optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions));
    app.use(morgan('dev'));
    app.use(compression({ level: 6 }));

    // Rate Limiting for API endpoints
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    });
    app.use('/api/', apiLimiter);

    // Increase the JSON payload size limit (adjust as needed)
    app.use(bodyParser.json({ limit: '10mb' })); // 10MB limit
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

    logMessage('[BOOT]', 'Express middleware setup completed.');
};

// ---------------------
// API Endpoints Setup
// ---------------------
const setupRoutes = () => {
    // Health Check Endpoint
    app.get('/health', (req, res) => {
        res.status(200).send('OK');
        logMessage('[API]', 'Health check endpoint called - OK');
    });

    // ChatGPT Text Generation Endpoint
    app.post('/api/generate', async (req, res) => {
        const { messages, temperature, max_tokens } = req.body;
        logMessage('[API Request]', '/api/generate called');
        logMessage('[API Request Body]', req.body);

        try {
            const openaiEndpoint = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`;
            const response = await axios.post(
                openaiEndpoint,
                { model: process.env.AZURE_DEPLOYMENT_NAME, messages, temperature, max_tokens },
                { headers: { 'Content-Type': 'application/json', 'api-key': process.env.AZURE_OPENAI_API_KEY } }
            );
            res.json(response.data);
        } catch (error) {
            logError('[API Error]', '/api/generate - OpenAI API Request Failed');
            res.status(500).json({ error: 'Generation failed', details: error.message });
        }
    });

    // DALL-E Image Generation Endpoint
    app.post('/api/dalle/image', async (req, res) => {
        const { prompt } = req.body;
        logMessage('[API Request]', '/api/dalle/image called');
      
        const requestBody = {
          prompt,
          size: '1024x1024',
          n: 1,
          quality: 'standard',
          style: 'vivid'
        };
      
        try {
          const dalleEndpointURL = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/Dalle3/images/generations?api-version=${process.env.AZURE_DALLE_API_VERSION}`;
      
          // VERIFY ENVIRONMENT VARIABLES (add logging for debugging)
          console.log("[DEBUG] DALL-E Endpoint:", dalleEndpointURL);
          console.log("[DEBUG] API Key:", process.env.AZURE_OPENAI_API_KEY ? "Key Present" : "KEY MISSING!"); // Check if key is at least present
          console.log("[DEBUG] API Version:", process.env.AZURE_DALLE_API_VERSION);
      
      
          const response = await axios.post(dalleEndpointURL, requestBody, {
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.AZURE_OPENAI_API_KEY }
          });
      
          // Extract the URL from the response.data (Azure DALL-E 3 format)
          if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            const imageUrl = response.data.data[0].url; // Get the URL of the first image
            logMessage('[API Response]', `Image URL: ${imageUrl}`); // Log the URL
            res.json({ imagePath: imageUrl }); // Send the URL with the key 'imagePath'
          } else {
            // Handle the case where the response structure is unexpected
            logError('[API Error]', 'Unexpected response structure from DALL-E API');
            res.status(500).json({ error: 'Failed to generate image', details: 'Unexpected response structure' });
          }
      
        } catch (error) {
          logError('[API Error]', '/api/dalle/image - DALL-E API Request Failed');
           // IMPROVED ERROR HANDLING: Log the entire error object for more detail
          console.error(error); // Log the full error object
          res.status(500).json({ error: 'Failed to generate image', details: error.message, fullError: error }); // Send more details to client
        }
      });

    // Real-time ChatGPT Text Generation Endpoint
    app.post('/api/realtime', async (req, res) => {
      const { messages } = req.body; // It should expect 'messages'
      logMessage('[API Request]', '/api/realtime called');
      logMessage('[API Request Body]', req.body);

      try {
        const realtimeEndpoint = `${process.env.AZURE_REALTIME_ENDPOINT}openai/realtime?api-version=${process.env.AZURE_REALTIME_API_VERSION}&deployment=${process.env.AZURE_REALTIME_NAME}`;
        const response = await axios.post(
          realtimeEndpoint,
          { messages }, //IMPORTANT: It should be { messages }
          { headers: { 'Content-Type': 'application/json', 'api-key': process.env.AZURE_REALTIME_API_KEY } }
        );
        res.json(response.data);
      } catch (error) {
        logError('[API Error]', '/api/realtime - OpenAI API Request Failed');
        res.status(500).json({ error: 'Real-time generation failed', details: error.message });
      }
    });

      // ---------------------
  // Static File Serving (Client App)
  // ---------------------
  const clientBuildPath =
    process.env.BUILD_FOLDER ||
    (process.env.NODE_ENV === 'production'
      ? path.join(__dirname, 'executrainsim-build')
      : path.join(__dirname, '..', 'executrainsim', 'build'));

  app.use(express.static(clientBuildPath));

    app.get('*', (req, res) => {
    try {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    } catch (error) {
      logError('[Routing Error]', 'Failed to serve index.html');
      res.status(500).send('Application loading failed - contact support');
    }
  });

    logMessage('[BOOT]', 'API routes setup completed.');
};

// ---------------------
// Server Startup
// ---------------------
const startServer = () => {
    validateEnvironment();
    initializeAzureClient();
    setupMiddleware();
    setupRoutes();

    app.listen(port, () => {
        console.log(`ExecuTrainSim Server listening on port ${port}`);
        logMessage('[BOOT]', 'Server initialization complete.');
        console.log('Press "CTRL + L" to clear Log.');
    });
};

// Optional: Clear the console on Ctrl+L for local development
if (process.env.NODE_ENV !== 'production') {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    const clearConsole = () => {
        process.stdout.write('\x1Bc');
    };
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'l') {
            clearConsole();
        } else if (key.ctrl && key.name === 'c') {
            console.log('Terminating the server...');
            process.exit();
        }
    });
}

startServer(); // Start the server