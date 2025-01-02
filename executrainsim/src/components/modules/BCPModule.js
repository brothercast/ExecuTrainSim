import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Select, { SelectItem } from '../ui/Select';
import { Info, Star, ChevronLeft, ChevronRight, Menu, RefreshCw } from 'lucide-react';
import { BarLoader, GridLoader, BeatLoader } from 'react-spinners';
import '../../styles/AppStyles.css';
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
import SevenSegmentDisplay from '../effects/SevenSegmentDisplay';
import ActionCard from '../ui/ActionCard'; // Import the new ActionCard component

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const IMAGE_API_URL = process.env.REACT_APP_IMAGE_API_URL || 'http://localhost:5001';

const disasterTypes = [
    { value: 'natural', title: 'Natural Disaster' },
    { value: 'technological', title: 'Technological Failure' },
    { value: 'human', title: 'Human-Caused Event' },
    { value: 'supply', title: 'Supply Chain Disruption' },
    { value: 'economic', title: 'Economic Crisis' },
    { value: 'health', title: 'Health Emergency' }
];

const disasterSubTypes = {
    natural: [
        'Earthquake',
        'Hurricane',
        'Tornado',
        'Wildfire',
        'Flood',
        'Blizzard',
        'Pandemic'
    ],
    technological: [
        'Cyberattack',
        'System Failure',
        'Data Breach',
        'Hardware Failure',
        'Software Malfunction',
        'Power Outage',
        'Network Failure'
    ],
    human: [
        'Terrorist Attack',
        'Civil Unrest',
        'Workplace Violence',
        'Accidental Spill',
        'Sabotage',
        'Employee Strike'
    ],
    supply: [
        'Supplier Bankruptcy',
        'Logistical Failure',
        'Transportation Strike',
        'Inventory Loss',
        'Raw Material Shortage'
    ],
    economic: [
        'Market Crash',
        'Currency Devaluation',
        'Trade Embargo',
        'Inflation Spike',
        'Recession',
        'Regulatory Change'
    ],
    health: [
        'Disease Outbreak',
        'Food Contamination',
        'Mass Casualty',
        'Chemical Exposure',
        'Biological Threat'
    ]
};

let lastTimestamp = new Date();
const generateSequentialTimestamp = () => {
    const newTimestamp = new Date(lastTimestamp.getTime() + 5 * 60 * 1000);
    lastTimestamp = newTimestamp;
    const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
    return newTimestamp.toLocaleTimeString('en-US', options);
};

const parseAiJson = (apiResponse) => {
    if (!apiResponse) {
        throw new Error('No response data to parse.');
    }

    try {
        if (apiResponse.choices && apiResponse.choices[0]?.message?.content) {
            const raw = apiResponse.choices[0].message.content;
            const cleaned = raw.replace(/```json|```/g, '').trim();
            return JSON.parse(cleaned);
        }
        return apiResponse;
    } catch (err) {
        console.error('Failed to parse AI JSON:', err, apiResponse);
        return {};
    }
};

