require('dotenv').config();  
const express = require('express');  
const axios = require('axios');  
const bodyParser = require('body-parser');  
const cors = require('cors');  
  
const app = express();  
app.use(cors());  
app.use(bodyParser.json());  
  
const PORT = process.env.PORT || 5000;  
  
app.post('/api/openai/initial', async (req, res) => {  
  const { role, experienceLevel, difficulty } = req.body;  
  const endpoint = `https://thinkmastereast.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2023-03-15-preview`;  
  
  const prompt = `Generate an engaging business scenario for a ${role} with ${experienceLevel} experience at ${difficulty} difficulty. Create the initial question, scenario description, and several options with potential consequences for each choice. Return a JSON object with: { "scenario": { "title": "Scenario Title", "description": "Detailed scenario description", "initial_question": "The initial question for the user", "options": [ {"description": "Option 1 description"}, {"description": "Option 2 description"}, {"description": "Option 3 description"}, {"description": "Option 4 description"} ] } }`;  
  
  console.log('Sending request to Azure OpenAI with prompt:', prompt);  
  
  try {  
    const response = await axios.post(  
      endpoint,  
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
          'api-key': `${process.env.AZURE_OPENAI_API_KEY}`  
        }  
      }  
    );  
  
    console.log('Received response from Azure OpenAI');  
    let content = response.data.choices[0].message.content;  
    console.log('Raw content:', content);  
  
    // Remove backticks and ensure content is trimmed  
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
  
app.listen(PORT, () => {  
  console.log(`Server is running on port ${PORT}`);  
});  
