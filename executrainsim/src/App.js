import React, { useState, useEffect } from 'react';  
import axios from 'axios';  
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';  
import Button from './components/ui/Button';  
import Select from './components/ui/Select';  
import Progress from './components/ui/Progress';  
import { Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';  
import './styles/AppStyles.css';  
  
const ExecutiveTrainingSimulator = () => {  
  const [role, setRole] = useState('');  
  const [customRole, setCustomRole] = useState('');  
  const [experienceLevel, setExperienceLevel] = useState('');  
  const [difficulty, setDifficulty] = useState('');  
  const [scenario, setScenario] = useState(null);  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);  
  const [answers, setAnswers] = useState([]);  
  const [progress, setProgress] = useState(0);  
  const [totalScore, setTotalScore] = useState(() => parseInt(localStorage.getItem('totalScore'), 10) || 0);  
  const [simulationComplete, setSimulationComplete] = useState(false);  
  const [debriefing, setDebriefing] = useState(null);  
  const [imagePath, setImagePath] = useState(null);  
  const [customAnswers, setCustomAnswers] = useState({});  
  const [useCustomScenario, setUseCustomScenario] = useState(false);  
  const [customScenarioText, setCustomScenarioText] = useState('');  
  const [errorMessage, setErrorMessage] = useState('');  
  
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
  
  useEffect(() => {  
    localStorage.setItem('totalScore', totalScore);  
  }, [totalScore]);  
  
  const fetchOpenAIResponse = async (input, endpointPath) => {  
    try {  
      const response = await axios.post(`${process.env.REACT_APP_API_URL}${endpointPath}`, input, { headers: { 'Content-Type': 'application/json' } });  
      return response.data;  
    } catch (error) {  
      console.error('Error fetching from OpenAI:', error);  
      setErrorMessage('Failed to fetch data from the server.');  
      return null;  
    }  
  };  
  
  const generateImage = async (prompt) => {  
    try {  
      const response = await axios.post(`${process.env.REACT_APP_IMAGE_API_URL}/api/dalle/image`, { prompt });  
      setImagePath(response.data.imagePath);  
    } catch (error) {  
      console.error('Error generating image:', error.message);  
      setErrorMessage('Failed to generate image.');  
    }  
  };  
  
  const generateSampleScenario = async () => {  
    const missingFields = [];  
    if (!role) missingFields.push("role");  
    if (!experienceLevel) missingFields.push("experience level");  
    if (!difficulty) missingFields.push("difficulty");  
  
    if (missingFields.length > 0) {  
      setErrorMessage(`Please select a ${missingFields.join(', ')} before generating a sample scenario.`);  
      return;  
    }  
  
    try {  
      const scenarioData = await fetchOpenAIResponse(  
        {  
          role: role === 'custom' ? customRole : roles.find(r => r.value === role).title,  
          experienceLevel: experienceLevels.find(level => level.value === experienceLevel).title,  
          difficulty: difficultyLevels.find(level => level.value === difficulty).title,  
        },  
        '/api/openai/initial'  
      );  
  
      if (scenarioData && scenarioData.scenario) {  
        setCustomScenarioText(scenarioData.scenario.description);  
      } else {  
        throw new Error('Scenario data is missing or malformed');  
      }  
    } catch (error) {  
      console.error('Error generating sample scenario:', error);  
      setErrorMessage('Failed to generate sample scenario. Please try again.');  
    }  
  };  
  
  const startSimulation = async () => {  
    const selectedRole = role === 'custom' ? customRole : roles.find(r => r.value === role)?.title;  
    if (!selectedRole || !experienceLevel || !difficulty) {  
      setErrorMessage('Please select a role, experience level, and difficulty to start the simulation.');  
      return;  
    }  
    setErrorMessage(''); // Clear previous errors if any  
  
    try {  
      const scenarioData = useCustomScenario && customScenarioText  
        ? await fetchOpenAIResponse({ customScenario: customScenarioText }, '/api/openai/custom_initial')  
        : await fetchOpenAIResponse({  
            role: selectedRole,  
            experienceLevel: experienceLevels.find(level => level.value === experienceLevel).title,  
            difficulty: difficultyLevels.find(level => level.value === difficulty).title  
          }, '/api/openai/initial');  
  
      if (scenarioData && scenarioData.scenario) {  
        const titlePrefix = useCustomScenario ? "Custom Scenario: " : "";  
        scenarioData.scenario.title = `${titlePrefix}${scenarioData.scenario.title}`;  
        setScenario(scenarioData.scenario);  
        resetStateVariables();  
  
        const imagePrompt = `Illustrate the following scenario: “${scenarioData.scenario.description}”. The illustration should resemble colorful 1990s clip art with simple, clean lines and a focus on clarity. Use basic but colorful vector illustrations of the scenario, without any text. The colors should be vibrant but not overwhelming, ensuring that the images are easily understandable at a glance.`;  
        await generateImage(imagePrompt);  
      } else {  
        throw new Error('Failed to generate scenario');  
      }  
    } catch (error) {  
      console.error('Error starting simulation:', error);  
      setErrorMessage('Failed to start simulation. Please try again.');  
    }  
  };  
  
  const resetStateVariables = () => {  
    setCurrentQuestionIndex(0);  
    setProgress(0);  
    setTotalScore(0);  
    setAnswers([]);  
    setSimulationComplete(false);  
    setDebriefing(null);  
    setCustomAnswers({});  
  };  
  
  const handleAnswer = async (answerIndex, customAnswer = null) => {  
    if (customAnswer === null && customAnswers[currentQuestionIndex] === '') {  
      toggleCustomAnswer(currentQuestionIndex);  
      return;  
    }  
  
    const selectedOption = customAnswer || scenario.options[answerIndex].description;  
  
    try {  
      const result = await fetchOpenAIResponse({  
        role: role === 'custom' ? customRole : roles.find(r => r.value === role).title,  
        experienceLevel: experienceLevels.find(level => level.value === experienceLevel).title,  
        difficulty: difficultyLevels.find(level => level.value === difficulty).title,  
        scenario: scenario.description,  
        question: scenario.initial_question,  
        answer: selectedOption,  
        previousAnswers: answers  
      }, '/api/openai/followup');  
  
      if (result && result.next_question && result.score && result.score.feedback) {  
        const { next_question, score } = result;  
        updateStateWithAnswer(selectedOption, next_question, score);  
  
        const imagePrompt = `Illustrate the following updated scenario: "${next_question.scenario_description}".`;  
        await generateImage(imagePrompt);  
      } else {  
        console.error('Invalid response format:', result);  
        setErrorMessage('Failed to process answer. Please try again.');  
      }  
    } catch (error) {  
      console.error('Error handling answer:', error);  
      setErrorMessage('Failed to handle answer. Please try again.');  
    }  
  };  
  
  const updateStateWithAnswer = (selectedOption, nextQuestion, score) => {  
    setTotalScore(prevScore => prevScore + score.current_score);  
    setAnswers(prevAnswers => [...prevAnswers, {  
      question: scenario.initial_question,  
      answer: { description: selectedOption },  
      feedback: score.feedback,  
      score: score.current_score,  
    }]);  
    setScenario(prevScenario => ({  
      ...prevScenario,  
      description: nextQuestion.scenario_description,  
      options: nextQuestion.options,  
      initial_question: nextQuestion.question  
    }));  
    setCurrentQuestionIndex(currentQuestionIndex + 1);  
    setProgress(prevProgress => Math.min(prevProgress + 20, 100));  
  
    if (answers.length >= 4) {  
      setSimulationComplete(true);  
      generateDebriefing();  
    }  
  };  
  
  const generateDebriefing = async () => {  
    try {  
      const debriefingData = await fetchOpenAIResponse({  
        scenario: scenario.description,  
        answers: answers  
      }, '/api/openai/debriefing');  
  
      if (debriefingData && debriefingData.debriefing) {  
        setDebriefing(debriefingData.debriefing);  
      } else {  
        throw new Error('Failed to generate debriefing');  
      }  
    } catch (error) {  
      console.error('Error generating debriefing:', error);  
      setErrorMessage('Failed to generate debriefing. Please try again.');  
    }  
  };  
  
  const resetSimulation = () => {  
    setScenario(null);  
    resetStateVariables();  
    setImagePath(null);  
    setCustomScenarioText('');  
  };  
  
  const formatTextWithLineBreaks = (text) => {  
    if (!text) return null;  
    return text.split(/\.\s+/).map((sentence, index) => (  
      <p key={index} style={{ marginBottom: '1em' }}>  
        {sentence.trim()}  
      </p>  
    ));  
  };  
  
  const goToPreviousQuestion = () => {  
    if (currentQuestionIndex > 0) {  
      setCurrentQuestionIndex(currentQuestionIndex - 1);  
    } else if (simulationComplete) {  
      setSimulationComplete(false);  
      setCurrentQuestionIndex(answers.length - 1);  
    }  
  };  
  
  const goToNextQuestion = () => {  
    if (currentQuestionIndex < answers.length) {  
      setCurrentQuestionIndex(currentQuestionIndex + 1);  
    } else if (currentQuestionIndex === answers.length && !simulationComplete) {  
      setSimulationComplete(true);  
    }  
  };  
  
  const toggleCustomAnswer = (index) => {  
    setCustomAnswers(prev => {  
      const updated = { ...prev };  
      if (updated[index]) {  
        delete updated[index];  
      } else {  
        updated[index] = '';  
      }  
      return updated;  
    });  
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
          {scenario && (  
            <>  
              <div className="step-box">  
                <ChevronLeft  
                  onClick={goToPreviousQuestion}  
                  className={`nav-arrow ${currentQuestionIndex === 0 ? 'disabled' : ''}`}  
                  title="Previous Question"  
                />  
                <span>{simulationComplete && currentQuestionIndex >= answers.length ? "Summary" : `Question ${currentQuestionIndex + 1}`}</span>  
                <ChevronRight  
                  onClick={goToNextQuestion}  
                  className={`nav-arrow ${currentQuestionIndex >= answers.length && !simulationComplete ? 'disabled' : ''}`}  
                  title={simulationComplete ? "Summary" : "Next Question"}  
                />  
              </div>  
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
                    <p><strong>Role:</strong> {role === 'custom' ? customRole : roles.find(r => r.value === role).title}</p>  
                    <p><strong>Experience Level:</strong> {experienceLevels.find(level => level.value === experienceLevel).title}</p>  
                    <p><strong>Difficulty:</strong> {difficultyLevels.find(level => level.value === difficulty).title}</p>  
                  </div>  
                  {imagePath && <img src={imagePath} alt="Scenario Illustration" className="scenario-image" />}  
                  <Button onClick={resetSimulation} className="restart-button">Restart Simulation</Button>  
                </CardContent>  
              </Card>  
            </>  
          )}  
        </aside>  
  
        <section className="main-content">  
          {errorMessage && (  
            <div className="error-box">  
              <h4 className="error-title">  
                <Info className="icon" size={18} />  
                Error  
              </h4>  
              <p>{errorMessage}</p>  
            </div>  
          )}  
  
          {!simulationComplete ? (  
            scenario ? (  
              <Card className="scenario-card">  
                <CardHeader>  
                  <div className="scenario-title">  
                    <div className="chevron-marker"></div>  
                    <CardTitle>{scenario.title}</CardTitle>  
                  </div>  
                </CardHeader>  
                <CardContent>  
                  {currentQuestionIndex > 0 && currentQuestionIndex <= answers.length && (  
                    <div className="feedback-section">  
                      <p className="your-answer"><strong>Your Answer:</strong> {answers[currentQuestionIndex - 1]?.answer.description}</p>  
                      <div className="feedback">  
                        <h4 className="feedback-title">  
                          <Info className="icon" size={18} />  
                          Feedback  
                        </h4>  
                        <p>{answers[currentQuestionIndex - 1]?.feedback}</p>  
                      </div>  
                    </div>  
                  )}  
                  <div className="scenario-description">  
                    {formatTextWithLineBreaks(scenario.description)}  
                  </div>  
                  <h3 className="question-title">{formatTextWithLineBreaks(scenario.initial_question)}</h3>  
                  <div className="options-container">  
                    {scenario && scenario.options && scenario.options.map((option, index) => (  
                      <Button key={index} onClick={() => handleAnswer(index)} className="option-button">  
                        {option.description}  
                      </Button>  
                    ))}  
                    <div className="custom-answer-section">  
                      <div className="form-group">  
                        <label className="custom-answer-label">  
                          <input  
                            type="checkbox"  
                            checked={!!customAnswers[currentQuestionIndex]}  
                            onChange={() => toggleCustomAnswer(currentQuestionIndex)}  
                          />  
                          Submit Custom Answer  
                        </label>  
                      </div>  
                      {customAnswers[currentQuestionIndex] !== undefined && (  
                        <div className="form-group custom-answer-form">  
                          <textarea  
                            placeholder="Enter your custom answer here."  
                            value={customAnswers[currentQuestionIndex] || ''}  
                            onChange={(e) =>  
                              setCustomAnswers((prev) => ({  
                                ...prev,  
                                [currentQuestionIndex]: e.target.value,  
                              }))  
                            }  
                            rows="4"  
                            className="custom-answer-textarea"  
                          />  
                          <Button onClick={() => handleAnswer(null, customAnswers[currentQuestionIndex])}>  
                            Submit Custom Answer  
                          </Button>  
                        </div>  
                      )}  
                    </div>  
                  </div>  
                </CardContent>  
              </Card>  
            ) : (  
              <Card className="setup-card">  
                <CardHeader>  
                  <CardTitle className="header-title">Setup Your Simulation</CardTitle>  
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
                    {role === 'custom' && (  
                      <input  
                        type="text"  
                        className="custom-role-input"  
                        placeholder="Enter your custom role"  
                        value={customRole}  
                        onChange={(e) => setCustomRole(e.target.value)}  
                        disabled={scenario}  
                      />  
                    )}  
                  </div>  
                  <div className="form-group">  
                    <label>Select your experience level</label>  
                    <Select onValueChange={setExperienceLevel} value={experienceLevel} disabled={scenario}>  
                      <option value="">Choose experience level</option>  
                      {experienceLevels.map((level) => (  
                        <option key={level.value} value={level.value}>{level.title}</option>  
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
                    <>  
                      <div className="form-group">  
                        <textarea  
                          placeholder="Enter your custom scenario here or click Generate Sample Scenario for inspiration."  
                          value={customScenarioText}  
                          onChange={(e) => setCustomScenarioText(e.target.value)}  
                          rows="6"  
                          className="custom-scenario-textarea"  
                        />  
                      </div>  
                      <Button onClick={generateSampleScenario}>Generate Sample Scenario</Button>  
                    </>  
                  )}  
                  <div className="button-group">  
                    <Button onClick={startSimulation}>Start Simulation</Button>  
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
                <p><strong>Overall Score:</strong> {debriefing.overallScore}/100</p>  
                <p><strong>Letter Grade:</strong> {debriefing.letterGrade}</p>  
                <div className="stars-container">  
                  {[...Array(debriefing.stars || 0)].map((_, i) => (  
                    <Star key={i} className="star filled" />  
                  ))}  
                  {[...Array(5 - (debriefing.stars || 0))].map((_, i) => (  
                    <Star key={i} className="star" />  
                  ))}  
                </div>  
                <p><strong>Recommendations:</strong> {debriefing.advice}</p>  
                <div className="action-buttons">  
                  <Button onClick={() => setSimulationComplete(false)}>Try Different Choices</Button>  
                  <Button onClick={resetSimulation}>Run as Different Role</Button>  
                </div>  
              </div>  
            )  
          )}  
        </section>  
      </main>  
    </div>  
  );  
};  
  
export default ExecutiveTrainingSimulator;  