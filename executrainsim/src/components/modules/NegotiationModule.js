import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import SlotMachineText from '../effects/SlotMachineText';
import Select, { SelectItem } from '../ui/Select';
import { Info, Star, ChevronLeft, ChevronRight, Menu, RefreshCw, SendHorizontal  } from 'lucide-react';
import { BarLoader, GridLoader, BeatLoader } from 'react-spinners';
import '../../styles/AppStyles.css';
//import '../../styles/NegotiationModule.css';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const IMAGE_API_URL = process.env.REACT_APP_IMAGE_API_URL || 'http://localhost:5001';

const negotiationTypes = [
    { value: 'contract', title: 'Contract/Service Agreement' },
    { value: 'credit', title: 'Credit/Lending' },
    { value: 'divorce', title: 'Divorce/Family Settlement' },
    { value: 'employment', title: 'Employment/Termination Package' },
    { value: 'freelance', title: 'Freelance/Independent Contractor' },
    { value: 'healthcare', title: 'Healthcare/Medical Billing' },
    { value: 'housing', title: 'Housing/Rental Agreement' },
    { value: 'intellectual_property', title: 'Intellectual Property' },
    { value: 'mergers_acquisitions', title: 'Mergers & Acquisitions' },
    { value: 'partnership', title: 'Partnership/Joint Venture' },
    { value: 'real_estate', title: 'Real Estate Transactions' },
    { value: 'supplier', title: 'Supplier/Vendor Agreement' },
    { value: 'technology', title: 'Technology Licensing' },
    { value: 'custom', title: 'Custom Area' }
];

const negotiationSubTypes = {
    contract: [
        'Consulting Agreement',
        'Employment Contract',
        'Joint Venture Agreement',
        'Licensing Agreement',
        'Non-Disclosure Agreement',
        'Service Level Agreement',
        'Terms of Service',
        'Work for Hire Agreement'
    ],
    credit: [
        'Business Loan',
        'Credit Card Agreement',
        'Debt Settlement',
        'Line of Credit',
        'Mortgage',
        'Personal Loan'
    ],
    divorce: [
        'Alimony Agreement',
        'Child Custody',
        'Child Support',
        'Mediation Agreements',
        'Property Division',
        'Visitation Rights'
    ],
    employment: [
        'Equity Compensation',
        'Performance Bonus',
        'Relocation Package',
        'Remote Work Agreement',
        'Salary Negotiation',
        'Termination Settlement'
    ],
    freelance: [
        'Confidentiality Terms',
        'Copyright Ownership',
        'Milestone Deadlines',
        'Payment Terms',
        'Project Scope',
        'Retainer Agreements'
    ],
    healthcare: [
        'Billing Dispute',
        'Insurance Claims',
        'Medical Debt Forgiveness',
        'Medical Service Fees',
        'Out-of-Network Coverage',
        'Telehealth Policy',
        'Treatment Authorization'
    ],
    housing: [
        'Lease Renewal',
        'Maintenance Responsibilities',
        'Rent Increase',
        'Security Deposit',
        'Subletting Agreements',
        'Tenant Rights'
    ],
    intellectual_property: [
        'Copyright Infringement',
        'Intellectual Asset Valuation',
        'Patent Licensing',
        'Royalty Agreements',
        'Trade Secret Protection',
        'Trademark Dispute'
    ],
    mergers_acquisitions: [
        'Anti-Compete Agreements',
        'Asset Purchase',
        'Buyout Clauses',
        'Due Diligence Agreements',
        'Merger Terms',
        'Stock Purchase'
    ],
    partnership: [
        'Equity Split',
        'Exit Strategy',
        'Partnership Dissolution',
        'Profit Sharing',
        'Responsibility Allocation',
        'Voting Rights'
    ],
    real_estate: [
        'Development Contracts',
        'Easement Rights',
        'Lease Agreement',
        'Mortgage Terms',
        'Property Sale',
        'Zoning Disputes'
    ],
    supplier: [
        'Bulk Order',
        'Delivery Schedule',
        'Exclusive Supplier Agreements',
        'Payment Terms',
        'Quality Standards',
        'Termination Clauses'
    ],
    technology: [
        'API Access Terms',
        'AI Model License',
        'Data Privacy Agreement',
        'Maintenance and Support',
        'SaaS Subscription Terms',
        'Service Contract',
        'Software License'
    ],
    
};
  
