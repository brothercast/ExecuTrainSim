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
      const response = await axios.post(`http://localhost:5000${endpointPath}`, input, { headers: { 'Content-Type': 'application/json' } });      
      return response.data;      
    } catch (error) {      
      console.error('Error:', error);      
      throw new Error(error.response ? error.response.data : error.message);      
    }      
  };      
      
  const startSimulation = async () => {      
    const selectedRole = role === 'custom' ? customRole : roles.find(r => r.value === role).title;      
    if (!selectedRole || !experienceLevel || !difficulty) return;      
      
    try {      
      const scenarioData = await fetchOpenAIResponse({      
        role: selectedRole,      
        experienceLevel: experienceLevels.find(level => level.value === experienceLevel).title,      
        difficulty: difficultyLevels.find(level => level.value === difficulty).title      
      }, '/api/openai/initial');      
      
      if (scenarioData && scenarioData.scenario) {      
        setScenario(scenarioData.scenario);      
        setCurrentQuestionIndex(0);      
        setProgress(0);      
        setTotalScore(0);      
        setAnswers([]);      
        setSimulationComplete(false);      
        setDebriefing(null);      
      } else {      
        throw new Error('Failed to generate scenario');      
      }      
    } catch (error) {      
      console.error('Error starting simulation:', error);      
    }      
  };      
      
  const handleAnswer = async (answerIndex) => {      
    const selectedOption = scenario.options[answerIndex];      
      
    try {      
      const result = await fetchOpenAIResponse({      
        role: role === 'custom' ? customRole : roles.find(r => r.value === role).title,      
        experienceLevel: experienceLevels.find(level => level.value === experienceLevel).title,      
        difficulty: difficultyLevels.find(level => level.value === difficulty).title,      
        scenario: scenario.description,      
        question: scenario.initial_question,      
        answer: selectedOption.description,      
        previousAnswers: answers      
      }, '/api/openai/followup');      
      
      if (result && result.next_question && result.score && result.score.feedback) {      
        const { next_question, score } = result;      
        setTotalScore(prevScore => prevScore + score.current_score);      
        setAnswers([...answers, {      
          question: scenario.initial_question,      
          answer: selectedOption,      
          feedback: score.feedback,      
          score: score.current_score,      
        }]);      
      
        setScenario(prevScenario => ({      
          ...prevScenario,      
          description: next_question.scenario_description,      
          options: next_question.options,      
          initial_question: next_question.question      
        }));      
        setCurrentQuestionIndex(currentQuestionIndex + 1);      
        setProgress(prevProgress => Math.min(prevProgress + 20, 100));      
      
        if (answers.length >= 4) {      
          setSimulationComplete(true);      
          generateDebriefing();      
        }      
      } else {      
        console.error('Invalid response format:', result);      
      }      
    } catch (error) {      
      console.error('Error handling answer:', error);      
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
    }      
  };      
      
  const resetSimulation = () => {      
    setScenario(null);      
    setCurrentQuestionIndex(0);      
    setAnswers([]);      
    setProgress(0);      
    setTotalScore(0);      
    setSimulationComplete(false);      
    setDebriefing(null);      
  };      
      
  const formatTextWithLineBreaks = (text) => {      
    return text.split(/\.\s+/).map((sentence, index) => (      
      <span key={index}>      
        {sentence.trim()}.      
        <br />      
      </span>      
    ));      
  };      
      
  const goToPreviousQuestion = () => {      
    if (currentQuestionIndex > 0) {      
      setCurrentQuestionIndex(currentQuestionIndex - 1);      
    }      
  };      
      
  const goToNextQuestion = () => {      
    if (currentQuestionIndex < answers.length) {      
      setCurrentQuestionIndex(currentQuestionIndex + 1);      
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
                  <Button onClick={resetSimulation} className="restart-button">Restart Simulation</Button>      
                </CardContent>      
              </Card>      
            </>      
          )}      
        </aside>      
        
        <section className="main-content">      
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
                  {answers.length > 0 && currentQuestionIndex < answers.length && (      
                    <div className="feedback-section">      
                      <p><strong>You selected:</strong> {answers[currentQuestionIndex]?.answer.description}</p>      
                      <div className="feedback">      
                        <h4 className="feedback-title">      
                          <Info className="icon" size={18} />      
                          Feedback      
                        </h4>      
                        <p>{answers[currentQuestionIndex]?.feedback}</p>      
                      </div>      
                    </div>      
                  )}      
                  <p className="scenario-description">{formatTextWithLineBreaks(scenario.description)}</p>      
                  <h3 className="question-title">{formatTextWithLineBreaks(scenario.initial_question)}</h3>      
                  <div className="options-container">      
                    {scenario.options.map((option, index) => (      
                      <Button key={index} onClick={() => handleAnswer(index)} className="option-button">      
                        {option.description}      
                      </Button>      
                    ))}      
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
                  <Button onClick={startSimulation}>Start Simulation</Button>      
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
                  <Button onClick={startSimulation}>Try Different Choices</Button>      
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
