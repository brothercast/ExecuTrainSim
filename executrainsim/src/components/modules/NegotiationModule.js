import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import SlotMachineText from '../effects/SlotMachineText';
import { Info, ChevronLeft, ChevronRight, RefreshCw, SendHorizontal, CheckSquare, Square, Edit, Save } from 'lucide-react';
import { BarLoader, BeatLoader } from 'react-spinners';
import '../../styles/AppStyles.css';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

// Define API Base URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const IMAGE_API_URL = process.env.REACT_APP_IMAGE_API_URL || 'http://localhost:5001';

// Define negotiation types with titles
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

// Timestamp logic for messages
let lastTimestamp = new Date();
const generateSequentialTimestamp = () => {
    const newTimestamp = new Date(lastTimestamp.getTime() + 5 * 60 * 1000);
    lastTimestamp = newTimestamp;
    const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
    return newTimestamp.toLocaleTimeString('en-US', options);
};

// Helper function to generate random delays
const getRandomDelay = () => Math.floor(Math.random() * (9000 - 4000 + 1)) + 4000;

// Parse JSON response from API
const parseAiJson = (apiResponse) => {
    if (!apiResponse) {
        console.error('parseAiJson: No response data to parse.');
        return null;
    }

    try {
        if (typeof apiResponse === 'string') {
            const cleaned = apiResponse.replace(/```json|```/g, '').trim();
            return JSON.parse(cleaned);
        }
        return apiResponse;
    } catch (err) {
        console.error('Failed to parse AI JSON:', err, apiResponse);
        return null;
    }
};

