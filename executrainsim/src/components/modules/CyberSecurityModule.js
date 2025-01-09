import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Progress from '../ui/Progress';
import SevenSegmentDisplay from '../effects/SevenSegmentDisplay';
import { BarLoader, BeatLoader } from 'react-spinners';
import {
    AlertTriangle,
    CheckCircle,
    Info,
    Menu,
    Square,
    CheckSquare,
} from 'lucide-react';
import '../../styles/AppStyles.css';
import '../../styles/CybersecurityModule.css';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const parseAiJson = (apiResponse) => {
    if (!apiResponse) {
        throw new Error('No response data to parse.');
    }
    try {
        if (apiResponse.choices && apiResponse.choices[0]?.message?.content) {
            const raw = apiResponse.choices[0].message.content;
            const cleaned = raw.replace(/```json|```/g, '').trim();
            try {
                const parsed = JSON.parse(cleaned);
                return parsed;
            } catch (parseError) {
                console.error('Parse Error:', parseError);
                return { error: parseError }; //returns a safe response instead of failing
            }
        }
        return apiResponse;
    } catch (err) {
        console.error('Failed to parse AI JSON:', err, apiResponse);
        return { error: err };
    }
};


const CybersecurityModule = ({ onReturn }) => {
    // State variables
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
    const [isFetchingScenario, setIsFetchingScenario] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [notifications, setNotifications] = useState([]);
    const [responseOptions, setResponseOptions] = useState([]);
    const [simulationStarted, setSimulationStarted] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [systemStatus, setSystemStatus] = useState({
        networkHealth: 100,
        serverLoad: 0,
        intrusionAttempts: 0,
    });
    const [scenarioGenerated, setScenarioGenerated] = useState(false);
    const [logs, setLogs] = useState([]);
    const logsEndRef = useRef(null);
    const [isResponseLoading, setIsResponseLoading] = useState(false);
     const [showFeedback, setShowFeedback] = useState(false);
    const [radarData, setRadarData] = useState(null);


    // Define roles and difficulty levels
    const roles = [
        { value: 'security-analyst', title: 'Security Analyst' },
        { value: 'it-manager', title: 'IT Manager' },
        { value: 'ciso', title: 'CISO - Chief Information Security Officer' },
        { value: 'software-developer', title: 'Software Developer' },
        { value: 'network-administrator', title: 'Network Administrator' },
    ];
    const difficultyLevels = [
        { value: 'easy', title: 'Easy' },
        { value: 'medium', title: 'Medium' },
        { value: 'hard', title: 'Hard' },
        { value: 'expert', title: 'Expert' },
    ];

    // Utility function to scroll to bottom
    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        if (logs.length > 0) {
            scrollToBottom();
        }
    }, [logs]);
    // Effect for timer
    useEffect(() => {
        if (timeLeft <= 0) {
            setSimulationComplete(true);
        } else if (simulationStarted) {
            const timer = setInterval(() => {
                setTimeLeft((prevTime) => setTimeLeft(prev => prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, simulationStarted]);
    // Effect for difficulty based event triggers
    useEffect(() => {
        if (difficulty === 'expert' && simulationStarted) {
            const eventInterval = setInterval(() => {
                addNotification("New security incident detected!");
                setSystemStatus((prev) => ({
                    ...prev,
                    intrusionAttempts: prev.intrusionAttempts + 5,
                    networkHealth: Math.max(0, prev.networkHealth - 2),
                }));
            }, 60000);
            return () => clearInterval(eventInterval);
        }
    }, [difficulty, simulationStarted]);
    // Effect to trigger response option generation
    useEffect(() => {
        if (selectedAlert && simulationStarted) {
            generateResponseOptions(selectedAlert?.description);
        }
    }, [selectedAlert, simulationStarted]);
    // Function to add a log
    const addLog = (log) => {
        setLogs((prevLogs) => [...prevLogs, { message: log, timestamp: new Date() }]);
    };
    // Function to add a notification
    const addNotification = (message) => {
        setNotifications((prev) => [...prev, message]);
    };
    // Function to fetch from OpenAI API
    const fetchOpenAIResponse = async (input, endpointPath) => {
        setIsFetching(true);
        try {
            const endpoint = `${API_BASE_URL}${endpointPath}`;
            console.log('Requesting:', endpoint, 'with payload:', input);
            const response = await axios.post(endpoint, input, {
                headers: { 'Content-Type': 'application/json' },
            });
            console.log('Response received:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching from OpenAI:', error.message);
            setErrorMessage('Failed to communicate with the server. Please try again.');
            return null;
        } finally {
            setIsFetching(false);
        }
    };
    // Function to generate the scenario
    const generateScenario = async () => {
        setIsFetchingScenario(true);
        try {
            const selectedRoleTitle = roles.find((r) => r.value === role)?.title;
            const selectedDifficultyTitle = difficultyLevels.find((level) => level.value === difficulty)?.title;
            if (!selectedRoleTitle || !selectedDifficultyTitle) {
                setErrorMessage('Please select a role and difficulty.');
                return;
            }
            setErrorMessage('');
            const prompt = `
            Create a detailed cybersecurity simulation scenario for a ${selectedRoleTitle} at ${selectedDifficultyTitle} difficulty level.
            The scenario should include a title, a detailed context, specific objectives, a description of the starting state of the system, and a series of decision points to be resolved by the user.
            Each decision point should have:
                - an ID
                - a description of the security alert,
                - 3-5 options to choose from with a brief description of the intended action.
                 - expected results of each option.
              Provide a 'feedback' message that is to be delivered after a given user response is registered. This feedback should be concise and direct, and provide some guidance to the user on the efficacy of their response.
            Return the result in JSON format:
             {
                "scenario": {
                "title": "string",
                    "context": "string",
                    "objectives": ["string"],
                   "startingState": {
                        "networkHealth": number,
                         "serverLoad": number,
                       "intrusionAttempts": number
                     },
                  "decision_points": [
                    {
                      "id": number,
                       "description": "string",
                        "options": [
                             { "name": "string", "description": "string", "result": "string" }
                            ]
                     }
                   ],
                    "feedback": "string"
                 }
            }
         `;
            const rawScenarioData = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: prompt }] },
                '/api/generate',
            );
            const parsedScenario = parseAiJson(rawScenarioData);
            if (parsedScenario?.scenario) {
                setScenario(parsedScenario.scenario);
                setScenarioGenerated(true);
                setSystemStatus(parsedScenario.scenario.startingState);
            } else {
                setErrorMessage('Failed to generate scenario. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred while generating the scenario.');
        }
        setIsFetchingScenario(false);
    };
    // Function to start the simulation
    const startSimulation = async () => {
        if (!role || !difficulty) {
            setErrorMessage('Please select a role and difficulty.');
            return;
        }
        if (!scenario) {
            setErrorMessage('Please generate a scenario first.');
            return;
        }
        setSimulationStarted(true);
        setErrorMessage('');
        addLog(`Simulation started. Role: ${roles.find((r) => r.value === role).title}, Difficulty: ${difficultyLevels.find((level) => level.value === difficulty).title}`);
        try {
            if (scenario?.decision_points) {
                const initialAlerts = scenario.decision_points.map((dp) => ({
                    id: dp.id,
                    description: dp.description,
                    options: dp.options,
                }));
                setAlerts(initialAlerts);
            }
        } catch (error) {
            setErrorMessage('Failed to start the simulation. Please try again.');
        }
    };
    // Function to generate response options
    const generateResponseOptions = async (context) => {
        if (!role || !difficulty) {
            console.warn('Role or difficulty not set. Skipping response option generation.');
            return;
        }
        const prompt = `
            Based on the active simulation and the current alert: "${context}",
            generate 3 to 5 strategic response options that the user could employ.
            Each option should be concise and directly related to the current issue.
            Return the response in the JSON format:
            {
             "options": [{ "name": "string", "description": "string" }]
            }
     `;
        try {
            const rawResponse = await fetchOpenAIResponse({
                messages: [{ role: 'system', content: prompt }],
                temperature: 0.7,
                max_tokens: 400,
            }, '/api/generate');
            handleResponseOptions(rawResponse);
        } catch (error) {
            console.error('Failed to generate response options:', error);
            setErrorMessage('Failed to generate response options. Please try again.');
        }
    };
    // Function to handle response options
    const handleResponseOptions = (rawResponse) => {
        if (!rawResponse) {
            console.error('Received empty response from API.');
            setErrorMessage('Failed to generate response options. Please try again.');
            return;
        }
        const parsed = parseAiJson(rawResponse);
        if (parsed?.options) {
            console.log('Generated response options:', parsed.options);
            setResponseOptions(parsed.options);
        } else {
            console.error('Invalid response structure:', parsed);
            setErrorMessage('Failed to generate response options. Please try again.');
        }
    };
    // Function to handle resolution
    const handleResolution = async (actionIndex) => {
        if (!selectedAlert) return;
           setIsResponseLoading(true);
        setSystemStatus(prev => ({ ...prev, serverLoad: Math.min(100, prev.serverLoad + 15) }));
        const selectedOption = responseOptions[actionIndex] || null;
        const actionDescription = selectedOption ? selectedOption.description : 'No action selected';
        addLog(`User action: ${actionDescription}.`);

          const systemPrompt = `
            As a simulation engine, in the role of a cybersecurity system, respond to the user's action based on a previous threat: "${selectedAlert.description}".
            Evaluate the effectiveness of user's choice: "${actionDescription}" and adjust the simulation.
           Provide a follow up message that includes the next steps or challenges the user will face. Do not use conversational filler, and keep your message brief and to the point.
            Also ensure that you are using the system context already provided by the initial scenario prompt.
            Return the response in JSON format with the following structure:
           {
                "message": "string",
                 "feedback": "string",
                "updatedScenario": {
                      "title": "string",
                       "context": "string",
                       "objectives": ["string"],
                       "decision_points": [
                        {
                             "id": number,
                            "description": "string",
                            "options": [
                                { "option": "string", "result": "string" }
                                 ]
                            }
                        ],
                        "startingState": {
                         "networkHealth": number,
                        "serverLoad": number,
                          "intrusionAttempts": number
                     }
                    },
                    "nextAlert": {
                        "id": number,
                         "description": "string",
                            "options": [
                             { "option": "string", "result": "string" }
                            ]
                     }
               }
          `;
        try {
            const rawResponse = await fetchOpenAIResponse({
                messages: [
                    { role: 'system', content: systemPrompt },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }, '/api/generate');
            if (!rawResponse) {
                throw new Error('No response from AI server');
            }
             const parsed = parseAiJson(rawResponse);
           const systemMessage = parsed?.message;
             const systemFeedback = parsed?.feedback;
            const nextAlert = parsed?.nextAlert;
           const updatedScenario = parsed?.updatedScenario;

            if (!systemMessage || !updatedScenario) {
                throw new Error('System response is empty or invalid JSON.');
            }
             addLog(`System message: ${systemMessage}`);
           if (updatedScenario?.decision_points) {
                const nextAlerts = updatedScenario.decision_points.map((dp) => ({
                    id: dp.id,
                    description: dp.description,
                    options: dp.options,
                }));
                setAlerts(nextAlerts);
            } else {
                setAlerts([]);
            }
              addLog(`System feedback: ${systemFeedback}`);
             setSelectedAlert(nextAlert);
             setScenario(updatedScenario);
             setSystemStatus(updatedScenario.startingState);

            if (progress >= 100 || alerts.length === 0) {
                finalizeSimulation();
            } else {
                setProgress((prev) => prev + 20);
                setSystemStatus(prev => ({...prev, networkHealth: Math.max(0, prev.networkHealth - 5)}))
            }
        } catch (error) {
            console.error('Failed to generate simulation response:', error);
            setErrorMessage('Failed to generate simulation response. Please try again.');
        } finally{
            setIsResponseLoading(false);
        }
    };
    const assessSimulationOutcome = async () => {
        try {
             const userStrategyEffectiveness = logs.reduce((acc, log) => {
                 if(log.message.includes("User action")){
                      return acc + 1
                    } else {
                     return acc;
                   }
            }, 0)
           const totalMessages = logs.length;
           const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 100
            const outcome = effectivenessScore > 50 ? 'Win' : 'Lose';
            return {
                outcome: outcome,
                reason: outcome === 'Win' ? 'The user effectively addressed the threats.' : 'The user could have been more effective in managing the threats.',
            };
        }
        catch (error) {
            console.error('Failed to assess simulation outcome', error);
            return { outcome: 'draw', reason: 'Failed to assess the outcome. Try again.' };
        }
    };
       const analyzeSimulation = async () => {
        const analysisPrompt = `
        Analyze the following simulation transcript and provide an in-depth analysis, with a focus on the user's performance based on their responses to the challenges presented.
        Evaluate the user’s performance based on several key decision making tactics and provide a score on a scale of 1-10 for each tactic.
        For each tactic, provide 2-3 specific examples from the transcript to illustrate where the user demonstrated that tactic effectively or ineffectively.
       Provide an overall summary that describes the user’s strategy in the simulation, and specific examples of when they employed those strategies well, or not so well.
       Start your summary with a sentence directly addressing the user by name and role, before proceeding to the rest of your summary.
          Provide concise and actionable recommendations to improve the user’s performance in these areas, making the language encouraging.
            Return the result in JSON format with the following structure, ensuring that keys appear in Sentence Case, and recommendations are offered as a string array:
           {
               "Summary": "string",
               "Tactics": {
                 "Problem Solving": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                 "Decision Making": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                "Adaptability": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                   "Strategic Thinking": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                   "Technical Knowledge": { "score": number, "examples": ["string"], "recommendations": ["string"] }
                }
         }
          The simulation transcript:
             ${JSON.stringify(logs, null, 2)}
         `;
         try {
             const rawAnalysisResponse = await fetchOpenAIResponse({
                 messages: [{ role: 'system', content: analysisPrompt }],
            }, '/api/generate');
            const parsedAnalysis = parseAiJson(rawAnalysisResponse);
            if (parsedAnalysis) {
                const sentenceCaseKeys = (obj) => {
                    if (typeof obj !== 'object' || obj === null) {
                        return obj;
                    }
                    if(Array.isArray(obj)){
                        return obj.map(sentenceCaseKeys)
                    }
                    const newObj = {};
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            const newKey = key.charAt(0).toUpperCase() + key.slice(1);
                            newObj[newKey] = sentenceCaseKeys(obj[key]);
                        }
                    }
                    return newObj
                };
                const formattedAnalysis = sentenceCaseKeys(parsedAnalysis);
                 setDebriefing((prev) => ({
                   ...prev,
                    summary: formattedAnalysis.Summary,
                    tactics: formattedAnalysis.Tactics,
                 }));
                const radarData = Object.entries(formattedAnalysis.Tactics).map(([name, value]) => ({
                    skill: name,
                   score: value.score,
                }));
                setRadarData(radarData);
                return formattedAnalysis;
              } else {
                 setErrorMessage('Failed to analyze simulation. Please try again.');
                   return null;
               }
        } catch (error) {
           setErrorMessage('Failed to analyze simulation. Please try again.');
             console.error('Error analyzing simulation:', error);
            return null;
       }
    };
    // Function to finalize the simulation
    const finalizeSimulation = async () => {
        const outcomeData = await assessSimulationOutcome();
         const analysisData = await analyzeSimulation()
         const userStrategyEffectiveness = logs.reduce((acc, log) => {
            if(log.message.includes("User action")){
                 return acc + 1
               } else {
                   return acc
               }
         }, 0)
         const totalMessages = logs.length;
          const effectivenessScore = (userStrategyEffectiveness/totalMessages) * 100

         if(analysisData && outcomeData){
            const outcome = outcomeData.outcome;
           const outcomeReason = outcomeData.reason;
             setDebriefing((prev) => ({
                ...prev,
                strengths:  analysisData.Tactics ? Object.entries(analysisData.Tactics)
                  .filter(([, value]) => value.score > 7)
                  .map(([key]) => key) : ['None'],
                 areasForImprovement:  analysisData.Tactics ? Object.entries(analysisData.Tactics)
                   .filter(([, value]) => value.score < 6)
                  .map(([key]) => key) : ['None'],
                overallScore: Math.round(effectivenessScore),
                letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
                advice: outcome === 'Win' ? 'Continue refining your security strategies.' : 'Consider a different approach for improved results.',
                 transcript: logs,
                 outcome: outcome,
                 outcomeReason: outcomeReason,
                  summary: analysisData.Summary,
                 tactics: analysisData.Tactics
            }));
          }  else{
            setErrorMessage('Failed to generate a proper summary. Please try again.');
            setDebriefing(null);
        }
        setSimulationComplete(true);
    };
       const toggleFeedback = () => {
        setShowFeedback(prevShowFeedback => !prevShowFeedback);
     };
    // Function to reset the simulation
    const resetSimulation = () => {
        setScenario(null);
        setAlerts([]);
        setSelectedAlert(null);
        setProgress(0);
        setSimulationComplete(false);
        setDebriefing(null);
        setErrorMessage('');
        setTimeLeft(300);
        setNotifications([]);
        setResponseOptions([]);
        setSimulationStarted(false);
        setSystemStatus({ networkHealth: 100, serverLoad: 0, intrusionAttempts: 0 });
        setLogs([]);
        setScenarioGenerated(false);
         setRadarData(null);
         setShowFeedback(false)
    };
    // Function to reorder alerts
    const handleAlertReorder = (draggedIndex, droppedIndex) => {
        const reorderedAlerts = [...alerts];
        const [draggedAlert] = reorderedAlerts.splice(draggedIndex, 1);
        reorderedAlerts.splice(droppedIndex, 0, draggedAlert);
        setAlerts(reorderedAlerts);
    };
    // Return JSX for the UI
    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-box">
                    <span className="header-title">Cybersecurity Challenge</span>
                    <Menu className="hamburger-icon" onClick={() => setDropdownVisible(!dropdownVisible)} />
                    {dropdownVisible && (
                        <div className="dropdown-menu">
                            <div onClick={onReturn}>Return to Module Library</div>
                        </div>
                    )}
                </div>
            </header>
            <main className="content-grid">
                <aside className="left-column">
                    <Card className="details-card">
                        <CardContent>
                            {simulationStarted && scenario ? (
                                <div>
                                    <div className="scenario-info">
                                        <h3>{scenario.title}</h3>
                                        <div>
                                            {scenario.context.split('\n').map((line, i) => (
                                                <p key={i}>{line}</p>
                                            ))}
                                        </div>
                                        <div className="role-info">
                                            <strong>Role:</strong>
                                            {role === 'custom' ? 'Custom Role' : roles.find((r) => r.value === role).title}
                                            <br/>
                                              <strong>Difficulty:</strong> {difficultyLevels.find((level) => level.value === difficulty).title}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <img
                                        src="../images/CybersecurityModule.png"
                                        alt="Scenario Illustration"
                                        className="scenario-image"
                                    />
                                    {!scenario && (
                                        <div className="module-description">
                                            <h2>Cybersecurity Simulator</h2>
                                            <p>
                                                Welcome to the Cybersecurity Simulator, where you will
                                                engage in a strategic battle of wits against a dynamic
                                                simulation. Your objective is to make critical decisions to
                                                defend against threats and protect your organization.
                                            </p>
                                            <Button
                                                onClick={() => setShowInstructions(!showInstructions)}
                                            >
                                                {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                                            </Button>
                                            {showInstructions && (
                                                <div>
                                                    {metadata.instructions.split('\n').map((line, i) => (
                                                        <p key={i}>{line}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                          {simulationStarted && (
                                <Card className="system-status-card">
                                    <CardHeader>
                                        <CardTitle>System Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="status-indicators">
                                            <div className="indicator">
                                                <span>Time Left:</span>
                                                <SevenSegmentDisplay value={Math.floor(timeLeft / 60)} />
                                            </div>
                                            <div className="indicator">
                                                <span>Network Health:</span>
                                                <Progress value={systemStatus.networkHealth} max={100} />
                                            </div>
                                            <div className="indicator">
                                                <span>Server Load:</span>
                                                <Progress value={systemStatus.serverLoad} max={100} />
                                            </div>
                                            <div className="indicator">
                                                <span>Intrusions:</span>
                                                <span>{systemStatus.intrusionAttempts}</span>
                                            </div>
                                        </div>
                                       <div className="progress-info">
                                            <Progress value={progress} />
                                            <span className="progress-text">{progress}% Complete</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </aside>
                <section className="main-content">
                    <div className="main-content-flex">
                        {errorMessage && (
                            <div className="error-box">
                                <h4 className="error-title">Error</h4>
                                <p>{errorMessage}</p>
                            </div>
                        )}
                        {!simulationComplete ? (
                            scenario ? (
                                <div className="dashboard">
                                    <div className="dashboard-grid">
                                        <Card className="alerts-card">
                                            <CardHeader>
                                                <CardTitle>Active Alerts</CardTitle>
                                                 <div className="feedback-toggle-container">
                                                    <label className="feedback-checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={showFeedback}
                                                            onChange={toggleFeedback}
                                                        />
                                                        {showFeedback ?
                                                            <CheckSquare className="checkbox-icon-filled"/>
                                                            :
                                                            <Square className="checkbox-icon-empty"/>}
                                                       Show Feedback
                                                    </label>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {alerts.map((alert, index) => (
                                                    <div
                                                        key={alert.id}
                                                        onClick={() => setSelectedAlert(alert)}
                                                        className={`alert-item ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
                                                        draggable
                                                        onDragStart={(e) => e.dataTransfer.setData('index', index)}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            const draggedIndex = e.dataTransfer.getData('index');
                                                            handleAlertReorder(draggedIndex, index);
                                                        }}
                                                        onDragOver={(e) => e.preventDefault()}
                                                    >
                                                        <AlertTriangle className="icon" />
                                                        <span>{alert.description}</span>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                        <Card className="options-card">
                                            <CardHeader>
                                                <CardTitle>Response Options</CardTitle>
                                                <div className="spinner-container">
                                                 {isResponseLoading && <BeatLoader color="#0073e6" size={8} />}
                                             </div>
                                            </CardHeader>
                                            <CardContent>
                                                {selectedAlert && (
                                                    <div className="options-container">
                                                        {responseOptions && responseOptions.map((option, index) => (
                                                            <Button
                                                                key={index}
                                                                onClick={() => handleResolution(index)}
                                                                className="option-button"
                                                                disabled={isResponseLoading}
                                                            >
                                                                {option.name} - {option.description}
                                                            </Button>
                                                        ))}
                                                        { selectedAlert?.options && selectedAlert.options.length > 0 && showFeedback && (
                                                          <div className="feedback-box">
                                                            <h4 className="feedback-title">
                                                                  <Info className="icon" />
                                                                    Feedback
                                                              </h4>
                                                            {selectedAlert.options.map((option, index) => (
                                                                <p key={index}>{option.result}</p>
                                                            ))}
                                                          </div>
                                                    )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                   <Card className="logs-card">
                                        <CardHeader>
                                             <CardTitle>System Logs</CardTitle>
                                        </CardHeader>
                                       <CardContent  className="logs-container">
                                          <div className="logs-scroll" >
                                                {logs.map((log, index) => (
                                                  <div key={index} className="log-item">
                                                        <span className="log-message">{log.message}</span>
                                                        <span className="log-timestamp">
                                                           {log.timestamp.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                ))}
                                             <div ref={logsEndRef} />
                                          </div>
                                        </CardContent>
                                  </Card>
                                </div>
                            ) : (
                                <Card className="setup-card">
                                    <CardHeader>
                                         <CardTitle>Setup Your Simulation</CardTitle>
                                           <div className="spinner-container">
                                            {isFetchingScenario && <BarLoader color="#0073e6" width="100%" />}
                                            </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="form-group">
                                            <label>Select your role</label>
                                            <Select onValueChange={setRole} value={role} disabled={simulationStarted}>
                                                <option value="">Choose a role</option>
                                                {roles.map((r) => (
                                                    <option key={r.value} value={r.value}>{r.title}</option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div className="form-group">
                                            <label>Select difficulty level</label>
                                            <Select onValueChange={setDifficulty} value={difficulty} disabled={simulationStarted}>
                                                <option value="">Choose difficulty</option>
                                                {difficultyLevels.map((level) => (
                                                    <option key={level.value} value={level.value}>{level.title}</option>
                                                ))}
                                            </Select>
                                        </div>
                                        {!scenarioGenerated && (<Button onClick={generateScenario} disabled={isFetching}>
                                            {isFetching ? 'Generating...' : 'Generate Scenario'}
                                        </Button>)}
                                        {scenarioGenerated && (<Button onClick={startSimulation} disabled={isFetching}>
                                            {isFetching ? 'Starting...' : 'Start Simulation'}
                                        </Button>)}
                                    </CardContent>
                                </Card>
                            )
                        ) : (
                            debriefing && (
                                <div className="debriefing-section">
                                    <h4 className="debriefing-title">Simulation Debriefing</h4>
                                    {radarData && (
                                        <div style={{ width: '100%', height: 300 }}>
                                            <ResponsiveContainer>
                                                <RadarChart data={radarData}>
                                                    <PolarGrid />
                                                    <PolarAngleAxis dataKey="skill" />
                                                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                                    <Radar name="User" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                             <p style={{textAlign: 'center', fontSize: '0.8em', marginTop: '5px'}}>
                                              This graph illustrates your scores in several key decision making tactics. The higher the score, the better you demonstrated that tactic.
                                         </p>
                                        </div>
                                    )}
                                    <p>
                                        <strong>Summary:</strong>
                                         {debriefing.summary?.split('\n').map((line, i) => (
                                            <p key={i}>{line}</p>
                                        ))}
                                    </p>
                                     <p>
                                         <strong>Outcome:</strong> {debriefing.outcome}
                                         {debriefing.outcomeReason && (
                                             <>
                                               <br/><strong>Reason:</strong> {debriefing.outcomeReason}
                                           </>
                                          )}
                                    </p>
                                    <p>
                                        <strong>                                          Strengths:</strong>
                                        {debriefing.strengths && debriefing.strengths.length > 0 ? (
                                            <ul className="debriefing-list">
                                                {debriefing.strengths.map((strength, i) => (
                                                    <li key={i}>
                                                        {strength}
                                                         {debriefing.tactics && debriefing.tactics[strength]?.examples &&
                                                           <ul className="debriefing-examples">
                                                                {debriefing.tactics[strength].examples.map((ex, idx) => (
                                                                    <li key={idx}>
                                                                        {ex}
                                                                    </li>
                                                                ))}
                                                           </ul>
                                                         }
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : 'None'}
                                    </p>
                                    <p>
                                        <strong>Areas for Improvement:</strong>
                                        {debriefing.areasForImprovement && debriefing.areasForImprovement.length > 0 ? (
                                            <ul className="debriefing-list">
                                                {debriefing.areasForImprovement.map((area, i) => (
                                                    <li key={i}>
                                                        {area}
                                                        {debriefing.tactics && debriefing.tactics[area]?.examples &&
                                                            <ul className="debriefing-examples">
                                                                {debriefing.tactics[area].examples.map((ex, idx) => (
                                                                    <li key={idx}>
                                                                        {ex}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        }
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : 'None'}
                                    </p>
                                     <p>
                                        <strong>Overall Score:</strong> {debriefing.overallScore}
                                    </p>
                                    <p>
                                        <strong>Letter Grade:</strong> {debriefing.letterGrade}
                                    </p>
                                    <p>
                                        <strong>Recommendations:</strong> {debriefing.advice}
                                    </p>
                                     <Button onClick={() => setShowTranscript(!showTranscript)}>
                                          {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                                     </Button>
                                   {showTranscript && (
                                          <div className="transcript">
                                             <h5>Full Transcript:</h5>
                                            {debriefing.transcript.map((log, index) => (
                                                  <div key={index}>
                                                      <strong>Time:</strong> {log.timestamp.toLocaleTimeString()}
                                                     <br/>
                                                      <strong>Message:</strong> {log.message}
                                                  </div>
                                                ))}
                                        </div>
                                      )}
                                    <div className="action-buttons">
                                        <Button onClick={() => setSimulationComplete(false)}>
                                            Try Different Choices
                                        </Button>
                                        <Button onClick={resetSimulation}>
                                            Run as Different Role
                                        </Button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
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
// Metadata for the component
export const metadata = {
    title: 'Cybersecurity Challenge',
    description: 'Engage in a realistic cybersecurity incident simulation. Make critical decisions to defend against threats and protect your organization.',
    imageUrl: '../images/CybersecurityModule.png',
    instructions: `
         <h2>Gameplay Overview</h2>
          <p>Welcome to the Cybersecurity Simulator, where you will engage in a strategic battle of wits against a dynamic simulation. Your objective is to navigate the simulation and make critical decisions to defend against threats and protect your organization.</p>
          <h3>Simulation Mechanism</h3>
          <p>The simulation is driven by AI-generated scenarios, which become increasingly challenging based on your chosen difficulty level. Once you select a role and difficulty, you'll enter a dynamic scenario, where you will prioritize alerts and select appropriate responses from response options to manage the threat.</p>
          <p>The system will respond based on your actions, adapting its alerts and challenges. Your task is to anticipate their moves, counter their tactics, and steer the simulation towards the best outcome.</p>
         <h3>Outcome and Debriefing</h3>
         <p>At the conclusion of the simulation, you will receive a detailed debriefing. This includes a summary of the simulation, feedback on your strengths and areas for improvement, an overall score, and recommendations for future simulations. Use this feedback to refine your skills and prepare for real-world scenarios.</p>
    `,
    component: CybersecurityModule,
};
export default CybersecurityModule;