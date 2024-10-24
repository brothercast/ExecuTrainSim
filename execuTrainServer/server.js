require('dotenv').config();  
const express = require('express');  
const axios = require('axios');  
const bodyParser = require('body-parser');  
const cors = require('cors');  
  
const app = express();  
app.use(cors());  
app.use(bodyParser.json());  
  
const GPT_PORT = process.env.GPT_PORT || 5000;  
const DALLE_PORT = process.env.DALLE_PORT || 5001;  
  
const azureApiKey = process.env["AZURE_OPENAI_API_KEY"];  
const chatGptEndpoint = `${process.env["AZURE_OPENAI_ENDPOINT"]}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2023-03-15-preview`;  
const dalleEndpoint = `${process.env["AZURE_OPENAI_ENDPOINT"]}/openai/deployments/Dalle3/images/generations?api-version=2024-05-01-preview`;  

// Utility function for logging requests  
const logRequest = (context, data) => {  
  console.log(`Sending request to ${context} with data:`, data);  
};  
  
// Utility function for logging errors  
const logError = (context, error) => {  
  console.error(`Error in ${context}:`, error.response ? error.response.data : error.message);  
};  
  
  
// ChatGPT Endpoints  
app.post('/api/openai/initial', async (req, res) => {  
  const { role, experienceLevel, difficulty } = req.body;  
  const prompt = `Generate an engaging business scenario for a ${role} with ${experienceLevel} experience at ${difficulty} difficulty. Create the initial question, scenario description, and several options with potential consequences for each choice. Return a JSON object with: { "scenario": { "title": "Scenario Title", "description": "Detailed scenario description", "initial_question": "The initial question for the user", "options": [ {"description": "Option 1 description"}, {"description": "Option 2 description"}, {"description": "Option 3 description"}, {"description": "Option 4 description"} ] } }`;  
  
  logRequest('Azure OpenAI', prompt);  
  
  try {  
    const response = await axios.post(  
      chatGptEndpoint,  
      {  
        model: 'gpt-4o-mini',  
        messages: [  
          { role: "system", content: "You are a helpful assistant that responds in JSON format." },  
          { role: "user", content: prompt }  
        ],  
        temperature: 0.75,  
        max_tokens: 1800  
      },  
      {  
        headers: {  
          'Content-Type': 'application/json',  
          'api-key': azureApiKey  
        }  
      }  
    );  
  
    console.log('Received response from Azure OpenAI');  
    let content = response.data.choices[0].message.content;  
    console.log('Raw content:', content);  
  
    content = content.replace(/```json|```/g, '').trim();  
  
    try {  
      const parsedContent = JSON.parse(content);  
      res.json(parsedContent);  
    } catch (parseError) {  
      console.error('Error parsing JSON:', parseError);  
      res.status(500).json({ error: 'Failed to parse JSON response', details: parseError.message });  
    }  
  } catch (error) {  
    console.error('Error in OpenAI request:', error);  
    res.status(500).json({  
      error: 'Failed to generate initial scenario',  
      details: error.response ? error.response.data : error.message  
    });  
  }  
});  

app.post('/api/openai/custom_initial', async (req, res) => {  
  const { role, experienceLevel, difficulty, customScenario } = req.body;  
  const prompt = `Given the custom scenario description: "${customScenario}", generate a title, initial question, and options with consequences suitable for a ${role} with ${experienceLevel} experience at ${difficulty} difficulty. Return a JSON object with: { "scenario": { "title": "Scenario Title", "description": "${customScenario}", "initial_question": "The initial question for the user", "options": [ {"description": "Option 1 description"}, {"description": "Option 2 description"}, {"description": "Option 3 description"}, {"description": "Option 4 description"} ] } }`;  
  
  try {  
    const response = await axios.post(  
      chatGptEndpoint,  
      {  
        model: 'gpt-4o-mini',  
        messages: [  
          { role: "system", content: "You are a helpful assistant that responds in JSON format." },  
          { role: "user", content: prompt }  
        ],  
        temperature: 0.75,  
        max_tokens: 1800  
      },  
      {  
        headers: {  
          'Content-Type': 'application/json',  
          'api-key': azureApiKey  
        }  
      }  
    );  
  
    let content = response.data.choices[0].message.content;  
    content = content.replace(/```json|```/g, '').trim();  
  
    try {  
      const parsedContent = JSON.parse(content);  
      res.json(parsedContent);  
    } catch (parseError) {  
      res.status(500).json({ error: 'Failed to parse JSON response', details: parseError.message });  
    }  
  } catch (error) {  
    res.status(500).json({  
      error: 'Failed to generate custom initial scenario',  
      details: error.response ? error.response.data : error.message  
    });  
  }  
});  

  
app.post('/api/openai/followup', async (req, res) => {  
  const { role, experienceLevel, difficulty, scenario, question, answer, previousAnswers } = req.body;  
  const prompt = `Given the scenario: "${scenario}", and the question: "${question}", you answered: "${answer}". Based on this, generate the next question and update the scenario by introducing new elements, challenges, or twists. The updated scenario should reflect changes or consequences of the previous decision, and introduce fresh dynamics that keep the user engaged. Provide feedback and a score for the chosen answer. Return a JSON object with: { "next_question": { "question": "Next question for the user", "scenario_description": "Updated scenario description introducing new dynamics", "options": [ {"description": "Option 1 description"}, {"description": "Option 2 description"}, {"description": "Option 3 description"}, {"description": "Option 4 description"} ] }, "score": { "current_score": (score), "feedback": "Detailed feedback on how the user's choice impacted the scenario" } }`;  
  
  console.log('Sending follow-up request to Azure OpenAI with prompt:', prompt);  
  
  try {  
    const response = await axios.post(  
      chatGptEndpoint,  
      {  
        model: 'gpt-4o-mini',  
        messages: [  
          { role: "system", content: "You are a helpful assistant that responds in JSON format." },  
          { role: "user", content: prompt }  
        ],  
        temperature: 0.85,  
        max_tokens: 1800  
      },  
      {  
        headers: {  
          'Content-Type': 'application/json',  
          'api-key': azureApiKey  
        }  
      }  
    );  
  
    console.log('Received response from Azure OpenAI for follow-up');  
    let content = response.data.choices[0].message.content;  
    console.log('Raw content:', content);  
  
    content = content.replace(/```json|```/g, '').trim();  
  
    try {  
      const parsedContent = JSON.parse(content);  
      res.json(parsedContent);  
    } catch (parseError) {  
      console.error('Error parsing JSON:', parseError);  
      res.status(500).json({ error: 'Failed to parse JSON response', details: parseError.message });  
    }  
  } catch (error) {  
    console.error('Error in OpenAI follow-up request:', error);  
    res.status(500).json({  
      error: 'Failed to generate follow-up scenario',  
      details: error.response ? error.response.data : error.message  
    });  
  }  
});  
  