const BCPModule = ({ onReturn }) => {
    const [disasterType, setDisasterType] = useState('');
    const [disasterSubType, setDisasterSubType] = useState('');
    const [bcpScenario, setBcpScenario] = useState(null);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [chatHistory, setChatHistory] = useState([]); //Keeping the chat history, but not using for main gameplay
    const [userDraft, setUserDraft] = useState('');
    const [progress, setProgress] = useState(0);
    const [simulationComplete, setSimulationComplete] = useState(false);
    const [debriefing, setDebriefing] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFetchingOpponent, setIsFetchingOpponent] = useState(false);
    const [isFetchingUser, setIsFetchingUser] = useState(false);
    const [images, setImages] = useState({});
    const [actionCards, setActionCards] = useState([]); // State for the action cards
    const [simulationStarted, setSimulationStarted] = useState(false);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(1);
    const [isFetchingScenario, setIsFetchingScenario] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isUserTurn, setIsUserTurn] = useState(true);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [imageStatus, setImageStatus] = useState('idle');
    const [isUserReplyLoading, setIsUserReplyLoading] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isResponseLoading, setIsResponseLoading] = useState(false);
    const [radarData, setRadarData] = useState(null);
    const [scenarioGenerated, setScenarioGenerated] = useState(false);
    const [activePhase, setActivePhase] = useState('setup');
     const [phaseObjectives, setPhaseObjectives] = useState(null);
    const [metrics, setMetrics] = useState({
        financialLoss: 0,
        downtime: 0,
        employeeMorale: 100,
        taskCompletion: 0,
        timeElapsed: 0,
    });
    const [metricHistory, setMetricHistory] = useState([]); // Track history of metrics
    const [timeElapsed, setTimeElapsed] = useState(0)

    const MAX_TOTAL_TOKENS = 4096;
    const MIN_RESPONSE_TOKENS = 150;

     const selectedRoleObject = bcpScenario?.roles?.find((role) => role.name === selectedRole);
    const timerRef = useRef(null);


    useEffect(() => {
        if (simulationStarted) {
            timerRef.current = setInterval(() => {
                setTimeElapsed((prevTime) => prevTime + 1);
                setMetrics((prevMetrics) => {
                      return {
                           ...prevMetrics,
                            timeElapsed: prevMetrics.timeElapsed + 1,
                        };
                   });

                }, 1000); // Update metrics every second
           return () => clearInterval(timerRef.current);
        }
    }, [simulationStarted]);

    useEffect(() => {
    if (simulationStarted) {
        setMetricHistory((prevHistory) => [...prevHistory, { ...metrics, time: timeElapsed }]);
    }
    }, [timeElapsed])

    const updateMetrics = (changes) => {
          setMetrics(prevMetrics => {
              const updatedMetrics = { ...prevMetrics, ...changes };
              return updatedMetrics;
            });
    };


     const fetchOpenAIResponse = async (input, endpointPath, isUserAction = false) => {
        setIsFetching(true);
        if (isUserAction) {
            setIsUserReplyLoading(true);
        } else {
            setIsFetchingOpponent(true);
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
            setErrorMessage('Failed to communicate with the server. Please try again.');
            return null;
        } finally {
            if (isUserAction) {
                setIsUserReplyLoading(false);
            } else {
                setIsFetchingOpponent(false);
            }
            setIsFetching(false);
        }
    };

    const generateBcpScenario = async () => {
        try {
            const selectedType = disasterTypes.find((type) => type.value === disasterType)?.title;
            const selectedSubType = disasterSubTypes[disasterType]?.find(
                (subType) => subType === disasterSubType
            );

            if (!selectedType) {
                setErrorMessage('Please select a disaster type.');
                return;
            }

            setErrorMessage('');

            const prompt = `
              Create a detailed Business Continuity Plan (BCP) scenario for a ${selectedType} event${selectedSubType ? ` with a focus on ${selectedSubType}` : ''} for a medium-sized tech company.
               Include the following key elements:
                 - Detailed Description of the Event: Describe what happened, its immediate impact, and potential cascading effects on the business.
                 - Multiple Roles: Create 2-3 distinct roles within the organization (e.g., Incident Commander, Department Lead, Communications Lead) with clear responsibilities and differing perspectives on the situation.
                - Initial Objectives:  Describe the primary objectives for each role in the immediate aftermath of the event.
                - Challenges: What are the initial challenges that each role would face given the circumstances and the scope of impact.
                 - Action Cards: Generate 4-6 action cards that represent different types of recovery tasks/decisions the user can employ. Provide descriptions of each card, their resource cost, and the expected outcome when utilized.
                - Recovery Steps: Provide 4-5 recommended steps that would be typical during a BCP execution of this kind.
                - Phase Objectives: Clearly define objectives for each of the 3 BCP phases: immediate response, business recovery, and review/improvement
                - Initial Metrics: Assign initial values to the following metrics: financialLoss, downtime, employeeMorale, taskCompletion, timeElapsed

               Generate the scenario in JSON with the format:
                {
                    "scenario": {
                        "title": "string",
                        "context": "string",
                        "roles": [
                            { "name": "string", "role": "string", "objective": "string", "initialChallenges": ["string"] }
                        ],
                        "actionCards": [
                           { "name": "string", "description": "string", "resourceCost": number,  "expectedOutcome": "string" }
                        ],
                         "recoverySteps": ["string"],
                        "phaseObjectives": {
                             "immediateResponse": ["string"],
                            "businessRecovery": ["string"],
                            "reviewImprovement": ["string"]
                          },
                      "initialMetrics": {
                                "financialLoss": number,
                               "downtime": number,
                               "employeeMorale": number,
                               "taskCompletion": number,
                                "timeElapsed": number
                                 }
                    }
                }
            `;

            const rawScenarioData = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: prompt }] },
                '/api/generate'
            );

            const parsedScenario = parseAiJson(rawScenarioData);

            if (parsedScenario?.scenario) {
                 setBcpScenario(parsedScenario.scenario);
                 setRoles(parsedScenario.scenario.roles.map((r) => r.name));
                setActionCards(parsedScenario.scenario.actionCards);
                 setSimulationComplete(false);
                 setScenarioGenerated(true);
                 setPhaseObjectives(parsedScenario.scenario.phaseObjectives);
                 setMetrics(parsedScenario.scenario.initialMetrics);
                await generateImage(parsedScenario.scenario.title, parsedScenario.scenario.context);
            } else {
                setErrorMessage('Failed to generate scenario. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred while generating the scenario.');
        }
    };

     const generateImage = async (title, context) => {
         setImageStatus('loading');
        const prompt = `Illustrate the BCP scenario titled "${title}" with context: "${context}". The illustration should resemble colorful, writing-free, diverse universal stock art from the 1990s with simple, clean lines and a focus on clarity.`;

        try {
            const endpoint = `${IMAGE_API_URL}/api/dalle/image`;
            const response = await axios.post(endpoint, { prompt });
            setImages((prevImages) => ({ ...prevImages, [0]: response.data.imagePath }));
            setImageStatus('success');
        } catch (error) {
             console.error('Error generating image:', error.message);
            setErrorMessage(
                <span>
                    Failed to generate image. Please try again.
                    <RefreshCw className="reload-icon" onClick={() => retryImageGeneration(title, context)} />
                </span>
            );
            setImageStatus('failed');
        }
    };


    const retryImageGeneration = (title, context) => {
       setErrorMessage('');
      generateImage(title, context);
    };


    const startSimulation = async () => {
         if (!selectedRole) {
            setErrorMessage('Please select a role.');
             return;
        }
        setSimulationStarted(true);
        setActivePhase('response');
        setErrorMessage('');
    };

    const updateRoles = (newRole, index) => {
         const newRoles = [...roles];
         newRoles[index] = newRole;
         setRoles(newRoles);

         if (bcpScenario) {
            bcpScenario.roles[index].name = newRole;
        }
    };

   const handleActionCardClick = async (card) => {
        setIsFetching(true);
    try {
       const prompt = `
           As ${selectedRoleObject.name}, in the role of "${selectedRoleObject.role}", evaluate the effectiveness of the "${card.name}" action card and update the relevant business metrics based on its impact. Provide a detailed analysis of how this card has impacted the scenario.
           The current situation is ${bcpScenario.context}
           Return the result in JSON format:
            {
              "metricsChanges": {
                 "financialLoss": number,
                 "downtime": number,
                 "employeeMorale": number,
                 "taskCompletion": number,
              },
            "analysis": "string"
         }
         `;

           const rawResponse = await fetchOpenAIResponse({
               messages: [{ role: 'system', content: prompt }],
            }, '/api/generate', true);

          const parsed = parseAiJson(rawResponse);
             if (parsed?.metricsChanges) {
             updateMetrics(parsed.metricsChanges);
             addMessageToHistory(`Used ${card.name} action card. ${parsed.analysis}`, 'user')
             }
     } catch (error) {
            setErrorMessage(`Failed to apply action card. Please try again. Error: ${error.message}`);
        } finally {
          setIsFetching(false);
        }
 };

      const addMessageToHistory = (content, role) => {
        if (!content || typeof content !== 'string') {
            console.error('Invalid message content:', content);
            return;
         }
        const roleName =
            role === 'user'
               ? selectedRole
                : bcpScenario?.roles.find((r) => r.name !== selectedRole)?.name || 'Support';

       setChatHistory((prevHistory) => [
            ...prevHistory,
            { content, role, name: roleName, timestamp: generateSequentialTimestamp() },
        ]);
    };

  const analyzeSimulation = async () => {
    const analysisPrompt = `
    Analyze the following BCP simulation metrics and provide an in-depth analysis, with a focus on the user's performance based on BCP and recovery tactics.
       Evaluate the user’s performance based on several key BCP and recovery tactics and provide a score on a scale of 1-10 for each tactic.
    Provide an overall summary that describes the user’s strategy in the simulation, and specific examples of when they employed those strategies well, or not so well.
       Be sure to note specific instances in the dialogue to back up your findings.
    Return the result in JSON format with the following structure:
        {
        "summary": "string",
            "tactics": {
            "Prioritization": number,
            "Problem Solving": number,
           "Resource Allocation": number,
             "Communication": number,
               "Decision Making": number,
               "Adaptability": number
        }
    }
   The simulation transcript:
   ${JSON.stringify(metricHistory, null, 2)}
     `;
        try {
            const rawAnalysisResponse = await fetchOpenAIResponse({
                messages: [{ role: 'system', content: analysisPrompt }],
           }, '/api/generate');

            const parsedAnalysis = parseAiJson(rawAnalysisResponse);

            if (parsedAnalysis) {
                 console.log('Parsed Analysis:', parsedAnalysis)
                 setDebriefing((prev) => ({
                        ...prev,
                    summary: parsedAnalysis.summary,
                  }));

               const radarData = Object.entries(parsedAnalysis.tactics).map(([name, score]) => ({
                        skill: name,
                    score: score
                }));
              setRadarData(radarData)
            } else {
                 setErrorMessage('Failed to analyze simulation. Please try again.');
            }

       } catch (error) {
           setErrorMessage('Failed to analyze simulation. Please try again.');
           console.error('Error analyzing negotiation:', error);
            return null;
        }
    };

    const finalizeSimulation = async () => {
      await analyzeSimulation()

        const userStrategyEffectiveness = metricHistory.reduce((acc, metrics) => {
          return acc + metrics.taskCompletion;
       }, 0);

     const totalMessages = actionCards.length;
        const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 100;
      let outcome = 'Partial Success';

        if (effectivenessScore > 70) {
           outcome = 'Full Success';
        } else if (effectivenessScore < 30) {
           outcome = 'Failure';
        }
        setDebriefing((prev) => ({
           ...prev,
          strengths: userStrategyEffectiveness > 0 ? ['Prioritization', 'Communication'] : ['Quick Adaptation'],
           areasForImprovement: ['Clarity', 'Conciseness'],
            overallScore: Math.round(effectivenessScore),
            letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
            advice: outcome === 'Full Success' ? 'Continue refining your strategies' : 'Consider revising your approach for better results.',
           transcript: chatHistory,
             outcome: outcome,
             metricsHistory: metricHistory
       }));
        setSimulationComplete(true);
      clearInterval(timerRef.current); // Clear the timer
    };

  const resetSimulation = () => {
      setBcpScenario(null);
        setRoles([]);
        setSelectedRole('');
        setChatHistory([]);
       setUserDraft('');
       setProgress(0);
       setSimulationComplete(false);
        setDebriefing(null);
      setErrorMessage('');
        setImages({});
         setActionCards([]);
        setSimulationStarted(false);
        setScenarioGenerated(false);
       setActivePhase('setup');
        setMetrics({
            financialLoss: 0,
            downtime: 0,
            employeeMorale: 100,
            taskCompletion: 0,
            timeElapsed: 0,
        });
        setMetricHistory([]);
        setTimeElapsed(0);
        clearInterval(timerRef.current);
    setRadarData(null)
    };

    const goToPreviousTurn = () => {
    // Logic to handle previous turn if required
    };

  const goToNextTurn = () => {
    // Logic to handle next turn if required
   };

   const renderPhaseHeader = () => {
        switch (activePhase) {
           case 'setup':
                return <span>Simulation Setup</span>;
            case 'response':
               return <span>Immediate Response</span>;
             case 'recovery':
              return <span>Business Recovery</span>;
            case 'review':
               return <span>Review and Improvement</span>;
             default:
               return <span>Simulation Setup</span>;
         }
    };

    const renderMetricsLineChart = () => {
       if (!metricHistory || metricHistory.length === 0) {
           return <p>No metric data available yet.</p>;
        }
        return (
            <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={metricHistory}>
                   <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: "Time Elapsed", position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Metrics', angle: -90, position: 'insideLeft' }} />
                   <Tooltip />
                   <Legend />
                   <Line type="monotone" dataKey="financialLoss" stroke="#8884d8" name="Financial Loss" />
                    <Line type="monotone" dataKey="downtime" stroke="#82ca9d" name="Downtime" />
                  <Line type="monotone" dataKey="employeeMorale" stroke="#ffc658" name="Employee Morale" />
                   <Line type="monotone" dataKey="taskCompletion" stroke="#ff7300" name="Task Completion" />
                </LineChart>
           </ResponsiveContainer>
       );
   };

    return (
        <div className="app-container">
           <header className="app-header">
                <div className="header-box">
                    <span className="header-title">BCP Simulation</span>
               </div>
            </header>
           <main className="content-grid">
              <aside className="left-column">
                     {bcpScenario && (
                        <div className="step-box">
                         <ChevronLeft
                           onClick={goToPreviousTurn}
                           className={`nav-arrow ${
                            currentTurnIndex <= 1 && simulationComplete ? 'disabled' : ''
                           }`}
                            title="Previous Turn"
                         />
                         <span className="step-text">
                            {simulationStarted ? (
                                  simulationComplete ?
                                        (
                                           <span>Simulation Complete</span>
                                        ) : (
                                             renderPhaseHeader()
                                         )
                                     ) : (
                                         <span>Simulation Setup</span>
                                    )}
                          </span>
                        <ChevronRight
                          onClick={goToNextTurn}
                            className={`nav-arrow ${
                              simulationComplete &&
                                   currentTurnIndex >= actionCards.length
                                   ? 'disabled'
                                    : ''
                                 }`}
                                title="Next Turn"
                             />
                         </div>
                    )}
                 <Card className="details-card">
                  <CardContent>
                        {simulationStarted && bcpScenario ? (
                            <div>
                                <div className="scenario-info">
                                   <h3>{bcpScenario.title}</h3>
                                      <div>
                                           {bcpScenario.context.split('\n').map((line, i) => (
                                             <p key={i}>{line}</p>
                                         ))}
                                       </div>
                                   <div className="role-info">
                                        <strong>Your Role:</strong>
                                        <div className="role-details">
                                           {selectedRoleObject ? `${selectedRoleObject.name} - ${selectedRoleObject.role}` : 'Role not selected'}
                                        </div>
                                     </div>
                                      {bcpScenario && images[0] && (
                                        <img
                                            src={images[0]}
                                            alt="Scenario Illustration"
                                            className="scenario-image"
                                             style={{ marginTop: '10px', width: '100%' }}
                                         />
                                   )}
                                </div>
                            </div>
                           ) : (
                                <>
                                  {bcpScenario && images[0] ? (
                                      <img
                                         src={images[0]}
                                          alt="Scenario Illustration"
                                          className="scenario-image"
                                         />
                                    ) : (
                                       <img
                                           src="../images/BCPModule.png"
                                            alt="Scenario Illustration"
                                             className="scenario-image"
                                        />
                                    )}
                                    {!bcpScenario && (
                                       <div className="module-description">
                                         <h2>Business Continuity Simulation</h2>
                                        <p>
                                              Welcome to the Business Continuity Simulation, where you will engage
                                             in a dynamic simulation based on your chosen disaster event. Your
                                             objective will be to choose the best course of action and see how
                                           your decisions play out in a real-world scenario.
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
                        {bcpScenario && !simulationStarted && (
                           <div className="roles-customization">
                                 <strong>Customize Roles:</strong>
                                {roles.map((role, index) => (
                                 <input
                                        key={index}
                                         type="text"
                                         className="editable-role"
                                        value={role}
                                        onChange={(e) => updateRoles(e.target.value, index)}
                                  />
                               ))}
                             </div>
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
                         bcpScenario ? (
                           <Card className="scenario-card">
                              {simulationStarted ? (
                                 <>
                                 <div className="dashboard">
                                      <div className="metrics-area">
                                         <div className="metric-box">
                                               <span className="metric-label">Financial Loss:</span>
                                               <span className="metric-value">
                                                   $<SevenSegmentDisplay value={Math.min(9, Math.round(metrics.financialLoss / 1000))} />k
                                                </span>
                                          </div>
                                           <div className="metric-box">
                                                <span className="metric-label">Downtime:</span>
                                               <span className="metric-value">
                                                   <SevenSegmentDisplay value={Math.min(9,Math.round(metrics.downtime/ 100))} />%
                                               </span>
                                        </div>
                                           <div className="metric-box">
                                              <span className="metric-label">Employee Morale:</span>
                                                <span className="metric-value">
                                                 <SevenSegmentDisplay value={Math.min(9,Math.round(metrics.employeeMorale/10))} />
                                                </span>
                                            </div>
                                           <div className="metric-box">
                                              <span className="metric-label">Task Completion:</span>
                                              <span className="metric-value">
                                               <SevenSegmentDisplay value={Math.min(9,Math.round(metrics.taskCompletion/10))} />%
                                                </span>
                                           </div>
                                           <div className="metric-box">
                                            <span className="metric-label">Time Elapsed:</span>
                                              <span className="metric-value">
                                                <SevenSegmentDisplay value={Math.min(9,Math.round(metrics.timeElapsed / 60))} />min
                                            </span>
                                           </div>
                                    </div>
                                      <div className="metrics-chart">
                                           {renderMetricsLineChart()}
                                     </div>
                                 </div>
                                 <CardContent className="action-cards-area">
                                    {actionCards.map((card, index) => (
                                       <ActionCard
                                           key={index}
                                          card={card}
                                           onClick={() => handleActionCardClick(card)}
                                           disabled={isFetching}
                                           loading={isFetching}
                                         />
                                       ))}
                                   </CardContent>
                                  <Button className="action-button"
                                       onClick={finalizeSimulation}>End Simulation</Button>
                                   {isFetching && (
                                    <div className="spinner-container">
                                        <BarLoader color="#0073e6" width="100%" />
                                      </div>
                                    )}
                              </>
                            ) : (
                            <>
                                 <CardHeader>
                                   <div className="scenario-title-container">
                                     <CardTitle>{bcpScenario.title}</CardTitle>
                                       <div className="spinner-container">
                                            {isFetching && (
                                               <BarLoader color="#0073e6" width="100%" />
                                           )}
                                     </div>
                                        <div>
                                           {bcpScenario.context.split('\n').map((line, i) => (
                                               <p key={i}>{line}</p>
                                             ))}
                                      </div>
                                    </div>
                                 </CardHeader>
                                    <CardContent>
                                     <div>
                                       <div className="form-group">
                                           <label>Select your role</label>
                                             <div className="radio-group">
                                                {roles.map((role, index) => (
                                                 <label key={index} className="radio-label">
                                                   <input
                                                         type="radio"
                                                        value={role}
                                                          checked={selectedRole === role}
                                                        onChange={() => setSelectedRole(role)}
                                                      />
                                                    {`${role} - ${bcpScenario.roles[index].role}`}
                                                   </label>
                                                  ))}
                                            </div>
                                       </div>
                                          <Button
                                            onClick={() => {
                                                startSimulation();
                                                setShowInstructions(false);
                                            }}
                                             className="start-button"
                                          >
                                           Start Simulation
                                      </Button>
                                 </div>
                                </CardContent>
                            </>
                            )}
                        </Card>
                     ) : (
                    <Card className="setup-card">
                      <CardHeader>
                          <CardTitle className="header-title">
                            Setup Your Simulation
                          </CardTitle>
                           <div className="spinner-container">
                              {isFetching && <BarLoader color="#0073e6" width="100%" />}
                             </div>
                         </CardHeader>
                         <CardContent>
                            <div className="form-group">
                               <label>Select disaster type</label>
                                <select
                                  onChange={(e) => setDisasterType(e.target.value)}
                                  value={disasterType}
                                 >
                                     <option value="">Choose disaster type</option>
                                     {disasterTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                          {type.title}
                                        </option>
                                     ))}
                                 </select>
                           </div>
                            {disasterSubTypes[disasterType] && (
                              <div className="form-group">
                                <label>Select disaster subtype</label>
                                 <select
                                   onChange={(e) => setDisasterSubType(e.target.value)}
                                   value={disasterSubType}
                                    >
                                      <option value="">Choose disaster subtype</option>
                                      {disasterSubTypes[disasterType].map(
                                        (subType, index) => (
                                            <option key={index} value={subType}>
                                                {subType}
                                           </option>
                                        )
                                      )}
                                </select>
                           </div>
                          )}
                        <Button onClick={generateBcpScenario}>Generate Scenario</Button>
                         </CardContent>
                      </Card>
                   )
                 ) : (
                     debriefing && (
                       <div className="debriefing-section">
                            <h4 className="debriefing-title">Simulation Debriefing</h4>
                             {radarData && (
                               <div style={{width: '100%', height: 300}}>
                                <ResponsiveContainer>
                                   <RadarChart data={radarData}>
                                      <PolarGrid />
                                      <PolarAngleAxis dataKey="skill" />
                                      <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                      <Radar name="User" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                   </RadarChart>
                                  </ResponsiveContainer>
                                 </div>
                              )}
                           <p>
                               <strong>Summary:</strong>
                                {debriefing.summary.split('\n').map((line, i) => (
                                      <p key={i}>{line}</p>
                                ))}
                            </p>
                           <p>
                                <strong>Outcome:</strong> {debriefing.outcome}
                            </p>
                           <p>
                               <strong>Strengths:</strong>{' '}
                               {debriefing.strengths
                               ? debriefing.strengths.join(', ')
                                : 'None'}
                           </p>
                           <p>
                                <strong>Areas for Improvement:</strong>{' '}
                                {debriefing.areasForImprovement
                               ? debriefing.areasForImprovement.join(', ')
                                : 'None'}
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
                         {showTranscript && (<div className="transcript">
                                <h5>Full Transcript:</h5>
                              {debriefing.transcript.map((msg, index) => (
                                 <div key={index}>
                                  <strong>{msg.name}:</strong> {msg.content}
                                  </div>
                                     ))}
                                 </div>
                            )}
                         <div className="action-buttons">
                              <Button onClick={() => setSimulationComplete(false)}>
                               Try Different Choices
                                 </Button>
                             <Button onClick={resetSimulation}>
                                 Run as Different Type
                                 </Button>
                            </div>
                       </div>
                 )
              )}
           </div>
          </section>
        </main>
    </div>
    );
};

export const metadata = {
    title: 'Business Continuity Simulator',
    description: 'Prepare for disruptions with our BCP simulator.',
    imageUrl: '../images/BCPModule.png',
    instructions: `
     <h2>Gameplay Overview</h2>
       <p>Welcome to the Business Continuity Simulation, where you will engage in a dynamic simulation based on your chosen disaster event. Your objective will be to choose the best course of action and see how your decisions play out in a real-world scenario.</p>
     <h3>Simulation Mechanism</h3>
        <p>The simulation is driven by dynamic, AI-generated scenarios. Once you select a disaster type and role, you'll engage with a real-time dashboard. The dashboard is dynamically updated based on your actions and the evolving simulated scenario.</p>
        <p>Each turn, you will be presented with action cards, which represent different strategies or tasks you can pursue in the simulated environment. These cards will each have a resource cost, and an effect on the overall metrics. Your objective will be to maximize the recovery, minimize losses, and maintain morale.</p>
      <h3>Outcome and Debriefing</h3>
       <p>At the conclusion of the simulation, you will receive a detailed debriefing. This includes a summary of the simulation, feedback on your strengths and areas for improvement, an overall score, and recommendations for future actions. Use this feedback to refine your skills and prepare for real-world business continuity scenarios.</p>
       `,
    component: BCPModule,
};

export default BCPModule;