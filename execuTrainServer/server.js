require('dotenv').config();  
const express = require('express');  
const axios = require('axios');  
const bodyParser = require('body-parser');  
const cors = require('cors');  
  
const app = express();  
app.use(cors());  
app.use(bodyParser.json());  
  
const PORT = process.env.PORT || 5000;  
const endpoint = `https://thinkmastereast.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2023-03-15-preview`;  
  
// Helper function to fetch response from OpenAI  
const fetchOpenAIResponse = async (prompt) => {  
  try {  
    console.log('Sending request to Azure OpenAI with prompt:', prompt);  
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
  
    console.log('Received response from Azure OpenAI', response.data);  
    const content = response.data.choices[0].message.content;  
    console.log('Response content:', content);  
    return content;  
  } catch (error) {  
    console.error('Error in OpenAI request:', error);  
    throw new Error(error.response ? error.response.data : error.message);  
  }  
};  
  
// Route for generating the initial question and scenario  
app.post('/api/openai/initial', async (req, res) => {  
  const { role, experienceLevel, difficulty } = req.body;  
  const prompt = `Generate an engaging business scenario for a ${role} with ${experienceLevel} experience at ${difficulty} difficulty.   
  Create the initial question, scenario description, and several options with potential consequences for each choice. Return a JSON object with:  
  {  
    "scenario": {  
      "title": "Scenario Title",  
      "description": "Detailed scenario description",  
      "initial_question": "The initial question for the user",  
      "options": [  
        {"description": "Option 1 description"},  
        {"description": "Option 2 description"},  
        {"description": "Option 3 description"},  
        {"description": "Option 4 description"}  
      ]  
    }  
  }`;  
  
  try {  
    const content = await fetchOpenAIResponse(prompt);  
    res.json({ content });  
  } catch (error) {  
    res.status(500).json({  
      error: 'Failed to generate initial scenario',  
      details: error.message  
    });  
  }  
});  
  
// Route for generating follow-up questions based on user answers  
app.post('/api/openai/followup', async (req, res) => {  
  const { role, experienceLevel, difficulty, scenario, question, answer, previousAnswers = [] } = req.body;  
  const prompt = `Given the user's choice: "${answer}", for the scenario "${scenario}", update the scenario with new developments.   
  Generate the next question, options, and describe potential consequences. Provide feedback and a score for the user's decision. Return a JSON object with:  
  {  
    "next_question": {  
      "question": "The next question for the user",  
      "scenario_description": "Updated scenario description",  
      "options": [  
        {"description": "Option 1 description"},  
        {"description": "Option 2 description"},  
        {"description": "Option 3 description"},  
        {"description": "Option 4 description"}  
      ]  
    },  
    "score": {"current_score": 0, "feedback": "Feedback based on the user's choice"}  
  }`;  
  
  try {  
    const content = await fetchOpenAIResponse(prompt);  
    res.json({ content });  
  } catch (error) {  
    res.status(500).json({  
      error: 'Failed to generate follow-up question',  
      details: error.message  
    });  
  }  
});  
  
// Route for generating debriefing  
app.post('/api/openai/debriefing', async (req, res) => {  
  const { scenario, answers } = req.body;  
  const prompt = `Given the scenario "${scenario}" and the user's answers: ${JSON.stringify(answers)}, generate a debriefing report.   
  Return a JSON object with:  
  {  
    "debriefing": {  
      "summary": "Summary of the user's performance",  
      "strengths": ["List of strengths"],  
      "areasForImprovement": ["List of areas for improvement"],  
      "overallScore": 0,  
      "letterGrade": "A",  
      "advice": "Advice for improvement"  
    }  
  }`;  
  
  try {  
    const content = await fetchOpenAIResponse(prompt);  
    res.json({ content });  
  } catch (error) {  
    res.status(500).json({  
      error: 'Failed to generate debriefing',  
      details: error.message  
    });  
  }  
});  
  
app.listen(PORT, () => {  
  console.log(`Server is running on port ${PORT}`);  
});  
