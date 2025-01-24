import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import SlotMachineText from '../effects/SlotMachineText';
import Select, { SelectItem } from '../ui/Select';
import { Info, Star, ChevronLeft, ChevronRight, Menu, RefreshCw, SendHorizontal, Bell, CheckSquare, Square, Edit, Save, X, ArrowUp, ArrowDown, Circle, CircleDot, ArrowLeft, ArrowRight, Activity, Layout, MessageSquare, UserCheck, Users, Flag, MessageCircle, Hand, Lightbulb, Swords, HandCoins, HandHeart, LandPlot, Speech, Handshake } from 'lucide-react';
import { BarLoader, GridLoader, BeatLoader } from 'react-spinners';
import '../../styles/AppStyles.css';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import DOMPurify from 'dompurify';

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
    { value: 'custom', title: 'Custom Area' } // Added custom area
];

// Define negotiation subtypes for different types
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

const logMessage = (message, data) => {
    console.log(`[DEBUG] ${message}:`, data);
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
            try {
                return JSON.parse(cleaned);
            } catch (parseError) {
                console.log("Recommendation returned a string")
                return apiResponse
            }
        }
        return apiResponse; // Assume it's already parsed
    } catch (err) {
        console.error('Failed to parse AI JSON:', err, apiResponse);
        return null;
    }
};