const NegotiationModule = ({ onReturn }) => {
    const [negotiationType, setNegotiationType] = useState('');
    const [negotiationSubType, setNegotiationSubType] = useState('');
    const [customOutcomeInput, setCustomOutcomeInput] = useState('');
    const [desiredOutcome, setDesiredOutcome] = useState('');
        const [userFinalOutcome, setUserFinalOutcome] = useState('');
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
    const [imageStatus, setImageStatus] = useState('idle');
    const [responseOptions, setResponseOptions] = useState([]);
    const [negotiationStarted, setNegotiationStarted] = useState(false);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(1);
     const [isFetchingScenario, setIsFetchingScenario] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isUserTurn, setIsUserTurn] = useState(true);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [isUserReplyLoading, setIsUserReplyLoading] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isResponseLoading, setIsResponseLoading] = useState(false);
    const [radarData, setRadarData] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
     const [scenarioGenerated, setScenarioGenerated] = useState(false);
    const [buttonRevealComplete, setButtonRevealComplete] = useState(true);
    const [customScenarioInput, setCustomScenarioInput] = useState('');
    const [isCustomInputMode, setIsCustomInputMode] = useState(false);
        const [isScenarioEditable, setIsScenarioEditable] = useState(false);
     const [editableScenario, setEditableScenario] = useState(null);

      const selectedRoleObject = scenario?.roles?.find((role) => role.name === selectedRole);

        const chatHistoryContainerRef = useRef(null);
         useEffect(() => {
             console.log("useEffect for scrolling triggered, chatHistory length:", chatHistory.length);
             const chatHistoryDiv = chatHistoryContainerRef.current;
             if (chatHistoryDiv) {
                 console.log("chatHistoryContainerRef.current is:", chatHistoryDiv);
                 chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
                 console.log("Scrolled to bottom, scrollHeight:", chatHistoryDiv.scrollHeight, "scrollTop:", chatHistoryDiv.scrollTop);
             } else {
                 console.log("chatHistoryContainerRef.current is null");
             }
         }, [chatHistory]);

    const handleRoleChange = (newRole) => {
        setNegotiationRole(newRole);
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
        setErrorMessage('');
        generateImage(title, context);
    };

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
            if(error.response) {
                console.error('API Error Details:', error.response.data);
            }
            setErrorMessage('Failed to communicate with the server. Please check the console for details.');
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
              if(negotiationType === 'custom'){
                   setIsCustomInputMode(true);
                   return;
               }

            const selectedType = negotiationTypes.find((type) => type.value === negotiationType)?.title;
            const selectedSubType = negotiationSubTypes[negotiationType]?.find(
                (subType) => subType === negotiationSubType
            );

            if (!selectedType) {
                setErrorMessage('Please select a negotiation type.');
                return;
            }
            setErrorMessage('');
            const subType = selectedSubType
            const prompt = `
              Create a ${selectedType} negotiation scenario${subType ? ` with a focus on ${subType}` : ''}.
              Provide a detailed description of the scenario, including the context,
              two distinct roles with realistic names, and their respective objectives.
              Ensure that the roles have conflicting objectives to drive negotiation dynamics.
              Include potential challenges each role might face.
              Generate 4-6 role-agnostic desired outcomes based on the context.
              Respond empathetically and adaptively to user tone and style.
              Return the scenario in JSON with the format:
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
                setEditableScenario(parsedScenario.scenario);
                setSimulationComplete(false);
                setScenarioGenerated(true);
                await generateImage(parsedScenario.scenario.title, parsedScenario.scenario.context);

            } else {
                setErrorMessage('Failed to generate scenario. Please try again.');
            }
        } catch (error) {
            console.error('generateScenario Error:', error);
            setErrorMessage('An error occurred while generating the scenario.');
        }
    };
      const handleCustomScenarioSubmit = async () => {
        setIsFetchingScenario(true);
      try {
         const prompt = `
             Create a custom negotiation scenario based on the following user input: ${customScenarioInput}.
              Provide a detailed description of the scenario, including the context,
              two distinct roles with realistic names, and their respective objectives.
              Ensure that the roles have conflicting objectives to drive negotiation dynamics.
              Include potential challenges each role might face.
              Generate 4-6 role-agnostic desired outcomes based on the context.
              Respond empathetically and adaptively to user tone and style.
              Return the scenario in JSON with the format:
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
          if(parsedScenario?.scenario){
             setScenario(parsedScenario.scenario);
              setRoles(parsedScenario.scenario.roles.map((r) => r.name));
             setEditableScenario(parsedScenario.scenario);
                setSimulationComplete(false);
              setScenarioGenerated(true);
                 await generateImage(parsedScenario.scenario.title, parsedScenario.scenario.context);
            }
              else {
                setErrorMessage('Failed to generate custom scenario. Please try again.');
            }
        }
        catch (error) {
           console.error('generateScenario Error:', error);
            setErrorMessage('An error occurred while generating the custom scenario.');
        }
          finally{
              setIsFetchingScenario(false);
             setIsCustomInputMode(false);
           }
  };
    const handleScenarioEditToggle = () => {
         setIsScenarioEditable(!isScenarioEditable);
    };
     const handleScenarioChange = (field, value) => {
        setEditableScenario(prev => ({
            ...prev,
            [field]: value
        }));
    };
     const handleSaveScenario = () => {
        // Update the scenario with edited values
         setScenario(editableScenario);
         setIsScenarioEditable(false);
    }

    const startNegotiation = async () => {
        if (!selectedRole || (!desiredOutcome && !customOutcomeInput)) {
            setErrorMessage('Please select a role and desired outcome.');
            return;
        }

             setNegotiationStarted(true);
            setErrorMessage('');

             if(desiredOutcome === 'Custom Outcome' && customOutcomeInput){
                    setUserFinalOutcome(customOutcomeInput)
                } else {
                     setUserFinalOutcome(desiredOutcome)
                 }

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
        As ${opponentRole.name}, in your role as "${opponentRole.role}", provide a very short, direct message to ${userRole.name} to begin the negotiation, which represents the opening point in your negotiation strategy.
        The message should not be a long email and should be appropriate for a chat interface, and should represent the first of the points you wish to negotiate. Use a familiar yet professional tone that reflects the context: "${scenario.context}".
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
                tone: 'friendly, casual, and lighthearted',
                complexity: 'simple negotiation tactics, often making concessions',
                strategy: 'accommodating and quick to compromise, focus on common ground',
                reactivity: 'responds positively to user\'s points, often conceding or agreeing, seeks harmony and common ground. Uses casual, friendly language and humor to build rapport.',
            },
            medium: {
                tone: 'professional, but still friendly and relatable',
                complexity: 'standard negotiation strategies, sometimes challenges user but ultimately seeking mutual benefit',
                strategy: 'firm but fair, seeking mutual benefit, will defend points well',
                reactivity: 'responds directly to the user’s points, maintains a strong position, uses balanced responses that take both positions into account. Uses relatable and friendly language.',
            },
            hard: {
                tone: 'strategic, but still relatable and somewhat challenging',
                complexity: 'advanced negotiation tactics, uses strategic framing of arguments',
                strategy: 'aggressive, aiming for maximum advantage, not open to compromise initially',
                reactivity: 'challenges user’s points using their own arguments, remains steadfast, and is difficult to persuade, seeks to dominate the conversation, but will concede some ground if there is a strong reason. May use playful challenges or teasing.',
            },
            expert: {
                tone: 'highly strategic, and can be challenging or manipulative',
                complexity: 'complex and multifaceted negotiation strategies, often uses psychological tactics',
                strategy: 'ruthless, prioritizing own interests, will use psychological tactics to sway the user',
                 reactivity: 'attempts to dominate the conversation, actively undermines the user’s points, will not concede without a major benefit, and seeks to exploit any weakness. Can use sarcasm or put downs.',
            },
        };
        const settings = difficultySettings[difficulty] || difficultySettings['medium'];
        const chatHistoryString = chatHistory.map(msg => `${msg.name}: ${msg.content}`).join("\n");

        return `
            You are ${opponent.name}, the ${opponent.role} in a ${scenario.type} negotiation (${scenario.subType}).
            Your goal is to ${opponent.objective}.
             Engage in a conversational style typical of roommates discussing a pet. Use casual, colloquial language, avoiding overly formal phrases.
             Do not use conversational filler or rephrase previous statements too frequently. Vary your sentence structure and word choice to prevent repetitive phrases.
            Maintain a ${settings.tone} tone and employ ${settings.complexity} and utilize the strategy of being ${settings.strategy}.
            **You will analyze the user's last message and address the key points they have raised, responding to the specifics of their argument. The difficulty level indicates your flexibility in this response, with an 'easy' opponent being more likely to concede and an 'expert' opponent being more likely to challenge each point.**
            Keep your responses concise and directly address the points raised by ${player.name}.
            Do not reveal your negotiation strategy or desired outcome explicitly.
            Base your responses solely on the conversation history provided, and do not repeat points already addressed:

            ${chatHistoryString}

        `;
    };

    const generateResponseOptions = async (context) => {
          if (!selectedRole || (!desiredOutcome && !customOutcomeInput)) {
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
        const prompt = generateUserResponsePrompt(strategyDescription, userRole, opponentRole)
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

      const generateUserResponsePrompt = (strategyDescription, userRole, opponentRole) => {
            return `
            As ${userRole.name}, respond to ${opponentRole.name} using the strategy: "${strategyDescription}".
            In the context of the negotiation: "${scenario.context}", provide a short, direct, and professional message, appropriate for a chat interface (like Teams or Slack).
            Focus on moving the negotiation forward by making thoughtful replies that consider the opponent's points of view.
              Use casual, relatable language that reflects how roommates would talk to each other.
             Avoid overly formal language, filler, or unnecessary greetings.
            Your goal is to find common ground, not simply reiterate your own position.
              Return the response in JSON format:
            {
                "message": "Your concise message here"
            }
        `;
        }

   // Updated addMessageToHistory function to store feedback separately
const addMessageToHistory = (content, role, feedback = null) => {
    const roleName = role === 'user' ? selectedRole : scenario?.roles.find((r) => r.name !== selectedRole)?.name || 'Unknown';
    const newMessage = {
        content,
        role,
        name: roleName,
        timestamp: generateSequentialTimestamp(),
        id: Date.now(),
        feedback: feedback,
        feedbackVisible: false,
    };
    console.log("addMessageToHistory: adding message: ", newMessage);
    setChatHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, newMessage];
        return updatedHistory;
    });
};
    const getLatestMessage = (role) => {
       return chatHistory.filter((msg) => msg.role === role).slice(-1)[0]?.content || '';
    };

      const createResponseOptionsPrompt = (context, latestOpponentMessage, previousUserMessage) => `
        Based on the ongoing negotiation for the scenario: ${context},
        consider the latest opponent message: "${latestOpponentMessage}"
        and the user's previous message: "${previousUserMessage}".
        Generate four strategic response options, each representing a different high-level negotiation tactic or strategy that the user could employ.
         Each option should describe a general approach the user could take, not specific messages or phrases.
        Consider the different negotiation tactics and strategies like:
        - Value-Based Approach: Focus on the value that your service offers, rather than just focusing on price.\n        - Anchoring:  Set the tone of the negotiation and establish your desired outcome by suggesting an initial number or point that is beneficial to you.\n        - Concessions: Show flexibility by offering something of value in return for something else of value to you.\n        - Delaying: Slow down the negotiation to give yourself time to think and to create a sense of urgency for the other party.\n        - Information Gathering: Ask pointed questions that help you to understand the other party's needs and limitations.\n        - Collaboration: Build mutual trust and find common ground in the negotiation.\n         - Highlighting Success: Show past successful projects to increase confidence in your ability to deliver in this project.\n        Return the response in the JSON format:\n        {\n            "options": [{ "name": "string", "description": "string" }]\n        }\n    `;

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
            setIsSpinning(false);
          } else {
              console.error('Invalid response structure:', parsed);
             setErrorMessage('Failed to generate response options. Please try again.');
          }
   };
    const generateFeedback = async (userMessage) => {
       const userRole = scenario.roles.find((r) => r.name === selectedRole);
            const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);

            const feedbackPrompt = `
            Analyze the user's message: "${userMessage}" as ${userRole.name} in the role of ${userRole.role}, in the context of the current negotiation, with a focus on negotiation tactics.
             Consider the opponent's position as ${opponentRole.name} in the role of ${opponentRole.role}.
            Provide feedback to the user on the effectiveness of their message and what they did well or not so well, considering also whether their message was appropriate for a conversation between roommates.
            Focus on how the user could improve in the future by exploring common ground and advancing the negotiation goals, or by being more emotionally responsive.
            Keep your feedback encouraging and focus on strategic communication and negotiation tactics.
            Return the feedback in JSON format:
            {
               "feedback": "Your concise feedback here"
            }
        `;
        try {
            const rawFeedbackResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: feedbackPrompt }], temperature: 0.7, max_tokens: 500 },
                '/api/generate'
            );
             const parsedFeedback = parseAiJson(rawFeedbackResponse);
           return parsedFeedback?.feedback;
      } catch (error) {
            console.error('Failed to generate feedback:', error);
           setErrorMessage('Failed to generate feedback. Please try again.');
           return null;
       }
    };

   // Updated generateOpponentResponse function
