import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { ChevronLeft, ChevronRight, RefreshCw, Info, CheckSquare, Square } from 'lucide-react';
import { BarLoader, BeatLoader } from 'react-spinners';
import '../../styles/AppStyles.css';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    AreaChart,
    Area,
} from 'recharts';
import SevenSegmentDisplay from '../effects/SevenSegmentDisplay';
import ActionCard from '../ui/ActionCard';
import DOMPurify from 'dompurify';
import Select, { SelectItem } from '../ui/Select';

// Constants for API URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const IMAGE_API_URL = process.env.REACT_APP_IMAGE_API_URL || 'http://localhost:5001';

// Disaster types and subtypes
const disasterTypes = [
    { value: 'natural', title: 'Natural Disaster' },
    { value: 'technological', title: 'Technological Failure' },
    { value: 'human', title: 'Human-Caused Event' },
    { value: 'supply', title: 'Supply Chain Disruption' },
    { value: 'economic', title: 'Economic Crisis' },
    { value: 'health', title: 'Health Emergency' }
];

const disasterSubTypes = {
    natural: ['Earthquake', 'Hurricane', 'Tornado', 'Wildfire', 'Flood', 'Blizzard', 'Pandemic'],
    technological: ['Cyberattack', 'System Failure', 'Data Breach', 'Hardware Failure', 'Software Malfunction', 'Power Outage', 'Network Failure'],
    human: ['Terrorist Attack', 'Civil Unrest', 'Workplace Violence', 'Accidental Spill', 'Sabotage', 'Employee Strike'],
    supply: ['Supplier Bankruptcy', 'Logistical Failure', 'Transportation Strike', 'Inventory Loss', 'Raw Material Shortage'],
    economic: ['Market Crash', 'Currency Devaluation', 'Trade Embargo', 'Inflation Spike', 'Recession', 'Regulatory Change'],
    health: ['Disease Outbreak', 'Food Contamination', 'Mass Casualty', 'Chemical Exposure', 'Biological Threat']
};

// Helper function to generate timestamps
let lastTimestamp = new Date();
const generateSequentialTimestamp = () => {
    const newTimestamp = new Date(lastTimestamp.getTime() + 5 * 60 * 1000);
    lastTimestamp = newTimestamp;
    const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
    return newTimestamp.toLocaleTimeString('en-US', options);
};
// Helper function to parse AI JSON response
const parseAiJson = (apiResponse) => {
    if (!apiResponse) {
        throw new Error('No response data to parse.');
    }

    try {
        if (typeof apiResponse === 'string') {
            const cleaned = apiResponse.replace(/```json|```/g, '').trim();
             try {
                return JSON.parse(cleaned);
            } catch (parseError) {
                return apiResponse
            }
        }
        return apiResponse;
    } catch (err) {
        console.error('Failed to parse AI JSON:', err, apiResponse);
        return {};
    }
};

