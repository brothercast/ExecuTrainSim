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
  
app.post('/api/openai/followup', async (req, res) => {    
  const { role, experienceLevel, difficulty, scenario, question, answer, previousAnswers } = req.body;    
      
  const endpoint = `https://thinkmastereast.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2023-03-15-preview`;    
    
  const prompt = `Given the scenario: "${scenario}", and the question: "${question}", you answered: "${answer}". Based on this, generate the next question and update the scenario by introducing new elements, challenges, or twists. The updated scenario should reflect changes or consequences of the previous decision, and introduce fresh dynamics that keep the user engaged. Provide feedback and a score for the chosen answer. Return a JSON object with:  
  {  
    "next_question": {   
      "question": "Next question for the user",   
      "scenario_description": "Updated scenario description introducing new dynamics",   
      "options": [   
        {"description": "Option 1"},   
        {"description": "Option 2"},   
        {"description": "Option 3"},   
        {"description": "Option 4"}   
      ]   
    },   
    "score": {   
      "current_score": 10,   
      "feedback": "Detailed feedback"   
    }   
  }`;  
  
  console.log('Sending follow-up request to Azure OpenAI with prompt:', prompt);    
    
  try {    
    const response = await axios.post(    
      endpoint,    
      {    
        model: 'gpt-4o-mini',    
        messages: [    
          { role: "system", content: "You are a helpful assistant that responds in JSON format." },    
          { role: "user", content: prompt }    
        ],    
        temperature: 0.85,  // Increased temperature for more creative responses  
        max_tokens: 1800    
      },    
      {    
        headers: {    
          'Content-Type': 'application/json',    
          'api-key': `${process.env.AZURE_OPENAI_API_KEY}`    
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
    
  const endpoint = `https://thinkmastereast.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2023-03-15-preview`;  
  
  const prompt = `Provide a debriefing summary for the scenario: "${scenario}" based on the user's answers: ${JSON.stringify(answers)}. Include strengths, areas for improvement, overall score, letter grade, and advice. Return a JSON object with: { "debriefing": { "summary": "Summary of the simulation", "strengths": ["Strength 1", "Strength 2"], "areasForImprovement": ["Improvement 1", "Improvement 2"], "overallScore": 85, "letterGrade": "B", "stars": 4, "advice": "Advice for improvement" } }`;  
  
  console.log('Sending debriefing request to Azure OpenAI with prompt:', prompt);  
  
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

  
app.listen(PORT, () => {  
  console.log(`Server is running on port ${PORT}`);  
});  
