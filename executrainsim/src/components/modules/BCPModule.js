import React, { useState } from 'react';  
import axios from 'axios';  
import '../styles/AppStyles.css';  
  
const disasterOptions = [  
  { value: 'earthquake', label: 'Earthquake' },  
  { value: 'death_of_leader', label: 'Death of Leader' },  
  { value: 'war', label: 'War' },  
  { value: 'electricity', label: 'Electricity Outage' },  
  { value: 'fire', label: 'Fire' },  
  { value: 'custom', label: 'Custom Disaster' }  
];  
  
const BCPModule = ({ role, experienceLevel, difficulty }) => {  
  const [selectedDisaster, setSelectedDisaster] = useState('');  
  const [customDisaster, setCustomDisaster] = useState('');  
  const [scenario, setScenario] = useState(null);  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);  
  const [answers, setAnswers] = useState([]);  
  const [isFetching, setIsFetching] = useState(false);  
  const [feedback, setFeedback] = useState(null);  
  const [image, setImage] = useState(null);  
  
  const startSimulation = async () => {  
    setIsFetching(true);  
    try {  
      const disasterDescription = selectedDisaster === 'custom' ? customDisaster : disasterOptions.find(option => option.value === selectedDisaster).label;  
      const response = await axios.post('/api/openai/initial', {  
        role,  
        experienceLevel,  
        difficulty,  
        topic: `BCP scenario for ${disasterDescription}`  
      });  
      setScenario(response.data.scenario);  
      await generateImage(response.data.scenario.title, response.data.scenario.description);  
    } catch (error) {  
      console.error('Error fetching scenario:', error);  
    } finally {  
      setIsFetching(false);  
    }  
  };  
  
  const generateImage = async (title, description) => {  
    try {  
      const response = await axios.post('/api/dalle/image', {  
        prompt: `Illustrate a BCP scenario titled "${title}": "${description}". Use colorful 1990s clip art style.`  
      });  
      setImage(response.data.imagePath);  
    } catch (error) {  
      console.error('Error generating image:', error);  
    }  
  };  
  
  const handleAnswer = async (answerIndex) => {  
    const selectedOption = scenario.options[answerIndex].description;  
    try {  
      const response = await axios.post('/api/openai/followup', {  
        role,  
        experienceLevel,  
        difficulty,  
        scenario: scenario.description,  
        question: scenario.initial_question,  
        answer: selectedOption,  
        previousAnswers: answers  
      });  
      const { next_question, score } = response.data;  
      setAnswers([...answers, { question: scenario.initial_question, answer: selectedOption, feedback: score.feedback }]);  
      setFeedback(score.feedback);  
      setScenario({  
        ...scenario,  
        description: next_question.scenario_description,  
        options: next_question.options,  
        initial_question: next_question.question  
      });  
      setCurrentQuestionIndex(currentQuestionIndex + 1);  
      await generateImage(next_question.title, next_question.scenario_description);  
    } catch (error) {  
      console.error('Error handling answer:', error);  
    }  
  };  
  
  return (  
    <div className="module-container">  
      <h2>Business Continuity Planning (BCP) Simulation</h2>  
      {!scenario && (  
        <div className="setup-container">  
          <label>Select a disaster scenario:</label>  
          <select onChange={(e) => setSelectedDisaster(e.target.value)} value={selectedDisaster}>  
            <option value="">Choose a disaster</option>  
            {disasterOptions.map((option) => (  
              <option key={option.value} value={option.value}>{option.label}</option>  
            ))}  
          </select>  
          {selectedDisaster === 'custom' && (  
            <input  
              type="text"  
              placeholder="Describe your custom disaster"  
              value={customDisaster}  
              onChange={(e) => setCustomDisaster(e.target.value)}  
              className="custom-disaster-input"  
            />  
          )}  
          <button onClick={startSimulation} disabled={!selectedDisaster || (selectedDisaster === 'custom' && !customDisaster)}>Start BCP Simulation</button>  
        </div>  
      )}  
      {scenario && (  
        <div className="scenario-container">  
          {image && <img src={image} alt="Scenario Illustration" className="scenario-image" />}  
          <p><strong>Scenario:</strong> {scenario.description}</p>  
          <p><strong>Question:</strong> {scenario.initial_question}</p>  
          <div className="options-container">  
            {scenario.options.map((option, index) => (  
              <button key={index} onClick={() => handleAnswer(index)}>{option.description}</button>  
            ))}  
          </div>  
          {feedback && <div className="feedback-container"><p>{feedback}</p></div>}  
        </div>  
      )}  
    </div>  
  );  
};  
  
export default BCPModule;  