let lastTimestamp = new Date();  
const generateSequentialTimestamp = () => {  
  const newTimestamp = new Date(lastTimestamp.getTime() + 5 * 60 * 1000);  
  lastTimestamp = newTimestamp;  
  const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };  
  return newTimestamp.toLocaleTimeString('en-US', options);  
};  

const getRandomDelay = () => Math.floor(Math.random() * (9000 - 4000 + 1)) + 4000;


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

const NegotiationModule = ({ onReturn }) => {  
  const [negotiationType, setNegotiationType] = useState('');  
  const [negotiationSubType, setNegotiationSubType] = useState('');  
  const [desiredOutcome, setDesiredOutcome] = useState('');  
  const [opponentDifficulty, setOpponentDifficulty] = useState('medium');  
  const [scenario, setScenario] = useState(null);  
  const [roles, setRoles] = useState(['Role 1', 'Role 2']);  
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
  const [negotiationStarted, setNegotiationStarted] = useState(false);  
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


  
  // NEW STATE VARIABLE
  const [scenarioGenerated, setScenarioGenerated] = useState(false);
  const [buttonRevealComplete, setButtonRevealComplete] = useState(true);

  
  const MAX_TOTAL_TOKENS = 4096;  
  const MIN_RESPONSE_TOKENS = 150;  
  
  const selectedRoleObject = scenario?.roles?.find((role) => role.name === selectedRole);  
  
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatHistory.length > 0) {
      setCurrentTurnIndex(Math.floor(chatHistory.length / 2) + 1);
    }
  }, [chatHistory]);
 
  
  const fetchOpenAIResponse = async (input, endpointPath, isUserAction = false) => {  
    setIsFetching(true);  
     if(isUserAction){
        setIsUserReplyLoading(true)
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
      if(isUserAction){
        setIsUserReplyLoading(false)
      } else{
        setIsFetchingOpponent(false);
      }
     
      setIsFetching(false);  
    }  
  };  
  
  const generateScenario = async () => {  
    try {  
      const selectedType = negotiationTypes.find((type) => type.value === negotiationType)?.title;  
      const selectedSubType = negotiationSubTypes[negotiationType]?.find(  
        (subType) => subType === negotiationSubType  
      );  
  
      if (!selectedType) {  
        setErrorMessage('Please select a negotiation type.');  
        return;  
      }  
  
      setErrorMessage('');  
  
      const prompt = `  
        Create a ${selectedType} negotiation scenario${selectedSubType ? ` with a focus on ${selectedSubType}` : ''}.  
        Provide a detailed description of the scenario, including the context,  
        two distinct roles with realistic names, and their respective objectives.  
        Ensure that the roles have conflicting objectives to drive negotiation dynamics.  
        Include potential challenges each role might face.  
        Generate 4-6 role-agnostic desired outcomes based on the context.  
        Respond empathetically and adaptively to user tone and style.  
        Return the scenario as JSON with the format:  
        {  
          "scenario": {  
            "title": "string",  
            "context": "string",  
            "roles": [  
              { "name": "string", "role": "string", "objective": "string" }  
            ],  
            "desiredOutcomes": ["string"]  
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
        setRoles(parsedScenario.scenario.roles.map((r) => r.name));  
        setSimulationComplete(false);
        setScenarioGenerated(true); // Set the scenario generated flag
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
    const prompt = `Illustrate the negotiation scenario titled "${title}" with context: "${context}". The illustration should resemble colorful, writing-free, diverse universal stock art from the 1990s with simple, clean lines and a focus on clarity.`;  
  
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
    setErrorMessage(''); // Clear the error message  
    generateImage(title, context); // Retry generating the image  
  };  
  
  const startNegotiation = async () => {  
    if (!selectedRole || !desiredOutcome) {  
      setErrorMessage('Please select a role and desired outcome.');  
      return;  
    }  
    setNegotiationStarted(true);  
    setErrorMessage('');  
  
    try {  
      const userRole = scenario.roles.find((r, index) => roles[index] === selectedRole);  
      const opponentRole = scenario.roles.find((r, index) => roles[index] !== selectedRole);  
  
      if (!userRole || !opponentRole) {  
        throw new Error('Roles not correctly set or not found.');  
      }  
  
      const opponentObjectivePrompt = `  
        Generate a specific objective for the role of ${opponentRole.role} in the context of the negotiation.  
        Return your answer in JSON with the format:  
        {  
          "opponentObjective": "string"  
        }  
      `;  
  
      const rawObjectiveResponse = await fetchOpenAIResponse(  
        { messages: [{ role: 'system', content: opponentObjectivePrompt }], temperature: 0.7, max_tokens: 150 },  
        '/api/generate'  
      );  
  
      const parsedObjective = parseAiJson(rawObjectiveResponse);  
      const opponentObjective = parsedObjective?.opponentObjective || 'Negotiate effectively.';  
      opponentRole.objective = opponentObjective;  
  
      const openingPrompt = `  
        As ${opponentRole.name}, in your role as "${opponentRole.role}", provide a very short, direct opening message to ${userRole.name} to start the negotiation titled "${scenario.title}".  
        The message should set the stage for negotiation and be appropriate for a chat interface, and not a long email. Use a familiar yet professional tone that reflects the context: "${scenario.context}".  
         Return the response in JSON format: { "message": "string" }  
      `;  
  
      const rawOpeningResponse = await fetchOpenAIResponse(  
        { messages: [{ role: 'system', content: openingPrompt }], temperature: 0.7, max_tokens: 500 },  
        '/api/generate'  
      );  
  
      const parsedOpening = parseAiJson(rawOpeningResponse);  
      const opponentMessageContent = parsedOpening?.message || 'Unable to fetch opening message.';  
  
      addMessageToHistory(opponentMessageContent, 'opponent');  
      setProgress(20);  
  
      generateResponseOptions(scenario?.context);  
    } catch (error) {  
      console.error('Error generating opening message:', error);  
      setErrorMessage('Failed to generate the opponent’s opening message. Please try again.');  
    }  
  };  
  
  const updateRoles = (newRole, index) => {  
    const newRoles = [...roles];  
    newRoles[index] = newRole;  
    setRoles(newRoles);  
  
    if (scenario) {  
      scenario.roles[index].name = newRole;  
    }  
  };  
  
    const generateOpponentSystemPrompt = (scenario, player, opponent, difficulty, chatHistory) => {
        const difficultySettings = {
            easy: {
                tone: 'friendly and cooperative',
                complexity: 'simple negotiation tactics',
                strategy: 'accommodating and willing to compromise',
            },
            medium: {
                tone: 'professional and assertive',
                complexity: 'standard negotiation strategies',
                strategy: 'firm but fair, seeking mutual benefit',
            },
            hard: {
                tone: 'strategic and challenging',
                complexity: 'advanced negotiation tactics',
                strategy: 'aggressive, aiming for maximum advantage',
            },
            expert: {
                tone: 'highly strategic and relentless',
                complexity: 'complex and multifaceted negotiation strategies',
                strategy: 'ruthless, prioritizing own interests',
            },
        };

        const settings = difficultySettings[difficulty] || difficultySettings['medium'];
        const chatHistoryString = chatHistory.map(msg => `${msg.name}: ${msg.content}`).join("\n");

        return `
            You are ${opponent.name}, the ${opponent.role} in a ${scenario.type} negotiation (${scenario.subType}).
            Your goal is to ${opponent.objective}.
            Maintain a ${settings.tone} tone and employ ${settings.complexity} and utilize the strategy of being ${settings.strategy}.
            Do not use conversational filler or rephrase previous statements too frequently. Vary your sentence structure and word choice to prevent repetitive phrases. 
            Keep your responses concise and directly address the points raised by ${player.name}.
            Do not reveal your negotiation strategy or desired outcome explicitly.
            Base your responses solely on the conversation history provided:
            
            ${chatHistoryString}

        `;
    };
  
  const generateResponseOptions = async (context) => {  
    if (!selectedRole || !desiredOutcome) {  
      console.warn('Selected role or desired outcome not set. Skipping response option generation.');  
      return;  
    }  
  
    const latestOpponentMessage = getLatestMessage('opponent');  
    const previousUserMessage = getLatestMessage('user');  
  
    const prompt = createResponseOptionsPrompt(context, latestOpponentMessage, previousUserMessage);  
  
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
    const userRole = scenario.roles.find((r) => r.name === selectedRole);  
    const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);  
  
    const prompt = createUserResponsePrompt(strategyDescription, userRole, opponentRole);  
  
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
        : scenario?.roles.find((r) => r.name !== selectedRole)?.name || 'Unknown';

    setChatHistory((prevHistory) => [
      ...prevHistory,
      { content, role, name: roleName, timestamp: generateSequentialTimestamp() },
    ]);
    scrollToBottom(); 
  };
  
  const getLatestMessage = (role) => {  
    return chatHistory.filter((msg) => msg.role === role).slice(-1)[0]?.content || '';  
  };  
  
    const createResponseOptionsPrompt = (context, latestOpponentMessage, previousUserMessage) => `  
        Based on the ongoing negotiation for the scenario: ${context},  
        consider the latest opponent message: "${latestOpponentMessage}"  
        and the user's previous message: "${previousUserMessage}".  
        Generate four strategic response options that the user could employ.  
        Each option should describe a strategic approach or tactic the user could take.  
        Return the response in the JSON format:  
        {  
            "options": [{ "name": "string", "description": "string" }]  
        }  
    `;
  
    const createUserResponsePrompt = (strategyDescription, userRole, opponentRole) => `
        Draft a concise and professional response for ${userRole.name} to ${opponentRole.name}, based on the strategy: "${strategyDescription}". 
        The message should be direct and relevant to the negotiation context: "${scenario.context}".
        Please return the response in JSON format as shown below:
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
        setButtonRevealComplete(false);
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
            const userRole = scenario.roles.find((r) => r.name === selectedRole);
            const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);

            if (!userRole || !opponentRole) {
                throw new Error('Roles not correctly set.');
            }

            const systemPrompt = generateOpponentSystemPrompt(scenario, userRole, opponentRole, opponentDifficulty, chatHistory);
            const lastUserMessage = chatHistory.filter((msg) => msg.role === 'user').slice(-1)[0]?.content || '';

            const opponentPrompt = `
            As ${opponentRole.name}, in the role of ${opponentRole.role}, respond to ${userRole.name} in the negotiation: "${scenario.title}". The message must be short and to the point, fitting for a chat interface, and should address the tone and content of the user's last message: "${lastUserMessage}".  Also, utilize the system prompt you were provided to maintain consistency. Return the message in JSON with the format: { "message": "string" }.
          `;

            const rawResponse = await fetchOpenAIResponse(
                {
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: opponentPrompt }, // Removed role: 'system' to use the system prompt as a persona
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
                throw new Error('Opponent response is empty or invalid JSON.');
            }

            return finalMessage.trim();
        } catch (error) {
            console.error('Failed to generate opponent response:', error);
            setErrorMessage('Failed to generate opponent response. Please try again.');
            return null;
        }
    };
  
  const getRandomDelay = () => Math.floor(Math.random() * (9000 - 4000 + 1)) + 4000;  
  
  const chatEndRef = useRef(null);

  const sendUserReply = async () => {
      if (!userDraft.trim()) {
        setErrorMessage('Please type a reply before sending.');
        return;
      }

      setErrorMessage('');
      addMessageToHistory(userDraft, 'user');
      setUserDraft('');
      setProgress((prev) => prev + 20);
      setCurrentTurnIndex((prev) => prev + 1);

      setIsUserTurn(false);
      setIsFetching(true);

      // Get the delay time
      const delay = getRandomDelay();
      const animationDelay = delay * 0.25;

      // Start loader animation
      setTimeout(() => {
        setIsFetchingOpponent(true);
      }, animationDelay);

      // Send Response
      setTimeout(async () => {
        const opponentMessageContent = await generateOpponentResponse();
        if (opponentMessageContent) {
          addMessageToHistory(opponentMessageContent, 'opponent');
        }
        setIsUserTurn(true);
        setIsFetchingOpponent(false);
          await generateResponseOptions(scenario?.context) // Regenerate response options here
        if (progress >= 100) {
          finalizeSimulation();
        }
        setIsFetching(false);
      }, delay);
    };
    
    const handleButtonAnimationComplete = () => {
        setButtonRevealComplete(true);
    };
  
   const analyzeNegotiation = async () => {
        const analysisPrompt = `
            Analyze the following negotiation transcript and provide an in-depth analysis, with a focus on the user's performance based on negotiation tactics.
             Evaluate the user’s performance based on several key negotiation tactics and provide a score on a scale of 1-10 for each tactic.
            Provide an overall summary that describes the user’s strategy in the negotiation, and specific examples of when they employed those strategies well, or not so well.
            Be sure to note specific instances in the dialogue to back up your findings.
             Return the result in JSON format with the following structure:
            {
                "summary": "string",
                "tactics": {
                    "Assertiveness": number,
                    "Adaptability": number,
                    "Empathy": number,
                    "Strategic Thinking": number,
                    "Communication": number,
                     "Compromise": number
                }
            }
           
            The negotiation transcript:
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
               setErrorMessage('Failed to analyze negotiation. Please try again.');
            }

        } catch (error) {
             setErrorMessage('Failed to analyzenegotiation. Please try again.');
            console.error('Error analyzing negotiation:', error);
            return null;
        }
    };

  
  const finalizeSimulation = async () => {
        await analyzeNegotiation()
        const userStrategyEffectiveness = chatHistory.reduce((acc, msg) => {
            if (msg.role === 'user') {
                return acc + 1;
            }
            return acc;
        }, 0);

        const totalMessages = chatHistory.length;
        const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 100;
        let outcome = 'Draw';

        if (effectivenessScore > 70) {
            outcome = 'Win';
        } else if (effectivenessScore < 30) {
            outcome = 'Lose';
        }
          setDebriefing((prev) => ({
            ...prev,
            strengths: userStrategyEffectiveness > 0 ? ['Adaptability', 'Persistence'] : ['Quick Adaptation'],
            areasForImprovement: ['Clarity', 'Conciseness'],
            overallScore: Math.round(effectivenessScore),
             letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
             advice: outcome === 'Win' ? 'Continue refining your strategies.' : 'Consider revising your approach for better results.',
               transcript: chatHistory,
               outcome: outcome
        }));

        setSimulationComplete(true);
    };
  
  const resetNegotiation = () => {  
    setScenario(null);  
    setRoles(['Role 1', 'Role 2']);  
    setSelectedRole('');  
    setChatHistory([]);  
    setUserDraft('');  
    setProgress(0);  
    setSimulationComplete(false);  
    setDebriefing(null);  
    setErrorMessage('');  
    setImages({});  
    setNegotiationStarted(false);
     setScenarioGenerated(false); // Reset the scenario generated flag
     setCurrentTurnIndex(1);
      setRadarData(null)
       setResponseOptions([]);
         setButtonRevealComplete(true)
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
  
return (
  <div className="app-container">
    <header className="app-header">
      <div className="header-box">
        <span className="header-title">Negotiation Challenge</span>
      </div>
    </header>

    <main className="content-grid">
      <aside className="left-column">
        {/* CONDITIONAL RENDERING OF STEP BOX HERE */}
        {scenario && (
          <div className="step-box">
            <ChevronLeft
              onClick={goToPreviousTurn}
              className={`nav-arrow ${
                currentTurnIndex <= 1 && simulationComplete ? 'disabled' : ''
              }`}
              title="Previous Turn"
            />
            <span className="step-text">
              {negotiationStarted ? (
                simulationComplete ?
(
  <span>Negotiation Complete</span>
) : (
  <span>Turn {currentTurnIndex}</span>
)
) : (
<span>Negotiation Setup</span>
)}
</span>
{negotiationStarted && simulationComplete && (
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
{negotiationStarted && scenario ? (
<div>
<div className="scenario-info">
  <h3>{scenario.title}</h3>
  <div>
    {scenario.context.split('\n').map((line, i) => (
      <p key={i}>{line}</p>
    ))}
  </div>
  <div className="role-info">
    <strong>Your Role:</strong>
    <div className="role-details">
      {selectedRoleObject
        ? `${selectedRoleObject.name} - ${selectedRoleObject.role}`
        : 'Role not selected'}
    </div>
  </div>
  <p>
    <strong>Desired Outcome:</strong> {desiredOutcome}
  </p>
  {scenario && images[0] && (
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
{scenario && images[0] ? (
  <img
    src={images[0]}
    alt="Scenario Illustration"
    className="scenario-image"
  />
) : (
  <img
    src="../images/NegotiationModule.png"
    alt="Scenario Illustration"
    className="scenario-image"
  />
)}
{!scenario && (
  <div className="module-description">
    <h2>Negotiation Simulator</h2>
    <p>
      Welcome to the Negotiation Simulator, where you will engage
      in a strategic battle of wits against an intelligent
      opponent. Your objective is to navigate the negotiation
      process and achieve your desired outcome while considering
      the goals of the other party.
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
{scenario && !negotiationStarted && (
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
            scenario ? (
               <Card className="scenario-card">
                {negotiationStarted ? (
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
                                disabled={isResponseLoading || !buttonRevealComplete}
                                className={`response-button ${
                                    isResponseLoading ? 'loading' : ''
                                }`}
                            >
                              <SlotMachineText
                                  text={option.name}
                                  isSpinning={isResponseLoading}
                                    revealSpeed={50}
                                  standardizedSize={true}
                                    onComplete={handleButtonAnimationComplete}
                                />
                            </Button>
                        ))}
                    </div>
                    </div>
                    {isResponseLoading && (
                      <div className="spinner-container">
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
                              e.preventDefault(); // Prevent newline
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
                      <CardTitle>{scenario.title}</CardTitle>
                      <div className="spinner-container">
                        {isFetching && (
                          <BarLoader color="#0073e6" width="100%" />
                        )}
                      </div>
                      <div>
                        {scenario.context.split('\n').map((line, i) => (
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
                                {`${role} - ${scenario.roles[index].role}`}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Select your desired outcome</label>
                        <select
                          onChange={(e) => setDesiredOutcome(e.target.value)}
                          value={desiredOutcome}
                        >
                          <option value="">Choose outcome</option>
                          {scenario.desiredOutcomes.map((outcome, index) => (
                            <option key={index} value={outcome}>
                              {outcome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Select opponent difficulty level</label>
                        <select
                          onChange={(e) =>
                            setOpponentDifficulty(e.target.value)
                          }
                          value={opponentDifficulty}
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <Button
                        onClick={() => {
                          startNegotiation();
                          setShowInstructions(false);
                        }}
                        className="start-button"
                      >
                        Start Negotiation
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
                  <label>Select negotiation type</label>
                  <select
                    onChange={(e) => setNegotiationType(e.target.value)}
                    value={negotiationType}
                  >
                    <option value="">Choose negotiation type</option>
                    {negotiationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.title}
                      </option>
                    ))}
                  </select>
                </div>
                {negotiationSubTypes[negotiationType] && (
                  <div className="form-group">
                    <label>Select negotiation subtype</label>
                    <select
                      onChange={(e) => setNegotiationSubType(e.target.value)}
                      value={negotiationSubType}
                    >
                      <option value="">Choose negotiation subtype</option>
                      {negotiationSubTypes[negotiationType].map(
                        (subType, index) => (
                          <option key={index} value={subType}>
                            {subType}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
                <Button onClick={generateScenario}>Generate Scenario</Button>
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
                <Button onClick={resetNegotiation}>
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
title: 'Negotiation Simulator',  
description: 'Flex your negotiation skills against a skilled opponent.',  
imageUrl: '../images/NegotiationModule.png',  
instructions: `  
<h2>Gameplay Overview</h2>  
<p>Welcome to the Negotiation Simulator, where you will engage in a strategic battle of wits against an intelligent opponent. Your objective is to navigate the negotiation process and achieve your desired outcome while considering the goals of the other party.</p>  
<h3>Simulation Mechanism</h3>  
<p>The simulation is driven by dynamic, AI-generated scenarios. Once you select a negotiation type and role, you'll enter a dialogue with the opponent. Each turn, you can choose from several strategic response options or draft a custom reply to guide the negotiation in your favor.</p>  
<p>The AI opponent will respond based on the context and previous dialogue, adapting its strategy to challenge your decisions. Your task is to anticipate their moves, counter their tactics, and steer the negotiation towards your desired outcome.</p>  
<h3>Outcome and Debriefing</h3>  
<p>At the conclusion of the simulation, you will receive a detailed debriefing. This includes a summary of the negotiation, feedback on your strengths and areas for improvement, an overall score, and recommendations for future negotiations. Use this feedback to refine your skills and prepare for real-world scenarios.</p>  
`,  
component: NegotiationModule,  
};  

export default NegotiationModule;