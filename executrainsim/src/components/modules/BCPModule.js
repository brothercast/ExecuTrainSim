import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Select, { SelectItem } from '../ui/Select';
import { Info, Star, ChevronLeft, ChevronRight, Menu, RefreshCw, SendHorizontal } from 'lucide-react';
import { BarLoader, GridLoader, BeatLoader } from 'react-spinners';
import SlotMachineText from '../effects/SlotMachineText';
import '../../styles/AppStyles.css';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

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
        return apiResponse; // Assume it's already parsed
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
    const [chatHistory, setChatHistory] = useState([]);
    const [userDraft, setUserDraft] = useState('');
    const [progress, setProgress] = useState(0);
    const [simulationComplete, setSimulationComplete] = useState(false);
    const [debriefing, setDebriefing] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFetchingOpponent, setIsFetchingOpponent] = useState(false);
    const [isFetchingUser, setIsFetchingUser] = useState(false);
    const [images, setImages] = useState({});
    const [responseOptions, setResponseOptions] = useState([]);
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
    const [activePhase, setActivePhase] = useState('setup'); // 'setup', 'response', 'recovery', 'review'
    const [phaseObjectives, setPhaseObjectives] = useState(null);

    const MAX_TOTAL_TOKENS = 4096;
    const MIN_RESPONSE_TOKENS = 150;

    const selectedRoleObject = bcpScenario?.roles?.find((role) => role.name === selectedRole);

    useEffect(() => {
        if (chatHistory.length > 0) {
            setCurrentTurnIndex(Math.floor(chatHistory.length / 2) + 1);
        }
    }, [chatHistory]);

    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (simulationStarted) {
            scrollToBottom();
        }
    }, [chatHistory]);


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
                - Recovery Steps: Provide 4-5 recommended steps that would be typical during a BCP execution of this kind.
                - Phase Objectives: Clearly define objectives for each of the 3 BCP phases: immediate response, business recovery, and review/improvement

               Generate the scenario in JSON with the format:
                {
                    "scenario": {
                        "title": "string",
                        "context": "string",
                        "roles": [
                            { "name": "string", "role": "string", "objective": "string" }
                        ],
                         "recoverySteps": ["string"],
                        "phaseObjectives": {
                             "immediateResponse": ["string"],
                            "businessRecovery": ["string"],
                            "reviewImprovement": ["string"]
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
                setSimulationComplete(false);
                setScenarioGenerated(true);
                setPhaseObjectives(parsedScenario.scenario.phaseObjectives); // Set phase objectives
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

        try {
            const userRole = bcpScenario.roles.find((r) => r.name === selectedRole);
            if (!userRole) {
                throw new Error('Roles not correctly set or not found.');
            }

           const initialPrompt = `
        As ${userRole.name}, in your role as "${userRole.role}", provide an initial assessment and plan of action in the face of the following event: "${bcpScenario.title}". Focus on the immediate next steps based on what you were provided.
        The message should set the stage for your role in this BCP event and be appropriate for a chat interface, and not a long email. Use a familiar yet professional tone that reflects the context: "${bcpScenario.context}".
        Return the response in JSON format: { "message": "string" }
        `;


            const rawOpeningResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: initialPrompt }], temperature: 0.7, max_tokens: 500 },
                '/api/generate'
            );

            const parsedOpening = parseAiJson(rawOpeningResponse);
            const openingMessage = parsedOpening?.message || 'Unable to fetch opening message.';

            addMessageToHistory(openingMessage, 'user');
             setProgress(20);

            generateResponseOptions(bcpScenario?.context, userRole);
        } catch (error) {
             console.error('Error generating opening message:', error);
            setErrorMessage('Failed to generate the opening message. Please try again.');
        }
    };

    const updateRoles = (newRole, index) => {
        const newRoles = [...roles];
        newRoles[index] = newRole;
        setRoles(newRoles);

        if (bcpScenario) {
            bcpScenario.roles[index].name = newRole;
        }
    };


   const generateOpponentSystemPrompt = (scenario, player, difficulty, chatHistory) => {
     const difficultySettings = {
        easy: {
            tone: 'collaborative and supportive',
            complexity: 'basic recovery actions',
            strategy: 'accommodating, seeking consensus',
        },
       medium: {
            tone: 'assertive and focused',
           complexity: 'standard recovery protocols',
            strategy: 'firm, efficient in decision-making',
        },
        hard: {
            tone: 'strategic and critical',
            complexity: 'complex, multi-faceted recovery plans',
            strategy: 'demanding, focused on results',
        },
          expert: {
            tone: 'highly strategic and exacting',
            complexity: 'complex, multifaceted, and often conflicting recovery strategies',
            strategy: 'ruthless in achieving recovery objectives',
        },
    };


       const settings = difficultySettings[difficulty] || difficultySettings['medium'];
      const chatHistoryString = chatHistory.map(msg => `${msg.name}: ${msg.content}`).join("\n");


     return `
             You are responding to ${player.name} as a support agent in a Business Continuity scenario focused on ${scenario.title} from the context: ${scenario.context}.
             Maintain a ${settings.tone} tone and employ ${settings.complexity}. You should utilize the strategy of being ${settings.strategy}.
            Your goal is to assist in the recovery process and support the roles in the scenario by asking probing questions based on the context, and challenging any decisions that don't seem viable.
           Do not use conversational filler or rephrase previous statements too frequently. Vary your sentence structure and word choice to prevent repetitive phrases.
             Keep your responses concise and directly address the points raised by ${player.name}.
            Do not reveal your negotiation strategy or desired outcome explicitly.
           Base your responses solely on the conversation history provided:
             ${chatHistoryString}
         `;
   };

    const generateResponseOptions = async (context, userRole) => {
        if (!selectedRole) {
            console.warn('Selected role not set. Skipping response option generation.');
            return;
        }

        const latestUserMessage = getLatestMessage('user');

        const prompt = createResponseOptionsPrompt(context, userRole, latestUserMessage);

        setIsResponseLoading(true);
        setIsSpinning(true);

        try {
            const rawResponse = await fetchOpenAIResponse({
                messages: [{ role: 'system', content: prompt }],
                temperature: 0.7,
                max_tokens: 550
            }, '/api/generate');

             handleResponseOptions(rawResponse);
        } catch (error) {
             handleError('Failed to generate response options. Please try again.', error);
        } finally {
            setIsSpinning(false);
            setIsResponseLoading(false);
        }
    };

    const generateUserResponse = async (strategyDescription) => {
        const userRole = bcpScenario.roles.find((r) => r.name === selectedRole);

        const prompt = createUserResponsePrompt(strategyDescription, userRole);

        try {
        const rawResponse = await fetchOpenAIResponse({
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.7,
            max_tokens: 500
        }, '/api/generate', true);

            handleUserResponse(rawResponse);
        } catch (error) {
            handleError('Failed to generate user draft. Please try again.', error);
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

    const getLatestMessage = (role) => {
        return chatHistory.filter((msg) => msg.role === role).slice(-1)[0]?.content || '';
    };

    const createResponseOptionsPrompt = (context, userRole, latestUserMessage) => `
            Based on the ongoing BCP scenario for: ${context},
            consider the user's last message as: "${latestUserMessage}", and the role you are playing of: ${userRole}.
            Generate four strategic response options the user could employ.
            Each option should include a strategy name and a brief description of how it could be used
            in the context of the current situation.
            Return the response in JSON format:
            {
                "options": [{ "name": "string", "description": "string" }]
            }
        `;

    const createUserResponsePrompt = (strategyDescription, userRole) => `
            As ${userRole.name}, in the role of ${userRole.role}, draft a concise and professional response, based on the strategy: "${strategyDescription}".
            The message should be direct, and address the context: "${bcpScenario.context}".
             Return the message in JSON format as shown below:
            {
                "message": "Your message content here"
            }
        `;

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

    const handleUserResponse = (rawResponse) => {
        const parsed = parseAiJson(rawResponse);
        if (parsed?.message) {
            setUserDraft(parsed.message);
        } else {
            setErrorMessage('Failed to generate user draft. Please try again.');
        }
    };

    const handleError = (message, error) => {
        console.error(message, error);
        setErrorMessage(message);
    };


    const generateOpponentResponse = async () => {
        try {
            const userRole = bcpScenario.roles.find((r) => r.name === selectedRole);

            if (!userRole) {
                throw new Error('Roles not correctly set.');
            }

           const systemPrompt = generateOpponentSystemPrompt(bcpScenario, userRole, 'medium', chatHistory);
            const lastUserMessage = chatHistory.filter((msg) => msg.role === 'user').slice(-1)[0]?.content || '';
             const opponentPrompt = `
              You are an agent assisting ${userRole.name} in a BCP event: "${bcpScenario.title}".
              Respond with a brief follow up question, based on the user's last response and your objectives.
             Return the response in JSON format: { "message": "string" }
           `;
        const rawResponse = await fetchOpenAIResponse(
          {
             messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: opponentPrompt },
             { role: 'user', content: lastUserMessage },
            ],
             temperature: 0.7,
             max_tokens: 500,
          },
          '/api/generate'
        );

            if (!rawResponse) {
                throw new Error('No response from AI server');
            }

            const parsed = parseAiJson(rawResponse);
            const finalMessage = parsed?.message;
            if (!finalMessage) {
               throw new Error('Support response is empty or invalid JSON.');
           }
             return finalMessage.trim();
        } catch (error) {
            console.error('Failed to generate support response:', error);
            setErrorMessage('Failed to generate support response. Please try again.');
            return null;
        }
    };

    const getRandomDelay = () => Math.floor(Math.random() * (9000 - 4000 + 1)) + 4000;

    const sendUserReply = async () => {
        if (!userDraft.trim()) {
            setErrorMessage('Please type a reply before sending.');
            return;
        }
        setErrorMessage('');
        addMessageToHistory(userDraft, 'user');
        setUserDraft('');
         setProgress((prev) => prev + 20);
       setCurrentTurnIndex(prev => prev + 1);
         setIsUserTurn(false);
       setIsFetching(true);

      setTimeout(async () => {
            const opponentMessageContent = await generateOpponentResponse();
           if (opponentMessageContent) {
             addMessageToHistory(opponentMessageContent, 'support');
            }
        setIsUserTurn(true);
            if (progress >= 100) {
               finalizeSimulation();
         }
          setIsFetching(false);
        }, getRandomDelay());
    };


    const analyzeSimulation = async () => {
        const analysisPrompt = `
            Analyze the following BCP simulation transcript and provide an in-depth analysis, with a focus on the user's performance based on BCP and recovery tactics.
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
            ${JSON.stringify(chatHistory, null, 2)}
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

        const userStrategyEffectiveness = chatHistory.reduce((acc, msg) => {
            if (msg.role === 'user') {
                return acc + 1;
            }
            return acc;
        }, 0);

        const totalMessages = chatHistory.length;
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
             outcome: outcome
        }));
        setSimulationComplete(true);
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
        setSimulationStarted(false);
        setScenarioGenerated(false);
        setCurrentTurnIndex(1);
        setRadarData(null);
        setActivePhase('setup');
    };

    const goToPreviousTurn = () => {
         if (currentTurnIndex > 1 && simulationComplete) {
           setCurrentTurnIndex(prevIndex => prevIndex - 1);
         }
     };


    const goToNextTurn = () => {
      const totalTurns = Math.ceil(chatHistory.length / 2);
      if (currentTurnIndex < totalTurns && simulationComplete) {
        setCurrentTurnIndex(prevIndex => prevIndex + 1);
      }
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
                            {simulationStarted && simulationComplete && (
                                   <ChevronRight
                                 onClick={goToNextTurn}
                                  className={`nav-arrow ${
                                    simulationComplete &&
                                      currentTurnIndex >= Math.ceil(chatHistory.length / 2)
                                    ? 'disabled'
                                   : ''
                                  }`}
                                   title="Next Turn"
                                 />
                              )}
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
                                          <div className="chat-area">
                                             <CardContent className="chat-history-container">
                                                <div className="chat-history">
                                                   {chatHistory.map((msg, index) => (
                                                       <div
                                                          key={index}
                                                            className={`chat-message ${msg.role}`}
                                                            style={{ display: 'block' }}
                                                           >
                                                              <div>
                                                               <strong className="sender-name">Sender:</strong>{' '}
                                                                    {msg.name}
                                                            </div>
                                                            <div>
                                                            <strong className="message-timestamp">
                                                             Time:
                                                            </strong>{' '}
                                                            {msg.timestamp}
                                                             </div>
                                                              <div>
                                                                {msg.content.split('\n').map((line, i) => (
                                                                 <p key={i}>{line}</p>
                                                                ))}
                                                              </div>
                                                        </div>
                                                    ))}
                                                 <div ref={chatEndRef} />
                                            </div>
                                          {isFetchingOpponent && (
                                                <div className="spinner-container">
                                                   <BeatLoader color="#0073e6" size={8} />
                                                  </div>
                                               )}
                                        </CardContent>
                                           <div className="message-input-container">
                                                <div className="response-options-container">
                                                <div className="response-buttons">
                                                  {responseOptions.map((option, index) => (
                                                       <Button
                                                        key={index}
                                                        onClick={() => generateUserResponse(option.description)}
                                                           disabled={isResponseLoading}
                                                          className={`response-button ${isResponseLoading ? 'loading' : ''
                                                            }`}
                                                           >
                                                          <SlotMachineText
                                                            text={option.name}
                                                           isSpinning={isResponseLoading}
                                                               revealSpeed={500}
                                                        />
                                                       </Button>
                                                    ))}
                                                  </div>
                                                </div>
                                            {isResponseLoading && (
                                                  <div className="spinner-container">
                                                      <BarLoader color="#0073e6" width="100%" />
                                                  </div>
                                                )}
                                                <div className="user-input-container">
                                                   <textarea
                                                     value={userDraft}
                                                       onChange={(e) => setUserDraft(e.target.value)}
                                                     className="user-draft-textarea"
                                                      placeholder="Type your reply here or select an option above..."
                                                       onKeyDown={(e) => {
                                                          if (e.key === 'Enter' && !e.shiftKey) {
                                                           e.preventDefault();
                                                           sendUserReply();
                                                          }
                                                        }}
                                                    />
                                                     <Button onClick={sendUserReply} className="send-button">
                                                            Send <SendHorizontal style={{ marginLeft: '8px' }} />
                                                        </Button>
                                                    </div>
                                                    {isUserReplyLoading && (
                                                        <div className="spinner-container">
                                                            <BarLoader color="#0073e6" width="100%" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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
           <p>The simulation is driven by dynamic, AI-generated scenarios. Once you select a disaster type and role, you'll enter a dialogue with a support agent. Each turn, you can choose from several strategic response options or draft a custom reply to guide the recovery in your favor.</p>
            <p>The AI agent will respond based on the context and previous dialogue, adapting its strategy to challenge your decisions. Your task is to anticipate issues, evaluate the scope of the problem, and steer the recovery towards a positive resolution.</p>
         <h3>Outcome and Debriefing</h3>
           <p>At the conclusion of the simulation, you will receive a detailed debriefing. This includes a summary of the simulation, feedback on your strengths and areas for improvement, an overall score, and recommendations for future actions. Use this feedback to refine your skills and prepare for real-world business continuity scenarios.</p>
           `,
        component: BCPModule,
    };
    
    export default BCPModule;