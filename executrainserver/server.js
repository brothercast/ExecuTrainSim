require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { AzureOpenAI } = require('openai');
const readline = require('readline');
const path = require('path');

const app = express();

// Determine port based on environment (Azure expects 8080, local can be overridden by process.env.PORT)
const port = process.env.PORT || 8080;

// Load environment variables
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME;
const azureOpenAiAPIVersion = process.env.AZURE_OPENAI_API_VERSION;
const azureAssistantAPIVersion = process.env.AZURE_ASSISTANT_API_VERSION;
const azureDalleAPIVersion = process.env.AZURE_DALLE_API_VERSION;

// Define API endpoints - using the main 'port' for all
const chatGptEndpoint = `${azureEndpoint}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureOpenAiAPIVersion}`;
const dalleEndpoint = `${azureEndpoint}/openai/deployments/Dalle3/images/generations?api-version=${azureDalleAPIVersion}`;

const logMessage = (message, data) => {
    console.log(`[DEBUG] ${message}:`, JSON.stringify(data, null, 2));
};

// Initialize Azure OpenAI Client
const getClient = () => {
    console.log('Initializing Azure OpenAI Client');
    return new AzureOpenAI({
        endpoint: azureEndpoint,
        apiVersion: azureAssistantAPIVersion,
        apiKey: azureApiKey,
    });
};

const assistantsClient = getClient();

app.use(cors());
app.use(express.json());

// Corrected path to serve static files from React app's build directory
app.use(express.static(path.join(__dirname, '..', 'executrainsim', 'build')));

// Serve the React app's index.html for all routes not handled by API endpoints
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'executrainsim', 'build', 'index.html'));
});

// Function to clear the console
const clearConsole = () => {
    process.stdout.write('\x1Bc');
};

// Setup readline to listen for keypress events for local development convenience
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

// Listen for keypresses - for local development convenience (clear log, exit)
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'l') {
        clearConsole();
    } else if (key.ctrl && key.name === 'c') {
        console.log('Terminating the server...');
        process.exit(); // Manually exit the process
    }
});

// ChatGPT Text Generation Endpoint
app.post('/api/generate', async (req, res) => {
    const { messages, temperature, max_tokens } = req.body;

    logMessage('API Generate Request:', req.body);

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

        logMessage('API Generate Response:', response.data);

        if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
            let scenarioData = response.data.choices[0].message.content;
            scenarioData = scenarioData.replace(/```json|```/g, '');

            try {
                const parsedScenario = JSON.parse(scenarioData);
                res.json(parsedScenario);
            } catch (parseError) {
                logMessage('Failed to parse JSON response:', { error: parseError.message, scenarioData });
                res.status(500).json({
                    error: 'Failed to parse JSON response',
                    details: parseError.message
                });
            }
        } else {
            logMessage('Unexpected response structure', response.data);
            throw new Error('Unexpected response structure');
        }
    } catch (error) {
        console.error('API Generate Error:', error);
        logMessage('API Generate Error:', error);
        res.status(500).json({
            error: 'Failed to generate scenario',
            details: error.response ? error.response.data : error.message
        });
    }
});

// DALL-E Image Generation Endpoint
app.post('/api/dalle/image', async (req, res) => {
    const { prompt } = req.body;

    const requestBody = {
        prompt,
        size: "1024x1024",
        n: 1,
        quality: "standard",
        style: "vivid"
    };

    try {
        const response = await axios.post(dalleEndpoint, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': azureApiKey
            }
        });

        if (response.data && response.data.data.length > 0) {
            const imageUrl = response.data.data[0].url;
            res.json({ imagePath: imageUrl });
        } else {
            res.status(500).json({ error: 'No images generated.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate image', details: error.message });
    }
});

// Health check endpoint - useful for Azure App Service health probes
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

console.log(`ChatGPT Endpoint: ${chatGptEndpoint}`);
console.log(`DALL-E Endpoint: ${dalleEndpoint}`);

app.listen(port, () => {
    console.log(`ExecuTrainSim Server listening on port ${port}`);
    console.log(`Press "CTRL + L" to clear Log.`);
});