// Main BCPModule component
const BCPModule = ({ onReturn }) => {
    // State variables
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
    const [actionCards, setActionCards] = useState(null);
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
    const [metricHistory, setMetricHistory] = useState([]);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [feedbackMessage, setFeedbackMessage] = useState(null);
    const [showFeedback, setShowFeedback] = useState(true);
     const [performanceScore, setPerformanceScore] = useState(0);
     const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [performanceData, setPerformanceData] = useState([]);

    const MAX_TOTAL_TOKENS = 4096;
    const MIN_RESPONSE_TOKENS = 150;

    const selectedRoleObject = bcpScenario?.roles?.find((role) => role.name === selectedRole);
    const timerRef = useRef(null);
    const chatHistoryContainerRef = useRef(null);

    useEffect(() => {
        if (simulationStarted && bcpScenario) {
            timerRef.current = setInterval(timerTick, 1000);
            return () => {
                clearInterval(timerRef.current);
            };
        }
    }, [simulationStarted, bcpScenario]);

    const timerTick = () => {
        setTimeElapsed((prevTime) => prevTime + 1);
        setMetrics((prevMetrics) => ({
            ...prevMetrics,
            timeElapsed: prevMetrics.timeElapsed + 1,
        }));
    };

    useEffect(() => {
        if (simulationStarted) {
            setMetricHistory((prevHistory) => [
                ...prevHistory,
                { ...metrics, time: timeElapsed },
            ]);
        }
    }, [timeElapsed, metrics, simulationStarted]);

    const updateMetrics = (changes, points = 0) => {
         setPerformanceScore((prev) => {
                const updatedValue = prev + points;
                return updatedValue;
            });
            setMetrics(prevMetrics => ({
            ...prevMetrics,
            ...changes,
        }));
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
            const response = await axios.post(endpoint, input, {
                headers: { 'Content-Type': 'application/json' },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching from OpenAI:', error);
            if (error.response) {
                console.error('API Error Details:', error.response.data);
            }
            setErrorMessage('Failed to communicate with the server. Please check the console for details.');
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
                Create a detailed Business Continuity Plan (BCP) scenario for a ${selectedType} event${subType ? ` with a focus on ${subType}` : ''} for a medium-sized tech company.
                Include the following key elements:
                - Detailed Description of the Event: Describe what happened, its immediate impact, and potential cascading effects on the business.
                - Multiple Roles: Create 2-3 distinct roles within the organization (e.g., Incident Commander, Department Lead, Communications Lead) with clear responsibilities and differing perspectives on the situation.
                - Initial Objectives: Describe the primary objectives for each role in the immediate aftermath of the event.
                - Challenges: What are the initial challenges that each role would face given the circumstances and the scope of impact.
               - Action Cards: Generate 4-6 action cards that represent different types of recovery tasks/decisions the user can employ. Provide descriptions of each card, their resource cost, the expected positive outcome, and any negative consequences that might occur when utilized.  For each action card, include a point value that the user receives on completion.
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
                            { "name": "string", "description": "string", "resourceCost": number,  "expectedOutcome": "string", "consequences": "string", "points": number }
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
               setActionCards(parsedScenario.scenario.actionCards.map(card => ({ ...card, state: 'available' })));
                setSimulationComplete(false);
                setScenarioGenerated(true);
                setPhaseObjectives(parsedScenario.scenario.phaseObjectives);
                setMetrics(parsedScenario.scenario.initialMetrics);
                 try {
                    await generateImage(parsedScenario.scenario.title, parsedScenario.scenario.context);
                } catch (err) {
                   console.error(err)
                }

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


    const startSimulation = () => {
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
     // addMessageToHistory function (Modified)
   const addMessageToHistory = (content, role, points = 0) => {
      const roleName = role === 'user'
             ? selectedRole
             : bcpScenario?.roles.find((r) => r.name !== selectedRole)?.name || 'Support';
        const sanitizedContent = DOMPurify.sanitize(content);
        const newMessage = {
            content: sanitizedContent,
           role,
           name: roleName,
           timestamp: generateSequentialTimestamp(),
           id: Date.now(),
           points: points,
        };

        setChatHistory((prevHistory) => {
            const updatedHistory = [...prevHistory, newMessage];
            if (chatHistoryContainerRef.current)
              chatHistoryContainerRef.current.scrollTop = chatHistoryContainerRef.current.scrollHeight;
            return updatedHistory
        });
    };


     // dismiss the feedback bubble
    const dismissFeedback = (messageId) => {
    setChatHistory((prevHistory) =>
            prevHistory.map((msg) =>
                msg.id === messageId
                    ? { ...msg, feedbackVisible: false }
                    : msg
            )
        );
   };

    // Toggle showing feedback
    const toggleFeedback = () => {
        setShowFeedback(!showFeedback);
    };

    // Click event for feedback box
    const handleFeedbackClick = (messageId) => {
         setChatHistory(prevHistory =>
            prevHistory.map(msg =>
                msg.id === messageId
                    ? { ...msg, feedbackVisible: !msg.feedbackVisible }
                    : msg
            )
       );
    };
   // Generate feedback for user action
    const generateFeedback = async (card) => {
        const userRole = bcpScenario.roles.find((r) => r.name === selectedRole);
           const feedbackPrompt = `
               Analyze the user's action card choice: "${card.name}" in the role of the ${userRole.role} in the context of the BCP, with a focus on BCP tactics, and considering the objectives of the current phase, as well as the context: "${bcpScenario.context}".
                 Provide a concise feedback to the user on their strategic choices, and include at least one point that the user did well, and one thing that they could improve next time.
                Return the feedback in JSON format:
                 {
                    "feedback": "<p>Your concise feedback here</p><p>Another paragraph of feedback here</p>"
                 }
           `;
       try {
            const rawFeedbackResponse = await fetchOpenAIResponse(
               { messages: [{ role: 'system', content: feedbackPrompt }] },
                 '/api/generate'
           );
          const parsedFeedback = parseAiJson(rawFeedbackResponse);
            return parsedFeedback;
       } catch (error) {
           console.error('Failed to generate feedback:', error);
            setErrorMessage('Failed to generate feedback. Please try again.');
           return null;
       }
  };

     const handleActionCardClick = async (card) => {
          setIsButtonDisabled(true)
        setIsFetching(true);

        const feedbackDelay = 1500; // Define delay time

        try {
             const feedback = await generateFeedback(card);
            let feedbackContent = null;

             if (feedback) {
                feedbackContent = feedback.feedback;
                setTimeout(() => {
                   addMessageToHistory(feedbackContent, 'feedback', card.points);
                }, feedbackDelay);
            }
            const updatedMetrics = {};
                if (card.consequences) {
                    const prompt = `
                          Based on the use of "${card.name}" in the context of a BCP, taking into account the current state, apply consequences: "${card.consequences}" to update the following metrics: financialLoss, downtime, employeeMorale, taskCompletion.
                             Return the result in JSON format:
                             {
                                 "metricsChanges": {
                                     "financialLoss": number,
                                     "downtime": number,
                                    "employeeMorale": number,
                                    "taskCompletion": number
                                 }
                             }
                    `;
                   const rawResponse = await fetchOpenAIResponse({
                       messages: [{ role: 'system', content: prompt }],
                    }, '/api/generate', true);
                     const parsed = parseAiJson(rawResponse);
                   if (parsed?.metricsChanges) {
                       Object.assign(updatedMetrics, parsed.metricsChanges)
                   } else {
                       setErrorMessage('Failed to update metrics. Please try again.')
                    }

                }
                Object.assign(updatedMetrics,  {
                     timeElapsed: metrics.timeElapsed
                })
             updateMetrics(updatedMetrics, card.points);
             setActionCards(prevCards => {
                if (prevCards) {
                   return prevCards.map(c => {
                       if (c.name === card.name) {
                            return { ...c, state: 'used'};
                        }
                       return c;
                    })
                }
               return prevCards;
            });

             const outcome = await assessSimulationOutcome();
              if (outcome && outcome.outcome !== 'Partial Success') {
                finalizeSimulation();
                return;
            }

        } catch (error) {
            setErrorMessage(`Failed to apply action card. Please try again. Error: ${error.message}`);
         } finally {
            setIsFetching(false);
             setIsButtonDisabled(false);
             let scaledProgress = (performanceScore / 100) * 100
            if (scaledProgress > 100) {
                scaledProgress = 100
           }
            updateProgress(scaledProgress);
           setCurrentTurnIndex((prev) => prev + 1);
           setPerformanceData((prevData) => [...prevData, { turn: currentTurnIndex, score: performanceScore }])
        }
    };


     //  Update the progress to factor in scores
     const updateProgress = (newProgress) => {
        setProgress(newProgress);
      };
      // Assess the final outcome of the simulation
    const assessSimulationOutcome = async () => {
         const userActionAnalysis = chatHistory.filter(msg => msg.role === 'feedback').map(msg => msg.content).join(' ');
        const outcomeCheckPrompt = `
             Based on the user's actions, evaluate the simulation and the following user action analysis, and determine if the user has achieved their recovery goals, or if the BCP has failed to work effectively. If the user does not complete all of the action cards, return that as "Failure", unless a clear recovery goal has been achieved despite this. If a complete recovery of core business systems, return a "Full Success". Otherwise return "Partial Success".
            The user action analysis: ${userActionAnalysis}
                 Return the result in JSON format:
                 {
                   "outcome": "Full Success" | "Partial Success" | "Failure",
                    "reason": "Your objective justification."
                }
            `;
         try {
            const rawResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: outcomeCheckPrompt }] },
               '/api/generate'
           );
            if (!rawResponse) {
                throw new Error("Received empty response from server.");
            }
           const parsedResponse = parseAiJson(rawResponse);
            return parsedResponse;
          } catch (error) {
            console.error('Failed to assess simulation outcome', error);
             return { outcome: 'Partial Success', reason: 'Failed to assess the outcome. Try again.' };
       }
  };

    const analyzeSimulation = async () => {
        const userRole = bcpScenario.roles.find((r) => r.name === selectedRole);
         const analysisPrompt = `
            Analyze the following BCP simulation transcript, paying special attention to how the user, playing as ${userRole.name}, in the role of the ${userRole.role}, navigated the BCP, and considering their actions in each of the three phases (Immediate Response, Business Recovery, Review and Improvement), using the objectives for each of those phases as criteria for success.
            Evaluate ${userRole.name}’s performance based on several key BCP tactics and provide a score on a scale of 1-10 for each tactic. For each tactic, provide 2-3 specific examples from the transcript to illustrate where ${userRole.name} demonstrated that tactic effectively or ineffectively.
             Provide an overall summary that describes ${userRole.name}’s strategy in the simulation, and specific examples of when they employed those strategies well, or not so well. Start your summary with a sentence directly addressing ${userRole.name}, by name and role, before proceeding to the rest of your summary.
            Provide concise and actionable recommendations to improve ${userRole.name}’s performance in these areas, making the language encouraging.
           Return the result in JSON format with the following structure, ensuring that keys appear in Sentence Case, and recommendations are offered as a string array:
              {
                 "Summary": "string",
                   "Tactics": {
                        "Prioritization": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                        "Problem Solving": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                        "Resource Allocation": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                        "Communication": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                       "Decision Making": { "score": number, "examples": ["string"], "recommendations": ["string"] },
                       "Adaptability": { "score": number, "examples": ["string"], "recommendations": ["string"] }
                     }
               }

            The simulation transcript:
             ${JSON.stringify(chatHistory.filter(msg => msg.role !== 'feedback'), null, 2)}
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
             } else {
                 setErrorMessage('Failed to analyze simulation. Please try again.');
            }
        } catch (error) {
           setErrorMessage('Failed to analyze simulation. Please try again.');
        }
    };

     const generateRecommendation = async () => {
        const userRole = bcpScenario.roles.find((r) => r.name === selectedRole);
        const transcript = chatHistory.filter(msg => msg.role !== 'feedback');
        const analysisPrompt = `
               Given this simulation transcript: "${JSON.stringify(transcript)}", and the context of the scenario: "${bcpScenario.context}", evaluate the user's performance, playing as ${userRole.name}. Provide clear, concise and actionable advice on what specific strategies to improve next time, in the format: "string".
                Return the advice in a single, continuous string.
           `;
        try {
           const rawRecommendationResponse = await fetchOpenAIResponse({
                messages: [{ role: 'system', content: analysisPrompt }],
           }, '/api/generate');
            const parsedRecommendation = parseAiJson(rawRecommendationResponse);
            return parsedRecommendation;
         }
        catch (error) {
            console.error('Failed to generate recommendation:', error);
            return "Try again to find a more clear outcome. Be sure to use a strategic approach to get the outcome you want.";
        }
    }

    const finalizeSimulation = async () => {
        await analyzeSimulation();
       const outcomeData = await assessSimulationOutcome();
        const recommendationData = await generateRecommendation();

        const userStrategyEffectiveness = metricHistory.reduce((acc, metrics) => {
           return acc + metrics.taskCompletion;
        }, 0);

       const totalMessages = actionCards?.length || 0;
         const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 100;
       let outcome = 'Partial Success';

        if (effectivenessScore > 70) {
           outcome = 'Full Success';
        } else if (effectivenessScore < 30) {
            outcome = 'Failure'
        }
         if (outcomeData && recommendationData) {
             const outcome = outcomeData.outcome;
             const outcomeReason = outcomeData.reason

            setDebriefing((prev) => ({
                ...prev,
                strengths:  Object.entries(debriefing.tactics)
                .filter(([, value]) => value.score > 7)
                .map(([key]) => key)  || ['None'],
                areasForImprovement: Object.entries(debriefing.tactics)
                    .filter(([, value]) => value.score < 6)
                     .map(([key]) => key) || ['None'],
                overallScore: Math.round(effectivenessScore),
               letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
                 advice: recommendationData,
                transcript: chatHistory,
                 outcome: outcome,
                outcomeReason: outcomeReason,
                metricsHistory: metricHistory,
            }));
        } else {
            setErrorMessage('Failed to generate a proper summary. Please try again.');
             setDebriefing(null);
       }
       setSimulationComplete(true);
        clearInterval(timerRef.current);
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
        setActionCards(null);
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
       setRadarData(null);
        setPerformanceData([]);
        setPerformanceScore(0)
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

    const renderMetricsAreaChart = () => {
      if (!metricHistory || metricHistory.length === 0) {
            return <p>No metric data available yet.</p>;
        }
        return (
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="financialLossGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="downtimeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="employeeMoraleGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="taskCompletionGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ff7300" stopOpacity={0} />
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="time" label={{ value: "Time Elapsed", position: 'insideBottom', offset: -5 }} />
                   <YAxis label={{ value: 'Metrics', angle: -90, position: 'insideLeft' }} />
                   <Tooltip />
                   <Legend />
                  <Area type="monotone" dataKey="financialLoss" stroke="#8884d8" fill="url(#financialLossGradient)" name="Financial Loss" />
                    <Area type="monotone" dataKey="downtime" stroke="#82ca9d" fill="url(#downtimeGradient)" name="Downtime" />
                   <Area type="monotone" dataKey="employeeMorale" stroke="#ffc658" fill="url(#employeeMoraleGradient)" name="Employee Morale" />
                    <Area type="monotone" dataKey="taskCompletion" stroke="#ff7300" fill="url(#taskCompletionGradient)" name="Task Completion" />
               </AreaChart>
           </ResponsiveContainer>
       );
  };

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-box">
                    <span className="header-title">BCP Simulation</span>
                </div>
                <div className="header-time">
                    <span className="time-label">Time Elapsed:</span>
                    <span className="time-value">
                        {metrics?.timeElapsed ? (
                            <SevenSegmentDisplay value={Math.min(9, Math.round(metrics.timeElapsed / 60))} />
                        ) : (
                           <SevenSegmentDisplay value={0} />
                        )} min
                    </span>
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
                                    simulationComplete ? (
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
                                    currentTurnIndex >= (actionCards?.length || 0)
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
                                                    <div className="metric-box" title={`Financial Loss: $${metrics.financialLoss}`}>
                                                        <span className="metric-label">Financial Loss:</span>
                                                        <span className="metric-value">
                                                           $<SevenSegmentDisplay value={Math.min(9, Math.round(metrics.financialLoss / 1000))} />k
                                                       </span>
                                                   </div>
                                                    <div className="metric-box" title={`Downtime: ${metrics.downtime}%`}>
                                                        <span className="metric-label">Downtime:</span>
                                                       <span className="metric-value">
                                                           <SevenSegmentDisplay value={Math.min(9, Math.round(metrics.downtime / 100))} />%
                                                        </span>
                                                    </div>
                                                    <div className="metric-box" title={`Employee Morale: ${metrics.employeeMorale}`}>
                                                        <span className="metric-label">Employee Morale:</span>
                                                        <span className="metric-value">
                                                           <SevenSegmentDisplay value={Math.min(9, Math.round(metrics.employeeMorale / 10))} />
                                                        </span>
                                                   </div>
                                                   <div className="metric-box" title={`Task Completion: ${metrics.taskCompletion}%`}>
                                                       <span className="metric-label">Task Completion:</span>
                                                        <span className="metric-value">
                                                            <SevenSegmentDisplay value={Math.min(9, Math.round(metrics.taskCompletion / 10))} />%
                                                       </span>
                                                   </div>
                                                </div>
                                                <div className="metrics-chart">
                                                    {renderMetricsAreaChart()}
                                                </div>
                                           </div>
                                             <CardContent className="action-cards-area">
                                                {actionCards && actionCards.map((card, index) => (
                                                   <ActionCard
                                                        key={index}
                                                       card={card}
                                                        onClick={() => handleActionCardClick(card)}
                                                       disabled={isButtonDisabled || isFetching || card.state === 'used'}
                                                      loading={isFetching}
                                                   />
                                               ))}
                                           </CardContent>
                                           <div className="chat-area">
                                           <CardContent className="chat-history-container"  ref={chatHistoryContainerRef}>
                                                <div className="chat-history">
                                                    {chatHistory.map((msg) => (
                                                        <div key={msg.id} className={`chat-message ${msg.role}`}>
                                                            {msg.role === 'feedback' && (
                                                                <div className="feedback-box">
                                                                   <h4 className="feedback-title">
                                                                        <Info className="icon" /> Feedback
                                                                    </h4>
                                                                     <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                                                    <Button onClick={() => dismissFeedback(msg.id)} className="dismiss-button">
                                                                        Dismiss
                                                                    </Button>
                                                                </div>
                                                            )}
                                                             {msg.role !== 'feedback' && (
                                                                <>
                                                                    <div>
                                                                        <strong className="sender-name">Sender:</strong> {msg.name}
                                                                    </div>
                                                                   <div>
                                                                        <strong className="message-timestamp">Time:</strong> {msg.timestamp}
                                                                    </div>
                                                                     <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                                                </>
                                                           )}
                                                       </div>
                                                    ))}
                                                     <div />
                                                </div>
                                                {isFetchingOpponent && (
                                                  <div className="spinner-container"> <BeatLoader color="#0073e6" size={8} />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </div>
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
                                         <div style={{ width: '100%', height: 300 }}>
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
                                           <strong>Strengths:</strong>{' '}
                                            {debriefing.strengths  && debriefing.strengths.length > 0 ? (
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
                                            <strong>Areas for Improvement:</strong>{' '}
                                             {debriefing.areasForImprovement  && debriefing.areasForImprovement.length > 0 ? (
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
                                       {showTranscript && (<div className="transcript">
                                            <h5>Full Transcript:</h5>
                                            {debriefing.transcript
                                                  .filter(msg => msg.role === 'user' || msg.role === 'feedback')
                                                .map((msg, index) => (
                                                    <div key={index}>
                                                      <strong>{msg.name}:</strong> <div dangerouslySetInnerHTML={{ __html: msg.content }} />
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