app.post('/api/openai/debriefing', async (req, res) => {  
  const { scenario, answers } = req.body;  
  const prompt = `Provide a detailed debriefing summary for the scenario: "${scenario}" based on your answers: ${JSON.stringify(answers)}. Include strengths, areas for improvement, overall score, letter grade, and advice. Return a JSON object with: { "debriefing": { "summary": "Summary of the simulation", "strengths": ["Strength 1", "Strength 2"], "areasForImprovement": ["Improvement 1", "Improvement 2"], "overallScore": (X/150), "letterGrade": "(A-F)", "stars": (1-5), "advice": "Recommendations" } }`;  
  
  console.log('Sending debriefing request to Azure OpenAI with prompt:', prompt);  
  
  try {  
    const response = await axios.post(  
      chatGptEndpoint,  
      {  
        model: 'gpt-4o-mini',  
        messages: [  
          { role: "system", content: "You are a helpful assistant that responds in JSON format." },  
          { role: "user", content: prompt }  
        ],  
        temperature: 0.75,  
        max_tokens: 1800  
      },  
      {  
        headers: {  
          'Content-Type': 'application/json',  
          'api-key': azureApiKey  
        }  
      }  
    );  
  
    console.log('Received response from Azure OpenAI for debriefing');  
    let content = response.data.choices[0].message.content;  
    console.log('Raw content:', content);  
  
    content = content.replace(/```json|```/g, '').trim();  
  
    try {  
      const parsedContent = JSON.parse(content);  
      res.json(parsedContent);  
    } catch (parseError) {  
      console.error('Error parsing JSON:', parseError);  
      res.status(500).json({ error: 'Failed to parse JSON response', details: parseError.message });  
    }  
  } catch (error) {  
    console.error('Error in OpenAI debriefing request:', error);  
    res.status(500).json({  
      error: 'Failed to generate debriefing',  
      details: error.response ? error.response.data : error.message  
    });  
  }  
});  
  
// DALL-E Endpoint  
app.post('/api/dalle/image', async (req, res) => {  
  const { prompt } = req.body;  
  
  const requestBody = {  
    prompt,  
    size: "1024x1024",  
    n: 1,  
    quality: "standard",  
    style: "vivid"  
  };  
  
  logRequest('DALL-E', requestBody);  
  
  try {  
    const response = await axios.post(  
      dalleEndpoint,  
      requestBody,  
      {  
        headers: {  
          'Content-Type': 'application/json',  
          'api-key': azureApiKey  
        }  
      }  
    );  
  
    console.log('Received response from DALL-E');  
  
    if (response.data && response.data.data.length > 0) {  
      const imageUrl = response.data.data[0].url;  
      res.json({ imagePath: imageUrl });  
    } else {  
      res.status(500).json({ error: 'No images generated.' });  
    }  
  } catch (error) {  
    logError('DALL-E Request', error);  
    res.status(500).json({ error: 'Failed to generate image', details: error.message });  
  }  
});  

  
app.listen(GPT_PORT, () => {  
  console.log(`GPT server is running on port ${GPT_PORT}`);  
});  
  
app.listen(DALLE_PORT, () => {  
  console.log(`DALL-E server is running on port ${DALLE_PORT}`);  
});  