const generateOpponentResponse = async (lastUserMessage) => {
    try {
        const userRole = scenario.roles.find((r) => r.name === selectedRole);
        const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);
        if (!userRole || !opponentRole) {
            throw new Error('Roles not correctly set.');
        }
        const systemPrompt = generateOpponentSystemPrompt(scenario, userRole, opponentRole, opponentDifficulty, chatHistory);

         const opponentPrompt = `
            As ${opponentRole.name}, in the role of ${opponentRole.role}, respond to ${userRole.name} in the negotiation. The message must be short and to the point, fitting for a chat interface, and should address the tone and content of the user's last message: "${lastUserMessage}". Also, utilize the system prompt you were provided to maintain consistency. Return the message in JSON with the format: { "message": "string" }.
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
            throw new Error('Opponent response is empty or invalid JSON.');
        }
        return finalMessage.trim();
    } catch (error) {
        console.error('Failed to generate opponent response:', error);
         setErrorMessage('Failed to generate opponent response. Please try again.');
         return null;
    }
};

    const sendUserReply = async () => {
      if (!userDraft.trim()) {
          setErrorMessage('Please type a reply before sending.');
           return;
        }
        setErrorMessage('');

       const feedback = showFeedback ? await generateFeedback(userDraft) : null;
       addMessageToHistory(userDraft, 'user', feedback);
        setUserDraft('');
         setProgress((prev) => prev + 20);
         setCurrentTurnIndex((prev) => prev + 1);
        setIsUserTurn(false);
        setIsFetching(true);

        const delay = getRandomDelay();
          const animationDelay = delay * 0.25;
        setTimeout(() => {
            setIsFetchingOpponent(true);
        }, animationDelay);


        setTimeout(async () => {
           const opponentMessageContent = await generateOpponentResponse(userDraft);
           if (opponentMessageContent) {
                 addMessageToHistory(opponentMessageContent, 'opponent');
            } else {
               console.error("Opponent message is null or undefined.");
              setErrorMessage('Failed to generate opponent message.');
          }
            setIsUserTurn(true);
             setIsFetchingOpponent(false);
             await generateResponseOptions(scenario?.context)
            if (progress >= 100) {
                finalizeSimulation();
            }
             setIsFetching(false);
       }, delay);
    };

    const dismissFeedback = (messageId) => {
        setChatHistory((prevHistory) =>
            prevHistory.map((msg) =>
                msg.id === messageId
                    ? { ...msg, feedbackVisible: false }
                    : msg
            )
        );
        setFeedbackVisible(false);
    };

    const handleButtonAnimationComplete = () => {
        setButtonRevealComplete(true);
    };

     const toggleFeedback = () => {
        setShowFeedback(!showFeedback);
    };

   const handleFeedbackClick = (messageId) => {
        setChatHistory(prevHistory =>
            prevHistory.map(msg =>
                msg.id === messageId
                    ? { ...msg, feedbackVisible: !msg.feedbackVisible }
                    : msg
            )
        );
    };
   const assessNegotiationOutcome = async () => {
    if(!userFinalOutcome) {
            return { outcome: 'Draw', reason: 'No desired outcome was selected.' };
        }
      const userMessages = chatHistory.filter(msg => msg.role === 'user').map(msg => msg.content).join(' ');
       const outcomeCheckPrompt = `
        Based on the user's negotiation messages: "${userMessages}", and the context of the negotiation, including the desired outcome of "${userFinalOutcome}", determine if the user has likely achieved their goal or if the negotiation has ended without a clear win. Return the result in JSON format:
        {
            "outcome": "Win" | "Lose" | "Draw",
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
           return parsedResponse
        }
        catch (error) {
             console.error('Failed to assess negotiation outcome', error);
             return { outcome: 'draw', reason: 'Failed to assess the outcome. Try again.' };
        }
     };

   const analyzeNegotiation = async () => {
       const userRole = scenario.roles.find((r) => r.name === selectedRole);
            const analysisPrompt = `
                Analyze the following negotiation transcript, paying special attention to how the user, playing as ${userRole.name}, in the role of the ${userRole.role}, navigated the negotiation.
                Evaluate ${userRole.name}’s performance based on several key negotiation tactics and provide a score on a scale of 1-10 for each tactic.
                For each tactic, provide 2-3 specific examples from the transcript to illustrate where ${userRole.name} demonstrated that tactic effectively or ineffectively.
                Provide an overall summary that describes ${userRole.name}’s strategy in the negotiation, and specific examples of when they employed those strategies well, or not so well. Start your summary with a sentence directly addressing ${userRole.name}, by name and role, before proceeding to the rest of your summary.
                Provide concise and actionable recommendations to improve ${userRole.name}’s performance in these areas, making the language encouraging.
                Return the result in JSON format with the following structure, ensuring that keys appear in Sentence Case, and recommendations are offered as a string array:
                 {
                     "Summary": "string",
                     "Tactics": {
                          "Assertiveness": { "score": number, "examples": [\"string\"], "recommendations": [\"string\"] },
                          "Adaptability": { "score": number, "examples": [\"string\"], "recommendations": [\"string\"] },
                          "Empathy\": { "score": number, "examples": [\"string\"], "recommendations": [\"string\"] },
                         "Strategic Thinking": { "score": number, "examples": [\"string\"], "recommendations": [\"string\"] },
                         "Communication": { "score": number, "examples": [\"string\"], "recommendations": [\"string\"] },
                          "Compromise": { "score": number, "examples": [\"string\"], "recommendations": [\"string\"] }
                     }
                 }
            The negotiation transcript:
                ${JSON.stringify(chatHistory.filter(msg => !msg.feedback), null, 2)}
              `;
           try {
                const rawAnalysisResponse = await fetchOpenAIResponse({
                    messages: [{ role: 'system', content: analysisPrompt }],
                }, '/api/generate');
                 const parsedAnalysis = parseAiJson(rawAnalysisResponse);
                  if (parsedAnalysis) {
                    console.log('Parsed Analysis:', parsedAnalysis)
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

                    setRadarData(radarData)
                     return formattedAnalysis;
                } else {
                    setErrorMessage('Failed to analyze negotiation. Please try again.');
                    return null;
                }
         } catch (error) {
              setErrorMessage('Failed to analyze negotiation. Please try again.');
            console.error('Error analyzing negotiation:', error);
            return null;
        }
     };
    const finalizeSimulation = async () => {
         const outcomeData = await assessNegotiationOutcome();
         const analysisData = await analyzeNegotiation()

         const userStrategyEffectiveness = chatHistory.reduce((acc, msg) => {
            if (msg.role === 'user') {
                return acc + 1;
            }
           return acc;
        }, 0);
          const totalMessages = chatHistory.length;
        const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 100;

        if(analysisData && outcomeData){
             const outcome = outcomeData.outcome;
             const outcomeReason = outcomeData.reason;
              setDebriefing((prev) => ({
                ...prev,
                strengths: analysisData.Tactics ? Object.entries(analysisData.Tactics)
                    .filter(([, value]) => value.score > 7)
                     .map(([key]) => key) : ['None'],
                areasForImprovement:  analysisData.Tactics ? Object.entries(analysisData.Tactics)
                    .filter(([, value]) => value.score < 6)
                     .map(([key]) => key) : ['None'],
                overallScore: Math.round(effectivenessScore),
                letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
               advice: outcome === 'Win' ? 'Continue refining your strategies. Your approach was effective in this negotiation.':  outcome === 'Lose' ? 'Consider revising your approach for better results. Take a closer look at the areas needing improvement.': 'Try again to find a more clear outcome. Be sure to use a strategic approach to get the outcome you want.',
                 transcript: chatHistory,
                outcome: outcome,
                 outcomeReason: outcomeReason,
                   summary: analysisData.Summary,
                   tactics: analysisData.Tactics
            }));

        } else {
           setErrorMessage('Failed to generate a proper summary. Please try again.');
            setDebriefing(null);
        }
        setSimulationComplete(true);
    };
    const resetNegotiation = () => {
      setScenario(null);
       setRoles(['Role 1', 'Role 2']);
        setSelectedRole('');
         setCustomOutcomeInput('');
       setChatHistory([]);
        setUserDraft('');
        setProgress(0);
        setSimulationComplete(false);
         setDebriefing(null);
       setErrorMessage('');
       setImages({});
        setNegotiationStarted(false);
         setScenarioGenerated(false);
        setCurrentTurnIndex(1);
       setRadarData(null)
        setResponseOptions([]);
        setButtonRevealComplete(true)
          setShowFeedback(false);
         setIsScenarioEditable(false);
        setEditableScenario(null)
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
                                      <>
                                          {isCustomInputMode ? (
                                             <span>Custom Negotiation Setup</span>
                                         ) : (
                                              <span>Negotiation Setup</span>
                                         )}
                                        </>
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
                                         <h3 style={{ position: 'relative' }}>{scenario.title}
                                                </h3>
                                       <div style={{ position: 'relative' }}>
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
                                            <strong>Desired Outcome:</strong> {userFinalOutcome}
                                         </p>
                                       {scenario && images[0] && (
                                           <img
                                               src={images[0]}
                                               alt="Scenario Illustration"
                                                className="scenario-image"
                                                style={{marginTop: '10px', width: '100%'}}
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
                                            <CardContent className="chat-history-container" ref={chatHistoryContainerRef}>
                                                <div className="chat-history">
                                                    {chatHistory.map((msg, index) => (
                                                        <div
                                                            key={msg.id}
                                                             className={`chat-message ${msg.role}`}
                                                             style={{display: 'block'}}
                                                           >
                                                            {msg.role !== 'feedback' && (
                                                                <>
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
                                                                          {msg.content?.split('\n').map((line, i) => (
                                                                              <p key={i}>{line}</p>
                                                                         ))}
                                                                      </div>
                                                                  </>
                                                            )}
                                                            {msg.role === 'user' && msg.feedback && (
                                                                 <Info
                                                                     className={`feedback-icon ${msg.feedbackVisible ? 'feedback-active' : ''}`}
                                                                       onClick={() => handleFeedbackClick(msg.id)}
                                                                   />
                                                            )}
                                                              { msg.feedback && msg.feedbackVisible && (
                                                                  <div className="feedback-bubble">
                                                                       <div className="info-icon-container">
                                                                          <Info className="icon" />
                                                                        </div>
                                                                        {msg.feedback.split('\n').map((line, i) => (
                                                                             <p key={i}>{line}</p>
                                                                         ))}
                                                                        <Button onClick={() => dismissFeedback(msg.id)} className="dismiss-button">
                                                                             Dismiss
                                                                        </Button>
                                                                    </div>
                                                              )}
                                                          </div>
                                                    ))}
                                                    <div />
                                                </div>
                                                {isFetchingOpponent && (
                                                   <div className="spinner-container">
                                                      <BeatLoader color="#0073e6" size={8}/>
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
                                                                 className={`response-button ${isResponseLoading ? 'loading' : ''}`}
                                                             >
                                                                <SlotMachineText
                                                                    text={option.name}
                                                                     isSpinning={isResponseLoading}
                                                                    revealSpeed={100}
                                                                    standardizedSize={true}
                                                                    onComplete={handleButtonAnimationComplete}
                                                                />
                                                            </Button>
                                                      ))}
                                                    </div>
                                                </div>
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
                                                 {isResponseLoading && (
                                                     <div className="spinner-container">
                                                     </div>
                                                )}

                                                 <div className="user-input-container">
                                                       <div style={{display: 'flex', flexGrow: 1, alignItems: 'center'}}>
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
                                                               Send <SendHorizontal style={{marginLeft: '8px'}}/>
                                                            </Button>
                                                     </div>
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
                                                            {isFetching && <BarLoader color="#0073e6" width="100%" />}
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
                                                                    <option value="Custom Outcome">Custom Outcome</option>
                                                               </select>
                                                            </div>
                                                                {desiredOutcome === 'Custom Outcome' && (
                                                                    <div className="form-group">
                                                                         <label>Enter your custom outcome</label>
                                                                           <textarea
                                                                              value={customOutcomeInput}
                                                                           onChange={(e) => setCustomOutcomeInput(e.target.value)}
                                                                          placeholder="Describe what you want to achieve in this simulation.
                                                                            "
                                                                        className="custom-outcome-input"
                                                                           />
                                                                   </div>
                                                              )}
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
                                         {!isCustomInputMode ? (
                                          <>
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
                                             </>
                                        ) : (
                                            <>
                                                 <div className="form-group">
                                                     <label>Enter your custom negotiation scenario</label>
                                                     <textarea
                                                            value={customScenarioInput}
                                                          onChange={(e) => setCustomScenarioInput(e.target.value)}
                                                             placeholder="Describe a custom negotiation scenario, including the people and situations you want to simulate."
                                                           className="custom-scenario-input"
                                                      />
                                                 </div>

                                                {isScenarioEditable ? (
                                                  <>
                                                      <div className="scenario-edit-fields">
                                                            <label>Edit Scenario Title</label>
                                                             <input
                                                                 type="text"
                                                                 value={editableScenario.title}
                                                                    onChange={(e) => handleScenarioChange('title', e.target.value)}
                                                                  className="editable-scenario-title"
                                                              />
                                                         <label>Edit Scenario Context</label>
                                                            <textarea
                                                                value={editableScenario.context}
                                                               onChange={(e) => handleScenarioChange('context', e.target.value)}
                                                               className="editable-scenario-context"
                                                           />
                                                       </div>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
                                                             <Button onClick={handleSaveScenario}>
                                                                  Save <Save style={{ marginLeft: '8px'}}/>
                                                            </Button>
                                                          </div>
                                                  </>
                                               ) : null}
                                              </>
                                       )}

                                       { !isCustomInputMode ? (
                                           <Button onClick={generateScenario} disabled={isFetching}>
                                               {isFetching ? 'Generating...' : 'Generate Scenario'}
                                             </Button>
                                          ) : (
                                               <Button onClick={handleCustomScenarioSubmit} disabled={isFetchingScenario}>
                                                  {isFetchingScenario ? 'Generating Custom Scenario...' : 'Generate Custom Scenario'}
                                              </Button>
                                        )
                                       }
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
                                                    This graph illustrates your scores in several key negotiation tactics. The higher the score, the better you demonstrated that tactic.
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
                                               <strong>Recommendations:</strong> {debriefing.advice}
                                          </p>
                                           <Button onClick={() => setShowTranscript(!showTranscript)}>
                                             {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                                            </Button>
                                             {showTranscript && (
                                               <div className="transcript">
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
    component: NegotiationModule
};

export default NegotiationModule;