require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { AzureOpenAI } = require('openai');
const readline = require('readline');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression'); // Import compression
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 8080;

// --- Logging Setup ---
app.use(morgan('dev'));

const logMessage = (message, data) => {
    console.log(`[DEBUG] ${message}:`, JSON.stringify(data, null, 2));
};

const logError = (message, error) => {
    console.error(`[ERROR] ${message}:`, error);
};

// --- Environment Variable Checks (Startup Validation) ---
const checkEnvironmentVariables = () => {
    const requiredEnvVars = [
        'AZURE_OPENAI_API_KEY',
        'AZURE_OPENAI_ENDPOINT',
        'AZURE_DEPLOYMENT_NAME',
        'AZURE_OPENAI_API_VERSION',
        'AZURE_ASSISTANT_API_VERSION',
        'AZURE_DALLE_API_VERSION'
    ];

    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            logError('Startup Error', `Missing required environment variable: ${varName}`);
            throw new Error(`Missing required environment variable: ${varName}`);
        }
    });
    console.log('[Startup] All required environment variables are present.');
};

try {
    checkEnvironmentVariables();
} catch (error) {
    console.error('[Startup Error] Application startup failed due to missing environment variables.');
    process.exit(1);
}

// Load environment variables (after checks - variables are assumed to be present now)
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME;
const azureOpenAiAPIVersion = process.env.AZURE_OPENAI_API_VERSION;
const azureAssistantAPIVersion = process.env.AZURE_ASSISTANT_API_VERSION;
const azureDalleAPIVersion = process.env.AZURE_DALLE_API_VERSION;

// Define API endpoints - Construct endpoints once at startup
const chatGptEndpoint = `${azureEndpoint}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureOpenAiAPIVersion}`;
const dalleEndpoint = `${azureEndpoint}/openai/deployments/Dalle3/images/generations?api-version=${azureDalleAPIVersion}`;

// Initialize Azure OpenAI Client - Initialize client once at startup
const getClient = () => {
    console.log('[Startup] Initializing Azure OpenAI Client');
    return new AzureOpenAI({
        endpoint: azureEndpoint,
        apiVersion: azureAssistantAPIVersion,
        apiKey: azureApiKey,
    });
};

let assistantsClient;
try {
    assistantsClient = getClient();
    console.log('[Startup] Azure OpenAI Client initialized successfully.');
} catch (clientError) {
    logError('Azure OpenAI Client Initialization Error', clientError);
    console.error('[Startup Error] Failed to initialize Azure OpenAI Client. Check Azure OpenAI configuration.');
    process.exit(1);
}

// --- Express Middleware ---
const corsOptions = {
    origin: 'https://executrainsim.azurewebsites.net',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
// Enable compression BEFORE static files are served
app.use(compression({ level: 6 }));

// --- Static File Serving ---
const clientBuildPath = path.join(__dirname, 'executrainsim-build');
app.use(express.static(clientBuildPath, {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store');
        }
    }
}));

// --- API Rate Limiting ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use('/api/', apiLimiter);

// --- Route Handlers ---
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.post('/api/generate', async (req, res) => {
    const { messages, temperature, max_tokens } = req.body;

    logMessage('API Generate Request Received', req.body);

    try {
        const response = await axios.post(chatGptEndpoint, {
            model: azureDeploymentName,
            messages,
            temperature,
            max_tokens
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': azureApiKey
            }
        });

        logMessage('API Generate Response Sent', response.data);

        if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
            let scenarioData = response.data.choices[0].message.content;
            scenarioData = scenarioData.replace(/```json|```/g, '');

            try {
                const parsedScenario = JSON.parse(scenarioData);
                res.json(parsedScenario);
            } catch (parseError) {
                logError('JSON Parse Error in API Generate Response', parseError);
                return res.status(500).json({ error: 'Failed to parse JSON response from OpenAI', details: parseError.message });
            }
        } else {
            const errorDetail = 'Unexpected response structure from OpenAI API';
            logError('API Generate Response Error', errorDetail);
            return res.status(500).json({ error: errorDetail, details: response.data });
        }
    } catch (apiError) {
        logError('API Generate Request Error', apiError);
        res.status(500).json({ error: 'Failed to generate scenario', details: apiError.response ? apiError.response.data : apiError.message });
    }
});

app.post('/api/dalle/image', async (req, res) => {
    const { prompt } = req.body;

    const requestBody = {
        prompt,
        size: "1024x1024",
        n: 1,
        quality: "standard",
        style: "vivid"
    };

    logMessage('DALL-E Image Request Received', { prompt: prompt });

    try {
        const response = await axios.post(dalleEndpoint, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': azureApiKey
            }
        });

        logMessage('DALL-E Image Response Sent', response.data);

        if (response.data && response.data.data.length > 0) {
            const imageUrl = response.data.data[0].url;
            res.json({ imagePath: imageUrl });
        } else {
            const errorDetail = 'No images generated in DALL-E API response';
            logError('DALL-E Image Generation Error', errorDetail);
            return res.status(500).json({ error: errorDetail, details: response.data });
        }
    } catch (apiError) {
        logError('DALL-E Image Request Error', apiError);
        res.status(500).json({ error: 'Failed to generate image', details: apiError.response ? apiError.response.data : apiError.message });
    }
});

// --- Client App Serving (Fallback - MUST be last route) ---
app.get('*', (req, res) => {
    try {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    } catch (error) {
      console.error(`[ROUTING ERROR] Failed to serve index.html: ${error.message}`);
      res.status(500).send('Application loading failed - contact support');
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`ExecuTrainSim Server listening on port ${port}`);
    console.log('[Startup] Server initialization complete.');
    console.log('Press "CTRL + L" to clear Log.');
});

// --- Console Clear on Ctrl+L (Optional for local dev - remove for production if not needed) ---
if (process.env.NODE_ENV !== 'production') {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'l') {
            clearConsole();
        } else if (key.ctrl && key.name === 'c') {
            console.log('Terminating the server...');
            process.exit();
        }
    });
    const clearConsole = () => {
        process.stdout.write('\x1Bc');
    };
}