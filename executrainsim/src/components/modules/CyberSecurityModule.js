// src/components/modules/CybersecurityModule.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Select, { SelectItem } from '../ui/Select';
import Progress from '../ui/Progress';
import SevenSegmentDisplay from '../effects/SevenSegmentDisplay';
import { BarLoader, BeatLoader } from 'react-spinners';
import { AlertTriangle, CheckCircle, Edit, Menu, ArrowUp, ArrowDown } from 'lucide-react';
import '../../styles/AppStyles.css';
import '../../styles/CybersecurityModule.css';

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
            } catch(parseError) {
                console.error('Parse Error:', parseError);
                  return {error: parseError} //returns a safe response instead of failing
            }
    }
     return apiResponse
  } catch (err) {
    console.error('Failed to parse AI JSON:', err, apiResponse);
      return { error: err };
  }
};

const CybersecurityModule = ({ onReturn }) => {
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
    const [customActions, setCustomActions] = useState({});
    const [responseOptions, setResponseOptions] = useState([]);
    const [simulationStarted, setSimulationStarted] = useState(false);
     const [showInstructions, setShowInstructions] = useState(false);
     const [systemStatus, setSystemStatus] = useState({
        networkHealth: 100,
        serverLoad: 0,
        intrusionAttempts: 0,
    });
    const [scenarioGenerated, setScenarioGenerated] = useState(false)
    const [logs, setLogs] = useState([]);
        const logsEndRef = useRef(null);

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

  const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };


    useEffect(() => {
        if (logs.length > 0) {
            scrollToBottom();
        }
    }, [logs]);



    useEffect(() => {
        if (timeLeft <= 0) {
            setSimulationComplete(true);
        } else if (simulationStarted){
            const timer = setInterval(() => {
                setTimeLeft((prevTime) => setTimeLeft(prev => prev -1 ));
            }, 1000);
           return () => clearInterval(timer);
        }
    }, [timeLeft, simulationStarted]);

    useEffect(() => {
         if (difficulty === 'expert' && simulationStarted) {
      const eventInterval = setInterval(() => {
         addNotification("New security incident detected!");
        setSystemStatus((prev) => ({
                    ...prev,
                    intrusionAttempts: prev.intrusionAttempts + 5,
                     networkHealth: Math.max(0, prev.networkHealth - 2)
        }));
      }, 60000);
      return () => clearInterval(eventInterval);
    }
    }, [difficulty, simulationStarted]);

  useEffect(() => {
        if(selectedAlert && simulationStarted){
           generateResponseOptions(selectedAlert?.description)
        }

  }, [selectedAlert, simulationStarted]);


  const addLog = (log) => {
        setLogs((prevLogs) => [...prevLogs, { message: log, timestamp: new Date() }]);
  };

    const addNotification = (message) => {
        setNotifications((prev) => [...prev, message]);
  };


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


    const generateScenario = async () => {
        try {
            const selectedRoleTitle = roles.find((r) => r.value === role)?.title;
            const selectedDifficultyTitle = difficultyLevels.find((level) => level.value === difficulty)?.title;

            if (!selectedRoleTitle || !selectedDifficultyTitle) {
                setErrorMessage('Please select a role and difficulty.');
                return;
            }

            setErrorMessage('');

           const prompt = `
        Create a cybersecurity scenario for a ${selectedRoleTitle} at ${selectedDifficultyTitle} difficulty level.
        The scenario should include a title, detailed context, specific objectives, and a series of decision points to be resolved by the user.
        Provide each decision point with a description of the alert, a set of 3-5 options to choose from, and the expected result of each option.
       Return the result in JSON format:
        {
            "scenario": {
                "title": "string",
                "context": "string",
                "objectives": ["string"],
                  "decision_points": [
                      {
                        "id": number,
                        "description": "string",
                        "options": [
                            { "option": "string", "result": "string" },
                            ]
                        }
                    ],
                 "feedback": "string"
            }
         }
      `;
            const rawScenarioData = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: prompt }] },
                '/api/generate'
             );
            const parsedScenario = parseAiJson(rawScenarioData);
           if (parsedScenario?.scenario) {
              setScenario(parsedScenario.scenario);
              setScenarioGenerated(true)
            } else {
                setErrorMessage('Failed to generate scenario. Please try again.');
            }
         } catch (error) {
          setErrorMessage('An error occurred while generating the scenario.');
        }
  };

 const startSimulation = async () => {
        if (!role || !difficulty) {
            setErrorMessage('Please select a role and difficulty.');
            return;
        }
      if(!scenario){
         setErrorMessage('Please generate a scenario first.');
            return;
         }

        setSimulationStarted(true);
          setErrorMessage('');
        addLog(`Simulation started. Role: ${roles.find((r) => r.value === role).title}, Difficulty: ${difficultyLevels.find((level) => level.value === difficulty).title}`);

       try {
            if(scenario?.decision_points){
              const initialAlerts = scenario.decision_points.map((dp, index) => ({
                  id: dp.id,
                 description: dp.description,
                  options: dp.options
                 }));
                 setAlerts(initialAlerts);
           }

         } catch (error) {
          setErrorMessage('Failed to start the simulation. Please try again.');
          }
  };

     const generateResponseOptions = async (context) => {
        if (!role || !difficulty) {
           console.warn('Role or difficulty not set. Skipping response option generation.');
          return;
       }

        const prompt =  `
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

   const handleResolution = async (actionIndex) => {
       if (!selectedAlert) return;
       setSystemStatus(prev => ({...prev, serverLoad:  Math.min(100, prev.serverLoad + 15)}))

       const selectedOption = responseOptions[actionIndex] ||  null
      const actionDescription = selectedOption ?  selectedOption.description :  'No action selected'
         addLog(`User action: ${actionDescription}.`);

        const systemPrompt = `
            As a simulation engine, in the role of a cybersecurity system, respond to the user's action based on a previous threat: "${selectedAlert.description}".
            Evaluate the effectiveness of user's choice and adjust the simulation. Provide a follow up message that includes the next steps or challenges the user will face. Do not use conversational filler, and keep your message brief and to the point.
            The user's selected action was: "${actionDescription}".
           Also ensure that you are using the system context already provided by the initial scenario prompt.
           Return the response in JSON format with the following structure:
           {
            "message": "string",
            "updatedScenario": {
                  "title": "string",
                "context": "string",
                "objectives": ["string"],
                "decision_points": [
                        {
                        "id": number,
                        "description": "string",
                            "options": [
                              { "option": "string", "result": "string" },
                             ]
                            }
                     ],
                 "feedback": "string"
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

            const finalMessage = parsed?.message;
              const nextAlert = parsed?.nextAlert;
            const updatedScenario = parsed?.updatedScenario;


           if (!finalMessage || !updatedScenario) {
                  throw new Error('System response is empty or invalid JSON.');
            }
               addLog(`System message: ${finalMessage}`);

         if (updatedScenario?.decision_points) {
                  const nextAlerts = updatedScenario.decision_points.map((dp) => ({
                     id: dp.id,
                    description: dp.description,
                      options: dp.options
                   }));
              setAlerts(nextAlerts)
                 } else{
                  setAlerts([])
              }

           setSelectedAlert(nextAlert)
             setScenario(updatedScenario)
         if(progress >= 100 || alerts.length === 0){
           finalizeSimulation()
            } else {
                 setProgress((prev) => prev + 20)
                 setSystemStatus(prev => ({...prev, networkHealth: Math.max(0, prev.networkHealth - 5)}))
          }

           } catch (error) {
               console.error('Failed to generate simulation response:', error);
              setErrorMessage('Failed to generate simulation response. Please try again.');
          }
   };

 const analyzeSimulation = async () => {
        const analysisPrompt = `
         Analyze the following simulation transcript and provide an in-depth analysis, with a focus on the user's performance based on their responses to the challenges presented.
        Evaluate the user’s performance based on several key decision making tactics and provide a score on a scale of 1-10 for each tactic.
         Provide an overall summary that describes the user’s strategy in the simulation, and specific examples of when they employed those strategies well, or not so well.
        Be sure to note specific instances in the dialogue to back up your findings.
            Return the result in JSON format with the following structure:
           {
               "summary": "string",
               "tactics": {
                 "Problem Solving": number,
                 "Decision Making": number,
                "Adaptability": number,
                  "Strategic Thinking": number,
                  "Technical Knowledge": number,
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
                      setDebriefing((prev) => ({
                          ...prev,
                           summary: parsedAnalysis.summary,
                     }));
                   } else {
                      setErrorMessage('Failed to analyze simulation. Please try again.');
               }
        } catch (error) {
             setErrorMessage('Failed to analyze simulation. Please try again.');
              console.error('Error analyzing simulation:', error);
              return null;
         }
  };



    const finalizeSimulation = async () => {
       await analyzeSimulation()
       const totalMessages = logs.length;
       const actionsTaken = logs.reduce((acc, log) => {
           if(log.message.includes("User action")){
                return acc + 1
           } else {
               return acc
           }
       }, 0)
       const effectivenessScore = (actionsTaken/totalMessages) * 100

         const outcome =  effectivenessScore > 50 ? 'Success' : 'Failure';
         setDebriefing((prev) => ({
             ...prev,
             strengths: actionsTaken > 0 ? ['Adaptive Strategy', 'Persistence'] : ['Quick Adaptation'],
             areasForImprovement: ['System Understanding', 'Technical Application'],
             overallScore: Math.round(effectivenessScore),
             letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
            advice: outcome === 'Success' ? 'Continue refining your security strategies.' : 'Consider a different approach for improved results.',
             transcript: logs,
            outcome: outcome,
              stars: effectivenessScore > 85 ? 5 : effectivenessScore > 70 ? 4 : effectivenessScore > 50 ? 3 : 2
       }));
       setSimulationComplete(true);
   };

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
        setCustomActions({});
      setResponseOptions([]);
       setSimulationStarted(false)
       setSystemStatus({networkHealth: 100, serverLoad: 0, intrusionAttempts: 0});
         setLogs([])
      setScenarioGenerated(false)
    };

  const handleAlertReorder = (draggedIndex, droppedIndex) => {
      const reorderedAlerts = [...alerts];
     const [draggedAlert] = reorderedAlerts.splice(draggedIndex, 1);
      reorderedAlerts.splice(droppedIndex, 0, draggedAlert);
       setAlerts(reorderedAlerts);
   };


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
                            <p><strong>Role:</strong> {role === 'custom' ? 'Custom Role' : roles.find((r) => r.value === role).title}</p>
                            <p><strong>Difficulty:</strong> {difficultyLevels.find((level) => level.value === difficulty).title}</p>
                            </div>
                           </div>
                       </div>
                     ) : (
                       <>
                         <img src="../images/CybersecurityModule.png" alt="Scenario Illustration" className="scenario-image" />
                            {!scenario && (
                             <div className="module-description">
                                   <h2>Cybersecurity Simulator</h2>
                                  <p>
                                    Welcome to the Cybersecurity Simulator, where you will engage
                                   in a strategic battle of wits against a dynamic simulation. Your objective is to
                                      make critical decisions to defend against threats and protect your organization.
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

                    </CardContent>
                </Card>
         {simulationStarted &&  (
              <Card className="details-card">
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
                        <Button onClick={resetSimulation} className="restart-button">
                             Restart Simulation
                        </Button>
                      </CardContent>
                 </Card>
                )}

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
                                    </CardHeader>
                                        <CardContent >
                                           {alerts.map((alert, index) => (
                                          <div
                                               key={alert.id}
                                            onClick={() => handleAlertSelection(alert)}
                                             className={`alert-item ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
                                                 draggable
                                                   onDragStart={(e) => e.dataTransfer.setData('index', index)}
                                                  onDrop={(e) => {
                                                   e.preventDefault()
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
                                        </CardHeader>
                                      <CardContent>
                                            {selectedAlert && (
                                             <div className="options-container">
                                                    {responseOptions && responseOptions.map((option, index) => (
                                                     <Button key={index} onClick={() => handleResolution(index)} className="option-button">
                                                           {option.name} - {option.description}
                                                       </Button>
                                                    ))}
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
                               { !scenarioGenerated && (<Button onClick={generateScenario} disabled={isFetching}>
                                         {isFetching ? 'Generating...' : 'Generate Scenario'}
                                      </Button>)}
                                { scenarioGenerated && (<Button onClick={startSimulation} disabled={isFetching}>
                                      {isFetching ? 'Starting...' : 'Start Simulation'}
                                      </Button>)}
                              </CardContent>
                            </Card>
                     )
                     ) : (
                       debriefing && (
                        <div className="debriefing-section">
                          <h4 className="debriefing-title">Simulation Debriefing</h4>
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
                           <div className="stars-container">
                                   {[...Array(debriefing.stars || 0)].map((_, i) => (
                                       <CheckCircle key={i} className="star filled" />
                                     ))}
                                    {[...Array(5 - (debriefing.stars || 0))].map((_, i) => (
                                        <CheckCircle key={i} className="star" />
                                      ))}
                                </div>
                              <p>
                                 <strong>Recommendations:</strong> {debriefing.advice}
                             </p>
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