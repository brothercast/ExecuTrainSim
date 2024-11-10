import React, { useState } from 'react';  
import axios from 'axios';  
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';  
import Button from '../ui/Button';  
import Select from '../ui/Select';  
import '../../styles/AppStyles.css';  
  
const API_BASE_URL = process.env.NODE_ENV === 'development'  
  ? 'http://localhost:5000'  
  : 'https://executrainsim.azurewebsites.net';  
  
const PerformanceChallengeModule = ({ onReturn }) => {  
  const [role, setRole] = useState('');  
  const [experienceLevel, setExperienceLevel] = useState('');  
  const [difficulty, setDifficulty] = useState('');  
  const [useCustomScenario, setUseCustomScenario] = useState(false);  
  const [errorMessage, setErrorMessage] = useState('');  
  const [isFetching, setIsFetching] = useState(false);  
  
  const roles = [  
    { value: 'ceo', title: 'CEO - Chief Executive Officer' },  
    { value: 'cfo', title: 'CFO - Chief Financial Officer' },  
    { value: 'cmo', title: 'CMO - Chief Marketing Officer' },  
    { value: 'cto', title: 'CTO - Chief Technology Officer' },  
    { value: 'coo', title: 'COO - Chief Operations Officer' },  
    { value: 'chro', title: 'CHRO - Chief Human Resources Officer' },  
    { value: 'custom', title: 'Custom Role' }  
  ];  
  
  const experienceLevels = [  
    { value: 'junior', title: 'Junior (0-2 years)' },  
    { value: 'mid', title: 'Mid-level (3-5 years)' },  
    { value: 'senior', title: 'Senior (6-10 years)' },  
    { value: 'executive', title: 'Executive (10+ years)' }  
  ];  
  
  const difficultyLevels = [  
    { value: 'easy', title: 'Easy' },  
    { value: 'medium', title: 'Medium' },  
    { value: 'hard', title: 'Hard' },  
    { value: 'expert', title: 'Expert' }  
  ];  
  
  const startSimulation = async () => {  
    if (!role || !experienceLevel || !difficulty) {  
      setErrorMessage('Please select a role, experience level, and difficulty to start the simulation.');  
      return;  
    }  
    setErrorMessage('');  
  
    try {  
      const scenarioData = await fetchOpenAIResponse({ role, experienceLevel, difficulty }, '/api/openai/initial');  
      if (!scenarioData || !scenarioData.scenario) {  
        throw new Error('Failed to generate scenario');  
      }  
    } catch (error) {  
      console.error('Error starting simulation:', error);  
      setErrorMessage('Failed to start simulation. Please try again.');  
    }  
  };  
  
  const fetchOpenAIResponse = async (input, endpointPath) => {  
    setIsFetching(true);  
    try {  
      const response = await axios.post(`${API_BASE_URL}${endpointPath}`, input, { headers: { 'Content-Type': 'application/json' } });  
      return response.data;  
    } catch (error) {  
      console.error('Error fetching from OpenAI:', error);  
      throw new Error(error.response ? error.response.data : error.message);  
    } finally {  
      setIsFetching(false);  
    }  
  };  
  
  return (  
    <div className="app-container">  
      <header className="app-header">  
        <div className="header-box">  
          <span className="header-title">Executive Training Simulation</span>  
        </div>  
      </header>  
  
      <main className="content-grid">  
        <aside className="left-column">  
          <img src="/path/to/image.png" alt="Performance Challenge" className="scenario-image" />  
          <h3>PERFORMANCE CHALLENGE</h3>  
          <p>  
            Unleash your strategic prowess with our Performance Challenge Module. This immersive simulation puts you in the driver's seat of high-stakes business scenarios tailored to your role and experience level.  
          </p>  
          <p>  
            Navigate complex challenges, make impactful decisions, and see the consequences unfold in real-time. Whether you're a budding executive or a seasoned leader, this module offers a dynamic environment to hone your skills, improve decision-making, and prepare for real-world business situations. Step up to the challenge and elevate your executive capabilities today!  
          </p>  
          <Button onClick={onReturn} className="restart-button">Return to Simulation Library</Button>  
        </aside>  
  
        <section className="main-content">  
          {errorMessage && (  
            <div className="error-box">  
              <h4 className="error-title">Error</h4>  
              <p>{errorMessage}</p>  
            </div>  
          )}  
  
          <Card className="setup-card">  
            <CardHeader>  
              <CardTitle>SETUP YOUR SIMULATION</CardTitle>  
            </CardHeader>  
            <CardContent>  
              <div className="form-group">  
                <label>Select your role</label>  
                <Select onValueChange={setRole} value={role}>  
                  <option value="">Choose a role</option>  
                  {roles.map((r) => (  
                    <option key={r.value} value={r.value}>{r.title}</option>  
                  ))}  
                </Select>  
              </div>  
              <div className="form-group">  
                <label>Select your experience level</label>  
                <Select onValueChange={setExperienceLevel} value={experienceLevel}>  
                  <option value="">Choose experience level</option>  
                  {experienceLevels.map((level) => (  
                    <option key={level.value} value={level.value}>{level.title}</option>  
                  ))}  
                </Select>  
              </div>  
              <div className="form-group">  
                <label>Select difficulty level</label>  
                <Select onValueChange={setDifficulty} value={difficulty}>  
                  <option value="">Choose difficulty</option>  
                  {difficultyLevels.map((level) => (  
                    <option key={level.value} value={level.value}>{level.title}</option>  
                  ))}  
                </Select>  
              </div>  
              <div className="form-group">  
                <label>  
                  <input  
                    type="checkbox"  
                    checked={useCustomScenario}  
                    onChange={() => setUseCustomScenario(!useCustomScenario)}  
                  />  
                  Use Custom Scenario  
                </label>  
              </div>  
              <div className="button-group">  
                <Button onClick={startSimulation}>Start Simulation</Button>  
              </div>  
            </CardContent>  
          </Card>  
        </section>  
      </main>  
    </div>  
  );  
};  
  
export default PerformanceChallengeModule;  