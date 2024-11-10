import React, { useState } from 'react';  
import axios from 'axios';  
import '../styles/AppStyles.css';  
  
const CyberSecurityModule = ({ role, experienceLevel, difficulty }) => {  
  const [scenario, setScenario] = useState(null);  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);  
  const [answers, setAnswers] = useState([]);  
  const [isFetching, setIsFetching] = useState(false);  
  const [feedback, setFeedback] = useState(null);  
  const [image, setImage] = useState(null);  
  
  const startSimulation = async () => {  
    setIsFetching(true);  
    try {  
      const response = await axios.post('/api/openai/initial', {  
        role,  
        experienceLevel,  
        difficulty,  
        topic: 'cybersecurity threat management'  
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
        prompt: `Illustrate a cybersecurity scenario titled "${title}": "${description}". Use colorful 1990s clip art style.`  
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
      <h2>Cybersecurity Threat Management</h2>  
      {!scenario && <button onClick={startSimulation} disabled={isFetching}>Start Cybersecurity Simulation</button>}  
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
  
export default CyberSecurityModule;  