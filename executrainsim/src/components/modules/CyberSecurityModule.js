// src/components/modules/CybersecurityModule.js  
  
import React, { useState, useEffect } from 'react';  
import axios from 'axios';  
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';  
import Button from '../ui/Button';  
import Select from '../ui/Select';  
import Progress from '../ui/Progress';  
import SevenSegmentDisplay from '../effects/SevenSegmentDisplay';  
import { BarLoader, GridLoader } from 'react-spinners';  
import { AlertTriangle, CheckCircle, Edit, Menu } from 'lucide-react';  
import '../../styles/AppStyles.css';  
  
const API_BASE_URL = process.env.NODE_ENV === 'development'  
  ? 'http://localhost:5000'  
  : 'https://executrainsim.azurewebsites.net';  
  
const CybersecurityModule = ({ onReturn = () => {}, onSelectModule = () => {}, modules = [] }) => {  
  const [role, setRole] = useState('');  
  const [dropdownVisible, setDropdownVisible] = useState(false);  
  const [difficulty, setDifficulty] = useState('');  
  const [scenario, setScenario] = useState(null);  
  const [alerts, setAlerts] = useState([]);  
  const [selectedAlert, setSelectedAlert] = useState(null);  
  const [progress, setProgress] = useState(0);  
  const [simulationComplete, setSimulationComplete] = useState(false);  
  const [debriefing, setDebriefing] = useState(null);  
  const [errorMessage, setErrorMessage] = useState('');  
  const [isFetching, setIsFetching] = useState(false);  
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes  
  const [notifications, setNotifications] = useState([]);  
  const [customScenarioText, setCustomScenarioText] = useState('');  
  const [useCustomScenario, setUseCustomScenario] = useState(false);  
  const [customActions, setCustomActions] = useState({}); 
  const [isEditingScenario, setIsEditingScenario] = useState(false);  
  const [editableScenario, setEditableScenario] = useState('');  
  const [isEditingRoles, setIsEditingRoles] = useState([false, false]); 
  
  const roles = [  
    { value: 'security-analyst', title: 'Security Analyst' },  
    { value: 'it-manager', title: 'IT Manager' },  
    { value: 'ciso', title: 'CISO - Chief Information Security Officer' },  
    { value: 'software-developer', title: 'Software Developer' },  
    { value: 'network-administrator', title: 'Network Administrator' },  
    { value: 'hr-manager', title: 'HR Manager' },  
    { value: 'finance-director', title: 'Finance Director' },  
    { value: 'custom', title: 'Custom Role' },  
  ];  
  
  const difficultyLevels = [  
    { value: 'easy', title: 'Easy' },  
    { value: 'medium', title: 'Medium' },  
    { value: 'hard', title: 'Hard' },  
    { value: 'expert', title: 'Expert' },  
  ];  
  
  useEffect(() => {  
    if (timeLeft <= 0) {  
      setSimulationComplete(true);  
    } else {  
      const timer = setInterval(() => {  
        setTimeLeft((prevTime) => prevTime - 1);  
      }, 1000);  
      return () => clearInterval(timer);  
    }  
  }, [timeLeft]);  
  
  useEffect(() => {  
    if (difficulty === 'expert') {  
      const eventInterval = setInterval(() => {  
        addNotification("New security incident detected!");  
        // Introduce more decision points or change scenario state  
      }, 60000); // Every minute  
  
      return () => clearInterval(eventInterval);  
    }  
  }, [difficulty]);  
  
  const addNotification = (message) => {  
    setNotifications((prev) => [...prev, message]);  
  };  
  
  const startSimulation = async () => {  
    const selectedRole = role === 'custom' ? 'Custom Role' : roles.find((r) => r.value === role)?.title;  
    if (!selectedRole || !difficulty) {  
      setErrorMessage('Please select a role and difficulty to start the simulation.');  
      return;  
    }  
    setErrorMessage('');  
    setIsFetching(true);  
    
    const prompt = useCustomScenario && customScenarioText  
      ? `Given the custom scenario: "${customScenarioText}", generate a title, initial question, and options.`  
      : `Generate a cybersecurity scenario for a ${selectedRole} at ${difficulty} difficulty. The scenario should be realistic and challenging, with clear objectives and multiple decision points. Respond in a JSON format with the following fields: scenario.title, scenario.description, scenario.objectives, scenario.decision_points, scenario.final_outcome, scenario.feedback.`;  
    
    try {  
      const response = await axios.post(`${API_BASE_URL}/api/generate`, { prompt });  
      const messageContent = response.data.content;  
      const parsedScenario = JSON.parse(messageContent);  
    
      if (parsedScenario && parsedScenario.scenario) {  
        setScenario(parsedScenario.scenario);  
        resetStateVariables();  
      } else {  
        throw new Error('Failed to generate scenario');  
      }  
    } catch (error) {  
      console.error('Error starting simulation:', error);  
      if (error.response) {  
        setErrorMessage(`Failed to start simulation: ${error.response.data.error}`);  
      } else {  
        setErrorMessage('Failed to start simulation. Please try again.');  
      }  
    } finally {  
      setIsFetching(false);  
    }  
  };  
  
  const handleScenarioEdit = () => {  
    setIsEditingScenario(true);  
    setEditableScenario(scenario.context);  
  };  

  const saveScenarioEdit = () => {  
    setIsEditingScenario(false);  
    setScenario((prevScenario) => ({  
      ...prevScenario,  
      context: editableScenario,  
    }));  
  }; 

  const toggleRoleEdit = (index) => {  
    const updatedEditingRoles = [...isEditingRoles];  
    updatedEditingRoles[index] = !updatedEditingRoles[index];  
    setIsEditingRoles(updatedEditingRoles);  
  }; 

  const handleAlertSelection = (alert) => {  
    setSelectedAlert(alert);  
  };  
  
  const handleResolution = async (actionIndex, customAction = null) => {  
    if (!selectedAlert) return;  
  
    const actionDescription = customAction || scenario.decision_points[selectedAlert.id - 1].options[actionIndex].option;  
  
    const requestData = {  
      model: 'gpt-4o-mini',  
      messages: [  
        { role: "system", content: "You are the engine of a simulation tasked with challenging users to solve complex and realistic cybersecurity scenarios. Respond with urgency and provide engaging content that tests the user's decision-making skills." },  
        { role: "user", content: `Given the alert: "${selectedAlert.description}" and the action: "${actionDescription}", provide feedback and update the scenario with new challenges or twists.` }  
      ],  
      temperature: 0.85,  
      max_tokens: 1800,  
    };  
  
    try {  
      const response = await axios.post(`${API_BASE_URL}/api/generate`, requestData);  
      updateScenario(response.data);  
    } catch (error) {  
      console.error('Error handling resolution:', error);  
      setErrorMessage('Failed to handle resolution. Please try again.');  
    }  
  };  
  
  const updateScenario = (result) => {  
    if (!result || !result.scenario_description) {  
      setErrorMessage('Invalid response format from server.');  
      return;  
    }  
  
    setScenario(prevScenario => ({  
      ...prevScenario,  
      description: result.scenario_description,  
    }));  
    setProgress(prevProgress => Math.min(prevProgress + 10, 100));  
    if (progress >= 80) {  
      setSimulationComplete(true);  
      generateDebriefing();  
    }  
  };  
  
  const generateDebriefing = async () => {  
    const requestData = {  
      model: 'gpt-4o-mini',  
      messages: [  
        { role: "system", content: "You are the engine of a simulation tasked with challenging users to solve complex and realistic cybersecurity scenarios. Respond with urgency and provide engaging content that tests the user's decision-making skills." },  
        { role: "user", content: `Provide a detailed debriefing for the completed scenario, including strengths, areas for improvement, and overall performance.` }  
      ],  
      temperature: 0.85,  
      max_tokens: 1800,  
    };  
  
    try {  
      const response = await axios.post(`${API_BASE_URL}/api/generate`, requestData);  
      if (response.data && response.data.debriefing) {  
        setDebriefing(response.data.debriefing);  
      } else {  
        throw new Error('Failed to generate debriefing');  
      }  
    } catch (error) {  
      console.error('Error generating debriefing:', error);  
      setErrorMessage('Failed to generate debriefing. Please try again.');  
    }  
  };  
  
  const resetStateVariables = () => {  
    setProgress(0);  
    setAlerts([]);  
    setSelectedAlert(null);  
    setSimulationComplete(false);  
    setDebriefing(null);  
    setTimeLeft(300);  
    setNotifications([]);  
    setCustomActions({});  
  };  
  
  const calculateScore = () => {  
    // Calculate score based on resolved issues, time left, etc.  
    const score = alerts.length * 100 - (300 - timeLeft);  
    return score;  
  };  
  
  return (  
    <div className="app-container">  
      <header className="app-header">  
        <div className="header-box">  
          <span className="header-title">Cybersecurity Simulation</span>  
          <Menu className="hamburger-icon" onClick={() => setDropdownVisible(!dropdownVisible)} />  
          {dropdownVisible && (  
            <div className="dropdown-menu">  
              {modules.map((module, index) => (  
                <div key={index} onClick={() => onSelectModule(module.title)}>  
                  {module.title}  
                </div>  
              ))}  
            </div>  
          )}  
        </div>  
      </header>  
  
      <main className="content-grid">  
        <aside className="left-column">  
          {scenario ? (  
            <>  
              <Button onClick={onReturn} className="return-button">  
                Return to Module Library  
              </Button>  
              <Card className="details-card">  
                <CardHeader>  
                  <CardTitle>Your Simulation</CardTitle>  
                </CardHeader>  
                <CardContent>  
                  <div className="progress-info">  
                    <Progress value={progress} />  
                    <span className="progress-text">{progress}% Complete</span>  
                  </div>  
                  <div className="user-settings">  
                    <p><strong>Role:</strong> {role === 'custom' ? 'Custom Role' : roles.find((r) => r.value === role).title}</p>  
                    <p><strong>Difficulty:</strong> {difficultyLevels.find((level) => level.value === difficulty).title}</p>  
                  </div>  
                  <SevenSegmentDisplay value={Math.floor(timeLeft / 60)} />  
                  <Button onClick={resetStateVariables} className="restart-button">  
                    Restart Simulation  
                  </Button>  
                </CardContent>  
              </Card>  
            </>  
          ) : (  
            <Card className="details-card">  
              <CardContent>  
                <img src="../images/CybersecurityModule.png" alt="Scenario Illustration" className="scenario-image" />  
              </CardContent>  
              <CardHeader>  
                <CardTitle>Cybersecurity Challenge</CardTitle>  
              </CardHeader>  
              <CardContent>  
                <p>Engage in a realistic cybersecurity incident simulation. Make critical decisions to defend against threats and protect your organization.</p>  
              </CardContent>  
            </Card>  
          )}  
        </aside>  
  
        <section className="main-content">  
          {errorMessage && (  
            <div className="error-box">  
              <h4 className="error-title">Error</h4>  
              <p>{errorMessage}</p>  
            </div>  
          )}  
  
          {!simulationComplete ? (  
            scenario ? (  
              <>  
                <Card className="dashboard-card">  
                  <CardHeader>  
                    <CardTitle>Active Alerts</CardTitle>  
                  </CardHeader>  
                  <CardContent>  
                    {alerts.map((alert) => (  
                      <div key={alert.id} onClick={() => handleAlertSelection(alert)} className="alert-item">  
                        <AlertTriangle className="icon" />  
                        <span>{alert.description}</span>  
                      </div>  
                    ))}  
                  </CardContent>  
                </Card>  
                {selectedAlert && (  
                  <Card className="scenario-card">  
                    <CardHeader>  
                      <CardTitle>{selectedAlert.description}</CardTitle>  
                    </CardHeader>  
                    <CardContent>  
                      <p>Choose an action to resolve the alert:</p>  
                      <div className="options-container">  
                        {scenario.decision_points[selectedAlert.id - 1].options.map((option, index) => (  
                          <Button key={index} onClick={() => handleResolution(index)} className="option-button">  
                            {option.option}  
                          </Button>  
                        ))}  
                        <div className="custom-answer-section">  
                          <textarea  
                            placeholder="Enter custom response here"  
                            value={customActions[selectedAlert.id] || ''}  
                            onChange={(e) => setCustomActions((prev) => ({  
                              ...prev,  
                              [selectedAlert.id]: e.target.value,  
                            }))}  
                            className="custom-answer-textarea"  
                          />  
                          <Button onClick={() => handleResolution(null, customActions[selectedAlert.id])}>  
                            Submit Custom Response  
                          </Button>  
                        </div>  
                      </div>  
                    </CardContent>  
                  </Card>  
                )}  
              </>  
            ) : (  
              <Card className="setup-card">  
                <CardHeader>  
                  <CardTitle>Setup Your Simulation</CardTitle>  
                </CardHeader>  
                <CardContent>  
                  <div className="form-group">  
                    <label>Select your role</label>  
                    <Select onValueChange={setRole} value={role} disabled={scenario}>  
                      <option value="">Choose a role</option>  
                      {roles.map((r) => (  
                        <option key={r.value} value={r.value}>{r.title}</option>  
                      ))}  
                    </Select>  
                  </div>  
                  <div className="form-group">  
                    <label>Select difficulty level</label>  
                    <Select onValueChange={setDifficulty} value={difficulty} disabled={scenario}>  
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
                  {useCustomScenario && (  
                    <div className="form-group">  
                      <textarea  
                        placeholder="Enter your custom scenario here."  
                        value={customScenarioText}  
                        onChange={(e) => setCustomScenarioText(e.target.value)}  
                        rows="4"  
                        className="custom-scenario-textarea"  
                      />  
                    </div>  
                  )}  
                  <div className="button-group">  
                    <Button onClick={startSimulation} disabled={isFetching}>  
                      {isFetching ? 'Starting...' : 'Start Simulation'}  
                    </Button>  
                  </div>  
                </CardContent>  
              </Card>  
            )  
          ) : (  
            debriefing && (  
              <div className="debriefing-section">  
                <h4 className="debriefing-title">Simulation Debriefing</h4>  
                <p><strong>Summary:</strong> {debriefing.summary}</p>  
                <p><strong>Strengths:</strong> {debriefing.strengths ? debriefing.strengths.join(', ') : 'None'}</p>  
                <p><strong>Areas for Improvement:</strong> {debriefing.areasForImprovement ? debriefing.areasForImprovement.join(', ') : 'None'}</p>  
                <p><strong>Overall Score:</strong> {calculateScore()}</p>  
                <p><strong>Letter Grade:</strong> {debriefing.letterGrade}</p>  
                <div className="stars-container">  
                  {[...Array(debriefing.stars || 0)].map((_, i) => (  
                    <CheckCircle key={i} className="star filled" />  
                  ))}  
                  {[...Array(5 - (debriefing.stars || 0))].map((_, i) => (  
                    <CheckCircle key={i} className="star" />  
                  ))}  
                </div>  
                <p><strong>Recommendations:</strong> {debriefing.advice}</p>  
                <div className="action-buttons">  
                  <Button onClick={() => setSimulationComplete(false)}>Try Different Choices</Button>  
                  <Button onClick={resetStateVariables}>Run as Different Role</Button>  
                </div>  
              </div>  
            )  
          )}  
        </section>  
  
        <section className="notifications">  
          <h4>Notifications</h4>  
          {notifications.map((note, index) => (  
            <div key={index} className="notification">  
              {note}  
            </div>  
          ))}  
        </section>  
      </main>  
    </div>  
  );  
};  
  
// Export the module component and its metadata  
export const metadata = {  
  title: 'Cybersecurity Challenge',  
  description: 'Engage in a realistic cybersecurity incident simulation. Make critical decisions to defend against threats and protect your organization.',  
  imageUrl: '../images/CybersecurityModule.png',  
  component: CybersecurityModule,  
};  
  
export default CybersecurityModule;  