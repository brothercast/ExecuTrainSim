import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '../ui/Card';
import Button from '../ui/Button';
import Select, { SelectItem } from '../ui/Select';
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
    X,
    Edit,
    Save,
    RefreshCw,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import '../../styles/AppStyles.css';
import '../../styles/CybersecurityModule.css';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import DOMPurify from 'dompurify';

// Define API Base URL - Unified to API_BASE_URL - CORRECTED
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const parseAiJson = (apiResponse) => {
    if (!apiResponse) {
        console.error('parseAiJson: No response data to parse.');
        return null;
    }
    try {
        if (typeof apiResponse === 'string') {
            const cleaned = apiResponse.replace(/```json|```/g, '').trim();
            try {
                return JSON.parse(cleaned);
            } catch (parseError) {
                return apiResponse;
            }
        }
        return apiResponse;
    } catch (err) {
        console.error('Failed to parse AI JSON:', err, apiResponse);
        return null;
    }
};

const CybersecurityModule = ({ onReturn, onSelectModule, modules }) => {
    const [role, setRole] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [difficulty, setDifficulty] = useState('');
    const [scenario, setScenario] = useState(null);
    const [editableScenario, setEditableScenario] = useState(null);
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
    const [showInstructions, setShowInstructions] = useState(false); // State for instructions toggle
    const [systemStatus, setSystemStatus] = useState({
        networkHealth: 100,
        serverLoad: 0,
        intrusionAttempts: 0,
    });
    const [performanceScore, setPerformanceScore] = useState(0);
    const [performanceData, setPerformanceData] = useState([]);
    const [scenarioGenerated, setScenarioGenerated] = useState(false);
    const [logs, setLogs] = useState([]);
    const logsEndRef = useRef(null);
    const [isResponseLoading, setIsResponseLoading] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [radarData, setRadarData] = useState(null);
    const [isScenarioEditable, setIsScenarioEditable] = useState(false);
    const [isUserReplyLoading, setIsUserReplyLoading] = useState(false);
    const [activePhase, setActivePhase] = useState('setup');
    const [currentTurnIndex, setCurrentTurnIndex] = useState(1);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
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
            finalizeSimulation();
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
    const fetchOpenAIResponse = async (input, endpointPath, isUserAction = false) => {
        setIsFetching(true);
        if (isUserAction) {
            setIsUserReplyLoading(true)
        } else {
            setIsFetching(true);
        }
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
           if (error.response) {
                console.error('API Error Details:', error.response.data);
            }
            setErrorMessage('Failed to communicate with the server. Please check the console for details.');
            return null;
         } finally {
           if (isUserAction) {
                setIsUserReplyLoading(false);
          }
            setIsFetching(false);
        }
    };
     const handleScenarioEditToggle = () => {
       setIsScenarioEditable(!isScenarioEditable);
   };
    const handleCancelScenarioEdit = () => {
        setEditableScenario(scenario);
        setIsScenarioEditable(false);
    }
    const handleScenarioChange = (field, value) => {
         setEditableScenario(prev => ({
           ...prev,
           [field]: value
       }));
   };
    const handleSaveScenario = () => {
         setScenario(prev => ({
           ...prev,
            title: editableScenario.title,
            context: editableScenario.context,
       }));
        setIsScenarioEditable(false);
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
             The scenario should include a title, a detailed context, specific objectives, a description of the starting state of the system, and a series of interconnected decision points to be resolved by the user.
             Each decision point should have:
                - an ID
                - a description of the security alert,
                - 3-5 options to choose from with a brief description of the intended action.
                - expected results of each option.
                 - a "points" value that is awarded to the user on completion.
                 - a "consequences" response that includes specific values for networkHealth, serverLoad, and intrusionAttempts
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
                               { "name": "string", "description": "string", "result": "string", "consequences": {  "networkHealth": number, "serverLoad": number, "intrusionAttempts": number }, "points": number }
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
                 setEditableScenario(parsedScenario.scenario);
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
        setSystemStatus(scenario.startingState)
        addLog(`Simulation started. Role: ${roles.find((r) => r.value === role).title}, Difficulty: ${difficultyLevels.find((level) => level.value === difficulty).title}`);
        try {
            if (scenario?.decision_points && scenario.decision_points.length > 0) {
                const initialAlerts = [
                    {
                       id: scenario.decision_points[0].id,
                       description: scenario.decision_points[0].description,
                       options: scenario.decision_points[0].options,
                    }
                ];
               setAlerts(initialAlerts);
                setSelectedAlert(initialAlerts[0]);
            }
            else{
                setAlerts([])
           }
       }
        catch (error) {
           setErrorMessage('Failed to start the simulation. Please try again.');
        }
        setActivePhase('simulation')
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
        setIsButtonDisabled(true)
         setIsUserReplyLoading(true);
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
                               { "option": "string", "result": "string" , "consequences": {  "networkHealth": number, "serverLoad": number, "intrusionAttempts": number }, "points": number }
                                ]
                        }
                    ],
                    "feedback": "string"
                },
                 "nextAlert": {
                     "id": number,
                     "description": "string",
                      "options": [
                        { "option": "string", "result": "string"  }
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
                 setProgress((prev) => {
                     const newProgress = prev + 20;
                      updateProgress(newProgress, selectedOption.points)
                     return newProgress;
                 });
                 setSystemStatus(prev => ({
                      ...prev,
                     networkHealth: Math.max(0, prev.networkHealth + updatedScenario.startingState.networkHealth ),
                     serverLoad: Math.max(0, prev.serverLoad + updatedScenario.startingState.serverLoad),
                     intrusionAttempts: Math.max(0, prev.intrusionAttempts + updatedScenario.startingState.intrusionAttempts)
                  }))
            }
        } catch (error) {
            console.error('Failed to generate simulation response:', error);
            setErrorMessage('Failed to generate simulation response. Please try again.');
       } finally {
           setIsResponseLoading(false);
          setIsUserReplyLoading(false);
          setIsButtonDisabled(false)
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
          const effectivenessScore = (userStrategyEffectiveness/totalMessages) * 100
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
                     if (Array.isArray(obj)) {
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
            if (log.message.includes("User action")) {
                return acc + 1
             } else {
                 return acc;
              }
         }, 0)
        const totalMessages = logs.length;
         const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 100
       if (analysisData && outcomeData) {
           const outcome = outcomeData.outcome;
          const outcomeReason = outcomeData.reason;
            setDebriefing((prev) => ({
                ...prev,
               strengths: analysisData.Tactics ? Object.entries(analysisData.Tactics)
                  .filter(([, value]) => value.score > 7)
                    .map(([key]) => key) : ['None'],
                 areasForImprovement: analysisData.Tactics ? Object.entries(analysisData.Tactics)
                    .filter(([, value]) => value.score < 6)
                      .map(([key]) => key) : ['None'],
                 overallScore: Math.round(effectivenessScore),
               letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
               advice: outcome === 'Win' ? 'Continue refining your security strategies.' : 'Consider a different approach for improved results.',
               transcript: logs,
                 outcome: outcome,
              outcomeReason: outcomeReason,
                summary: analysisData.Summary,
                tactics: analysisData.Tactics,
             }));
        } else {
             setErrorMessage('Failed to generate a proper summary. Please try again.');
           setDebriefing(null);
        }
        setSimulationComplete(true);
        setActivePhase('debriefing');
   };
   const toggleFeedback = () => {
        setShowFeedback(prevShowFeedback => !prevShowFeedback);
    };
     // Function to reset the simulation
   const resetSimulation = () => {
        setScenario(null);
       setEditableScenario(null);
       setAlerts([]);
        setSelectedAlert(null);
        setProgress(0);
        setPerformanceScore(0)
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
       setShowFeedback(false);
       setIsScenarioEditable(false);
        setPerformanceData([])
       setActivePhase('setup');
       setCurrentTurnIndex(1)
    };
      // Function to reorder alerts
     const handleAlertReorder = (draggedIndex, droppedIndex) => {
         const reorderedAlerts = [...alerts];
       const [draggedAlert] = reorderedAlerts.splice(draggedIndex, 1);
        reorderedAlerts.splice(droppedIndex, 0, draggedAlert);
        setAlerts(reorderedAlerts);
    };

    const updateProgress = (newProgress, points = 0) => {
           setPerformanceScore((prev) => {
            const updatedValue = prev + points;
           return updatedValue
        });
          setPerformanceData((prevData) => [...prevData, { time: (300- timeLeft), score: performanceScore }])
    };
     const goToPreviousTurn = () => {
        if (currentTurnIndex > 1 && simulationComplete) {
            setCurrentTurnIndex(prevIndex => prevIndex - 1);
        }
    };
     const goToNextTurn = () => {
        const totalTurns = Math.ceil(logs.length / 2);
       if (currentTurnIndex < totalTurns && simulationComplete) {
            setCurrentTurnIndex(prevIndex => prevIndex + 1);
        }
   };
     const renderPhaseHeader = () => {
         switch (activePhase) {
             case 'setup':
                 return <span>Simulation Setup</span>;
             case 'simulation':
                 return <span>Simulation Active</span>;
            case 'debriefing':
                return <span>Simulation Debriefing</span>
            default:
                 return <span>Simulation Setup</span>;
       }
    };
     const renderMetricsLineChart = () => {
        if (!performanceData || performanceData.length === 0) {
           return <p>No metric data available yet.</p>;
        }
        return (
            <ResponsiveContainer width="100%" height={300}>
               <LineChart data={performanceData}>
                   <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: "Time Elapsed", position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Metrics', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                   <Legend />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
               </LineChart>
           </ResponsiveContainer>
       );
    };

     // Return JSX for the UI
     return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-box">
                    <span className="header-title">{metadata.title}</span>
                    <Menu className="hamburger-icon" onClick={() => setDropdownVisible(!dropdownVisible)} />
                    {dropdownVisible && (
                        <div className="dropdown-menu">
                            <div onClick={onReturn}>Return to Module Library</div>
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
                    {/* Left Column - Details Card - Modularized Rendering */}
                    <Card className="details-card">
                        <CardContent>
                            {renderLeftColumnCardContent()} {/* Modularized rendering function */}
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
                        {renderMainContent()}
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

    function renderLeftColumnCardContent() {
        return (
            <>
                {simulationStarted && scenario ? (
                    <div className="scenario-info">
                        <h3 className="left-column-scenario-title">
                            {scenario.title}
                        </h3>
                        <div className="module-description left-column-scenario-description">
                            <div dangerouslySetInnerHTML={{ __html: scenario.context }} />
                        </div>
                        <div className="module-info">
                            <strong>Role:</strong>
                            {role === 'custom' ? 'Custom Role' : roles.find((r) => r.value === role).title}
                            <br />
                            <strong>Difficulty:</strong> {difficultyLevels.find((level) => level.value === difficulty).title}
                        </div>
                    </div>
                ) : (
                    <>
                        <img
                            src={metadata.imageUrl}
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
                                    <div dangerouslySetInnerHTML={{ __html: metadata.instructions }} />
                                )}
                            </div>
                        )}
                    </>
                )}
                {simulationStarted && activePhase === 'simulation' && !showInstructions && (
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
            </>
        );
    }

    function renderMainContent() {
        if (simulationComplete) {
            return renderMainContentDebriefing();
        }

        if (scenario) {
            if (simulationStarted) {
                return renderMainContentSimulationActive();
            } else {
                return renderMainContentSetupCard();
            }
        } else {
            return renderMainContentCardSetup();
        }
    }


    function renderMainContentSimulationActive() {
        return (
            <div className="dashboard">
                <div className="dashboard-grid">
                    {/* Alerts Card */}
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
                                        <CheckSquare className="checkbox-icon-filled" />
                                        :
                                        <Square className="checkbox-icon-empty" />}
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
                    {/* Options Card */}
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
                                            className={`option-button ${isResponseLoading ? 'loading' : ''}`}
                                            disabled={isResponseLoading || isButtonDisabled}
                                        >
                                            {option.name} - {option.description}
                                        </Button>
                                    ))}
                                    {selectedAlert?.options && selectedAlert.options.length > 0 && showFeedback && (
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
                {/* Logs Card */}
                <Card className="logs-card">
                    <CardHeader>
                        <CardTitle>System Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="logs-container">
                        <div className="logs-scroll">
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
        );
    }

    function renderMainContentSetupCard() {
        return (
            <>
                <CardHeader>
                    <div className="scenario-title-container">
                        {isScenarioEditable ? (
                            <input
                                type="text"
                                value={editableScenario.title}
                                onChange={(e) => handleScenarioChange('title', e.target.value)}
                                className="editable-scenario-title"
                                style={{ fontFamily: 'Jura, sans-serif', fontSize: '2.5em', color: 'black', minWidth: '100%' }}
                            />
                        ) : (
                            <CardTitle>{scenario.title}</CardTitle>
                        )}
                        <div className="spinner-container">
                            {isFetching && (<BarLoader color="#0073e6" width="100%" />
                            )}
                        </div>

                        <div
                            className="scenario-description main-content-scenario-description"
                            style={{ position: 'relative' }}
                        >
                            {isScenarioEditable ? (
                                <textarea
                                    value={editableScenario.context}
                                    onChange={(e) => handleScenarioChange('context', e.target.value)}
                                    className="editable-scenario-context"
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                />
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: scenario.context }} />
                            )}
                        </div>
                        {scenarioGenerated && !isScenarioEditable && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '10px' }}>
                                <span onClick={handleScenarioEditToggle} className="edit-control-label"><Edit className="scenario-edit-icon" style={{ marginLeft: '5px' }} />
                                </span>
                            </div>
                        )}
                        {isScenarioEditable && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '10px', marginBottom: '10px', whiteSpace: 'nowrap' }}>
                                <span style={{ whiteSpace: 'nowrap' }} onClick={handleSaveScenario} className='edit-control-label'>
                                    <Save style={{ marginLeft: '5px' }} />
                                </span>
                                <span style={{ whiteSpace: 'nowrap' }} onClick={handleCancelScenarioEdit} className='edit-control-label'>
                                    <X style={{ marginLeft: '5px' }} />
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div>
                        <div className="form-group">
                            <label>Select your role</label>
                            <Select onValueChange={setRole} value={role} disabled={simulationStarted}>
                                <SelectItem value="">Choose a role</SelectItem>
                                {roles.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>{r.title}</SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div className="form-group">
                            <label>Select difficulty level</label>
                            <Select onValueChange={setDifficulty} value={difficulty} disabled={simulationStarted}>
                                <SelectItem value="">Choose difficulty</SelectItem>
                                {difficultyLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>{level.title}</SelectItem>
                                ))}
                            </Select>
                        </div>
                        {scenarioGenerated && (<Button onClick={startSimulation} disabled={isFetching}>
                            {isFetching ? 'Starting...' : 'Start Simulation'}
                        </Button>)}
                    </div>
                </CardContent>
            </>
        );
    }
    function renderMainContentCardSetup() {
        return (
            <Card className="setup-card">
                <CardHeader>
                    <CardTitle className="header-title">Setup Your Simulation</CardTitle>
                    <div className="spinner-container">
                        {isFetchingScenario && <BarLoader color="#0073e6" width="100%" />}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="form-group">
                        <label>Select your role</label>
                        <Select onValueChange={setRole} value={role} disabled={simulationStarted}>
                            <SelectItem value="">Choose a role</SelectItem>
                            {roles.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.title}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    <div className="form-group">
                        <label>Select difficulty level</label>
                        <Select onValueChange={setDifficulty} value={difficulty} disabled={simulationStarted}>
                            <SelectItem value="">Choose difficulty</SelectItem>
                            {difficultyLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>{level.title}</SelectItem>
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
        );
    }

    function renderMainContentDebriefing() {
        return (
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
                        <p style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '5px' }}>
                            This graph illustrates your scores in several key decision making tactics. The higher the score, the better you demonstrated that tactic.
                        </p>
                    </div>
                )}
                {performanceData.length > 0 && (
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                        <p style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '5px' }}>This graph shows how your overall score changed over time.</p>
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
                            <br /><strong>Reason:</strong> {debriefing.outcomeReason}
                        </>
                    )}
                </p>
                <p>
                    <strong>Strengths:</strong>
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
                    <strong>Recommendations:</strong> {debriefing.advice}</p>
                <div className="action-buttons">
                    <Button onClick={() => setSimulationComplete(false)}>
                        Try Different Choices
                    </Button>
                    <Button onClick={resetSimulation}>
                        Run as Different Role
                    </Button>
                </div>
            </div>
        );
    }
};
 // Metadata for the component
 export const metadata = {
    title: 'Cybersecurity Challenge',
     description: 'Engage in a realistic cybersecurity incident response simulation. Make critical decisions to defend against threats and protect your organization.',
    imageUrl: '../images/CybersecurityModule.png',
   instructions: `
         <h2>Gameplay Overview</h2>
            <p>Welcome to the Cybersecurity Challenge module. Here, you will step into the role of a cybersecurity professional and navigate a dynamic incident response simulation. Your objective is to effectively manage and mitigate cybersecurity threats to protect your organization's digital assets.</p>
          <h3>Simulation Mechanism</h3>
             <p>The simulation presents you with a series of cybersecurity incidents, each requiring strategic decision-making. As threats emerge, you'll need to:</p>
             <ol>
                <li><strong>Prioritize Alerts:</strong> Review active security alerts and prioritize them based on severity and potential impact.</li>
                <li><strong>Select Responses:</strong> Choose appropriate response options from a range of strategic actions to counter each threat.</li>
                <li><strong>Manage System Status:</strong> Monitor key system metrics such as network health, server load, and intrusion attempts, which are dynamically affected by your decisions and the unfolding scenario.</li>
                <li><strong>Analyze Logs:</strong> Utilize system logs to gain deeper insights into the nature of the threats and the effectiveness of your responses.</li>
            </ol>
          <p>The AI-driven simulation engine adapts to your actions, creating a dynamic and challenging experience that tests your cybersecurity knowledge and decision-making skills under pressure.</p>
           <h3>Key Skills Assessed</h3>
             <ul>
                <li><strong>Threat Prioritization:</strong> Evaluate and prioritize security alerts to focus on the most critical issues.</li>
                <li><strong>Incident Response:</strong> Select and implement effective response strategies to mitigate cyber threats.</li>
                <li><strong>Resource Management:</strong> Manage system resources and balance security measures with operational impact.</li>
                 <li><strong>Strategic Decision-Making:</strong> Make informed decisions under pressure, considering both immediate and long-term consequences.</li>
                 <li><strong>Adaptability and Learning:</strong> Adjust your strategies based on the evolving nature of threats and feedback from the simulation.</li>
             </ul>
           <h3>Outcome and Debriefing</h3>
             <p>Upon completing the simulation, you will receive a comprehensive debriefing that includes:</p>
             <ul>
                <li><strong>Performance Summary:</strong> An overview of your performance in handling the cybersecurity incidents.</li>
                <li><strong>Strengths and Areas for Improvement:</strong> Identification of your key strengths in cybersecurity decision-making and areas where you can enhance your skills.</li>
                <li><strong>Tactical Scorecard:</strong> Scores and feedback on key decision-making tactics, with examples from your simulation transcript.</li>
                <li><strong>Overall Performance Score and Grade:</strong> A quantitative score and letter grade reflecting your overall effectiveness in the simulation.</li>
                <li><strong>Personalized Advice:</strong> Actionable recommendations and advice to further develop your cybersecurity expertise.</li>
                <li><strong>Full Simulation Transcript:</strong> A detailed transcript of all system logs and your actions during the simulation for in-depth review.</li>
             </ul>
           <p>The Cybersecurity Challenge module provides a realistic and engaging platform to sharpen your cybersecurity skills, enhance your strategic thinking, and prepare you to effectively lead incident response efforts in real-world scenarios.</p>
   `,
     component: CybersecurityModule,
 };
 export default CybersecurityModule;