// Main Negotiation Module Component
const NegotiationModule = ({ onReturn }) => {
    // State variables
    const [negotiationType, setNegotiationType] = useState('');
    const [negotiationSubType, setNegotiationSubType] = useState('');
    const [desiredOutcome, setDesiredOutcome] = useState('');
    const [customOutcomeInput, setCustomOutcomeInput] = useState('');
    const [opponentDifficulty, setOpponentDifficulty] = useState('medium');
    const [scenario, setScenario] = useState(null);
    const [roles, setRoles] = useState(['Role 1', 'Role 2']);
    const [selectedRole, setSelectedRole] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [userDraft, setUserDraft] = useState('');
    const [performanceScore, setPerformanceScore] = useState(0);
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
    const [performanceData, setPerformanceData] = useState([]);
    const [showFeedback, setShowFeedback] = useState(true);
    const [feedbackMessage, setFeedbackMessage] = useState(null);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedbackTargetId, setFeedbackTargetId] = useState(null);
    const [scenarioGenerated, setScenarioGenerated] = useState(false);
    const [buttonRevealComplete, setButtonRevealComplete] = useState(true);
    const [customScenarioInput, setCustomScenarioInput] = useState('');
    const [isCustomInputMode, setIsCustomInputMode] = useState(false);
    const [isScenarioEditable, setIsScenarioEditable] = useState(false);
    const [editableScenario, setEditableScenario] = useState(null);
    const [customSetupStage, setCustomSetupStage] = useState('selection');
     const [opponentPersonality, setOpponentPersonality] = useState('balanced');
    const [opponentPersonalitySetting, setOpponentPersonalitySetting] = useState({
        collaborative: {
            tone: 'friendly, casual, and lighthearted',
            complexity: 'simple negotiation tactics, often making concessions',
            strategy: 'accommodating and quick to compromise, focus on common ground',
            reactivity: 'responds positively to user\'s points, often conceding or agreeing, seeks harmony and common ground. Uses casual, friendly language and humor to build rapport.',
        },
        slightlyCollaborative: {
            tone: 'generally friendly and accommodating but occasionally firm',
             complexity: 'simple negotiation tactics with some strategic thinking, and less often making concessions',
            strategy: 'mostly accommodating but will attempt to get a slightly better deal, while focusing on common ground',
            reactivity: 'responds generally positively to user\'s points, will occasionally concede or agree, seeks harmony and common ground. Uses relatable, and friendly language.',
        },
        balanced: {
            tone: 'professional, but still friendly and relatable',
            complexity: 'standard negotiation strategies, sometimes challenges user but ultimately seeking mutual benefit',
            strategy: 'firm but fair, seeking mutual benefit, will defend points well',
            reactivity: 'responds directly to the user’s points, maintains a strong position, uses balanced responses that take both positions into account. Uses relatable and friendly language.',
        },
         slightlyAggressive: {
           tone: 'assertive but generally respectful with occasional challenges',
            complexity: 'standard negotiation strategies with some advanced tactics, sometimes challenges user directly',
            strategy: 'prioritizes own interests but also seeks mutual benefit, often challenges user’s points but will sometimes concede without a major benefit',
            reactivity: 'responds directly to the user’s points, but will sometimes aggressively undermine the user’s points, occasionally conceding without a major benefit, and sometimes seeks to exploit any weakness, using challenging but respectful language.',
        },
        aggressive: {
            tone: 'highly assertive, sometimes combative',
            complexity: 'advanced negotiation tactics, often uses challenging statements',
            strategy: 'prioritizes own interests, will use direct challenges and put downs',
            reactivity: 'attempts to dominate the conversation, actively undermines the user’s points, will not concede without a major benefit, and seeks to exploit any weakness. Can use sarcasm or put downs.',
        },

    });
     const [progress, setProgress] = useState(0);

    // Get the selected role object for easy access
    const selectedRoleObject = scenario?.roles?.find((role) => role.name === selectedRole);

    // Ref for scrolling chat history
    const chatHistoryContainerRef = useRef(null);
    // Define scoring constants
    const WIN_THRESHOLD = 2
    const LOSE_THRESHOLD = -2
    const MAX_SCORE = 4
    const MIN_SCORE = -4

      // Function to convert HTML-like <p> tags to line breaks
      const convertParagraphsToLineBreaks = (htmlString) => {
        if (!htmlString) return '';
        try {
            // Use a DOMParser to handle proper HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            const paragraphs = doc.querySelectorAll('p');
            let text = '';
            paragraphs.forEach((p, index) => {
                text += p.textContent;
                if (index < paragraphs.length - 1) {
                    text += '\n';
                }
            });
            return text;
        } catch (e) {
            // Fallback if DOMParser fails or if input is already plain text
            console.warn('Error parsing HTML-like string:', e);
             return htmlString.replace(/<p>|<\/p>/g, '').replace(/<br\s*\/?>/gi, '\n');
         }
    };

     // Function to convert line breaks back to <p> tags
    const convertLineBreaksToParagraphs = (text) => {
        if (!text) return '';
       const paragraphs = text
         .split('\n')
           .map(paragraph => paragraph.trim())
         .filter(paragraph => paragraph !== '')
         .map(paragraph => `<p>${paragraph}</p>`)
         .join('');
     return paragraphs;
    };

       const handleKeyDown = (event) => {
        if (event.key === 'Enter' && event.shiftKey) {
          // Allow line breaks with Shift + Enter
        } else if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault(); // Prevent new line
           sendUserReply();
        }
      };


    // addMessageToHistory function (Modified)
    const addMessageToHistory = (content, role, scores) => {
        const roleName = role === 'user' ? selectedRole : scenario?.roles.find((r) => r.name !== selectedRole)?.name || 'Unknown';
        const sanitizedContent = DOMPurify.sanitize(content);
        const newMessage = {
            content: sanitizedContent,
            role,
            name: roleName,
            timestamp: generateSequentialTimestamp(),
            id: Date.now(),
            feedbackVisible: false,
            scores: scores,
        };

        setChatHistory((prevHistory) => {
            const updatedHistory = [...prevHistory, newMessage];
            // After setting the state, we trigger the scroll
            if (chatHistoryContainerRef.current)
                chatHistoryContainerRef.current.scrollTop = chatHistoryContainerRef.current.scrollHeight;
            return updatedHistory
        });
    };


    // Handler for changes to selected role
    const handleRoleChange = (newRole) => {
        setNegotiationRole(newRole);
    };

    // Handler for the Opponent Personality Slider
    const handleOpponentPersonalityChange = (event) => {
        const index = parseInt(event.target.value, 10);
        const personalityKeys = Object.keys(opponentPersonalitySetting);
        setOpponentPersonality(personalityKeys[index]);
    };


    const getOpponentPersonalitySettings = (personality) => {
        return opponentPersonalitySetting[personality] || opponentPersonalitySetting['balanced'];
    };

    // Function to generate Dalle Image
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

    // Function to retry image generation
    const retryImageGeneration = (title, context) => {
        setErrorMessage('');
        generateImage(title, context);
    };

    // Generic function to fetch responses from API
    const fetchOpenAIResponse = async (input, endpointPath, isUserAction = false) => {
        setIsFetching(true);
        if (isUserAction) {
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
            if (error.response) {
                console.error('API Error Details:', error.response.data);
            }
            setErrorMessage('Failed to communicate with the server. Please check the console for details.');
            return null;
        } finally {
            if (isUserAction) {
                setIsUserReplyLoading(false)
            } else {
                setIsFetchingOpponent(false);
            }

            setIsFetching(false);
        }
    };

    // Function to generate initial negotiation scenario
    const generateScenario = async () => {
        try {
            if (negotiationType === 'custom') {
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
                Include a simple goal as a singular value that the user can achieve.
              Generate 4-6 role-agnostic desired outcomes based on the context.
              Respond empathetically and adaptively to user tone and style.
              Return the scenario in JSON with the format:
              {
                  "scenario": {
                      "title": "string",
                       "goal": "number",
                      "context": "<p>string</p><p>string</p>...",
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
                setScenarioGenerated(true); // Set the scenario generated flag
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
               Include a simple goal as a singular value that the user can achieve.
              Generate 4-6 role-agnostic desired outcomes based on the context.
              Respond empathetically and adaptively to user tone and style.
               Return the scenario in JSON with the format:
              {
                  "scenario": {
                      "title": "string",
                       "goal": "number",
                      "context": "<p>string</p><p>string</p>...",
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
                setScenarioGenerated(true); // Set the scenario generated flag
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
        finally {
            setIsFetchingScenario(false);
            setCustomSetupStage('results');
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
        // Remove <p> tags and convert new lines to paragraphs
        const cleanedContext = editableScenario.context
            .replace(/<p>|<\/p>/g, '')
            .split('\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph !== '')
            .map(paragraph => `<p>${paragraph}</p>`)
            .join('');

        // Update the scenario with edited values
        setEditableScenario(prev => ({
            ...prev,
            context: cleanedContext
        }));
        setScenario(prev => ({
            ...prev,
            context: cleanedContext,
            title: editableScenario.title
        }));

        setIsScenarioEditable(false);
    };

    // Function to start the negotiation by getting the initial messages
    const startNegotiation = async () => {
        if (!selectedRole || !desiredOutcome) {
            setErrorMessage('Please select a role and desired outcome.');
            return;
        }
        if (desiredOutcome === 'custom' && !customOutcomeInput.trim()) {
            setErrorMessage("Please enter a custom outcome")
            return
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
          As ${opponentRole.name}, in your role as "${opponentRole.role}", provide a direct and specific opening message to ${userRole.name} to start the negotiation.
          This message must include a concrete offer (or initial demand), and a deadline, to clearly establish the negotiation parameters upfront.
          Include a specific value/term/price that would be acceptable to you, and a time-bound constraint.
          The message should set the stage for negotiation and be appropriate for a chat interface, and not a long email. Use a familiar yet professional tone that reflects the context: "${scenario.context}".
           Return the response in JSON format: { "message": "<p>string</p><p>string</p>..." }
       `;

            const rawOpeningResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: openingPrompt }], temperature: 0.7, max_tokens: 500 },
                '/api/generate'
            );
            const parsedOpening = parseAiJson(rawOpeningResponse);
            const opponentMessageContent = parsedOpening?.message || 'Unable to fetch opening message.';
            const initialScore = 0
            addMessageToHistory(opponentMessageContent, 'opponent', initialScore);
            let scaledProgress = ((performanceScore - MIN_SCORE ) / (MAX_SCORE - MIN_SCORE)) * 100;
            if (scaledProgress > 100) {
                scaledProgress = 100
            }
            if (scaledProgress < 0) {
              scaledProgress = 0;
            }
            setProgress(scaledProgress);
            generateResponseOptions(scenario?.context);
        } catch (error) {
            console.error('Error generating opening message:', error);
            setErrorMessage('Failed to generate the opponent’s opening message. Please try again.');
        }
    };
    // Function to update the roles in the state
    const updateRoles = (newRole, index) => {
        const newRoles = [...roles];
        newRoles[index] = newRole;
        setRoles(newRoles);

        if (scenario) {
            scenario.roles[index].name = newRole;
        }
    };

    // Generate prompt for opponent
    const generateOpponentSystemPrompt = (scenario, player, opponent, difficulty, chatHistory) => {
        const settings = getOpponentPersonalitySettings(opponentPersonality);
        const chatHistoryString = chatHistory.map(msg => `${msg.name}: ${msg.content}`).join("\n");
          if (!scenario || !player || !opponent) {
              console.error('System prompt lacks required parameters.');
              return ''; // or some other default prompt, or throw an error
          }

        return `
            You are ${opponent.name}, the ${opponent.role} in a ${scenario.type} negotiation (${scenario.subType}).
            Your goal is to ${opponent.objective}. You are negotiating with ${player.name} who is in the role of ${player.role}.
             Engage in a conversational style typical of roommates discussing a pet. Use casual, colloquial language, avoiding overly formal phrases.
             Do not use conversational filler or rephrase previous statements too frequently. Vary your sentence structure and word choice to prevent repetitive phrases.
            Maintain a ${settings.tone} tone and employ ${settings.complexity} and utilize the strategy of being ${settings.strategy}.
           **When starting a new negotiation, always offer a concrete proposal to begin negotiation as your first message. This should be a specific and measurable offer related to the type of negotiation**. You must include a deadline. This does not apply to any response messages, only the first one.
            **You will analyze the user's last message and address the key points they have raised, responding to the specifics of their argument. The difficulty level indicates your flexibility in this response, with an 'easy' opponent being more likely to concede and an 'expert' opponent being more likely to challenge each point.**
            Keep your responses concise and directly address the points raised by ${player.name}.
            Do not reveal your negotiation strategy or desired outcome explicitly.
            Base your responses solely on the conversation history provided, and do not repeat points already addressed:

             ${chatHistoryString}
        `;
    };

    // Generate response options for the user
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

    // Function to get the latest message for a particular role
    const getLatestMessage = (role) => {
        return chatHistory.filter((msg) => msg.role === role).slice(-1)[0]?.content || '';
    };
    // Generate user response based on selected strategy
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
                "message": "<p>Your concise message here</p><p>And another paragraph here</p>"
            }
        `;
    }

    // Create prompt for response options
    const createResponseOptionsPrompt = (context, latestOpponentMessage, previousUserMessage) => `
        Based on the ongoing negotiation for the scenario: ${context},
        consider the latest opponent message: "${latestOpponentMessage}"
        and the user's previous message: "${previousUserMessage}".
        Generate four strategic response options, each representing a different high-level negotiation tactic or strategy that the user could employ.
         Each option should describe a general approach the user could take, not specific messages or phrases.
          The response options should be general negotiation strategies or tactics such as the following:
           - Counter Offer
           - Ask for More
           - Play Hardball
           - Concede
           - Collaboration
           - Delay
           - Bargain
           - Emotional Appeal
           - Information Gathering
            - Value-Based Approach
          Do not mention specific numbers or phrases.  Focus on high level strategies.
        Return the response in the JSON format:\\n        {\n            "options": [{ "name": "string", "description": "string" }]\n        }\n    `;
    // Handle user message API response
    const handleUserResponse = (rawResponse) => {
        const parsed = parseAiJson(rawResponse);
        if (parsed?.message) {
            const messageWithLineBreaks = convertParagraphsToLineBreaks(parsed.message);
            setUserDraft(messageWithLineBreaks);
        } else {
            setErrorMessage('Failed to generate user draft. Please try again.');
        }
    };
    // Handle error
    const handleError = (message, error) => {
        console.error(message, error);
        setErrorMessage(message);
    };
    // Handles response option API response
    const handleResponseOptions = (rawResponse) => {
        if (!rawResponse) {
            console.error('Received empty response from API.');
            setErrorMessage('Failed to generate response options. Please try again.');
            return;
        }

        const parsed = parseAiJson(rawResponse);
        if (parsed?.options) {
            console.log('Generated response options:', parsed.options