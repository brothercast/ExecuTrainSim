import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import SlotMachineText from '../effects/SlotMachineText';
import axios from 'axios';
import Select, { SelectItem } from '../ui/Select';
import {
  Info, Star, ChevronLeft, ChevronRight, Menu, RefreshCw,
  SendHorizontal, Bell, CheckSquare, Square, Edit, Save, X,
  ArrowUp, ArrowDown, Circle, CircleDot, ArrowLeft, ArrowRight,
  Activity, Layout, MessageSquare, UserCheck, Users, Flag,
  MessageCircle, Hand, Lightbulb, Swords, HandCoins, HandHeart,
  LandPlot, Speech, Handshake
} from 'lucide-react';
import { BarLoader, GridLoader, BeatLoader } from 'react-spinners';
import '../../styles/AppStyles.css';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';
import DOMPurify from 'dompurify';

// Define API Base URLs
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');
console.log('[NegotiationModule] API_BASE_URL at runtime:', API_BASE_URL);

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

  // If the response is a string, remove any leading/trailing triple-backticks and optional language identifier.
  if (typeof apiResponse === 'string') {
    // Remove any leading "```json" (or "```") and trailing "```"
    const cleaned = apiResponse
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error('parseAiJson: Failed to parse cleaned string as JSON:', parseError);
      console.log('parseAiJson: Raw cleaned content:', cleaned);
      return cleaned; // Return the raw string as a fallback
    }
  }

  // If the response is an object with a choices array (the ChatGPT API style), extract the content.
  if (
    apiResponse.choices &&
    Array.isArray(apiResponse.choices) &&
    apiResponse.choices.length > 0 &&
    apiResponse.choices[0].message &&
    apiResponse.choices[0].message.content
  ) {
    const messageContent = apiResponse.choices[0].message.content;
    // If messageContent is a string, remove triple-backticks and parse it.
    if (typeof messageContent === 'string') {
      const cleaned = messageContent
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      try {
        return JSON.parse(cleaned);
      } catch (error) {
        console.error('parseAiJson: Failed to parse choices message content as JSON:', error);
        console.log('parseAiJson: Raw cleaned content:', cleaned);
        return cleaned; // fallback to raw content
      }
    }
    return messageContent; // If it's already an object, return it.
  }

  // Otherwise, assume the response is already in the correct format.
  return apiResponse;
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
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
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
  //New state tracking aiPerformanceValues

  const [aiPerformanceValues, setAiPerformanceValues] = useState({
    Assertiveness: 0,
    Flexibility: 0,
    Empathy: 0,
    'Strategic Planning': 0,
    'Clarity of Communication': 0,
    'Collaborative Problem Solving': 0,
  });

  const [progress, setProgress] = useState(50); // 50% initially (score = 0)
  // New state for tooltip positioning
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });


  // Get the selected role object for easy access
  const selectedRoleObject = scenario?.roles?.find((role) => role.name === selectedRole);

  // Ref for scrolling chat history
  const chatHistoryContainerRef = useRef(null);

  // Effect to auto-scroll to bottom when chatHistory updates
  useEffect(() => {
    if (chatHistoryContainerRef.current) {
      chatHistoryContainerRef.current.scrollTop = chatHistoryContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

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

  // addMessageToHistory function (Ensures single message per add)
  const addMessageToHistory = (content, role, scores) => {
    const roleName = role === 'user' ? selectedRole :
      (scenario?.roles.find((r) => r.name !== selectedRole)?.name || 'Unknown');
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

    console.log(`[addMessageToHistory] Adding message - Role: ${role}, Content: ${content.substring(0, 20)}...`);

    setChatHistory((prevHistory) => [...prevHistory, newMessage]);
  };

  // Handler for changes to selected role
  const handleRoleChangeHandler = (newRole) => {
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
      const endpoint = `${API_BASE_URL}/api/dalle/image`;

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
    // Now fullRequestURL will be "http://localhost:8080/api/generate" in dev.
    const fullRequestURL = `${API_BASE_URL}/api/generate`;
    console.log('[DEBUG] Requesting Full URL:', fullRequestURL, 'with payload:', input);
    try {
      const response = await fetch(fullRequestURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!response.ok) {
        const message = `HTTP error! status: ${response.status}`;
        console.error('Error fetching from OpenAI:', message);
        return null;
      }
      const data = await response.json();
      console.log('Response received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching from OpenAI:', error.message);
      return null;
    }
  };

  const generateScenario = async () => {
    setIsLoadingScenario(true); // Start spinner
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
      console.log("Parsed Scenario:", parsedScenario);

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
    } finally {
      setIsLoadingScenario(false); // Stop spinner, always execute
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
      setErrorMessage("Please enter a custom outcome");
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

      // Add opponent message once
      if (opponentMessageContent) {
        addMessageToHistory(opponentMessageContent, 'opponent', 0);
      }

      // Delay setting the initial progress until here!
      let scaledProgress = (performanceScore / scenario.goal) * 100;
      if (scaledProgress > 100) {
        scaledProgress = 100;
      }
      console.log("DEBUG - Setting Progress with: ", scaledProgress); //Check if the progress has been sent.
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
             Engage in a conversational style typical of a business relationship. Use casual, colloquial language, avoiding overly formal phrases.
             Do not use conversational filler or rephrase previous statements too frequently. Vary your sentence structure and word choice to prevent repetitive phrases.
            Maintain a ${settings.tone} tone and employ ${settings.complexity} and utilize the strategy of being ${settings.strategy}.
           **When starting a new negotiation, always offer a concrete proposal to begin negotiation as your first message. This should be a specific and measurable offer related to the type of negotiation**. You could also include a deadline, or by when you'd like completion to occur. This does not apply to any response messages, only the first one.
            **You will analyze the user's last message and address the key points they have raised, responding to the specifics of their argument. The difficulty level indicates your flexibility in this response, with an 'easy' opponent being more likely to concede and an 'expert' opponent being more likely to challenge each point, or be more aggressive or erratic.**
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

    const prompt = generateUserResponsePrompt(strategyDescription, userRole, opponentRole);
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
              Use casual, relatable language that reflects how professionals generally talk with each other.
             Avoid overly formal language, filler, or unnecessary greetings.
            Your goal is to find common ground, not simply reiterate your own position.
              Return the response in JSON format:
            {
                "message": "<p>Your concise message here</p><p>And another paragraph here</p>"
            }
        `;
  };

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
        Return the response in the JSON format:
        {
            "options": [{ "name": "string", "description": "string" }]
        }
    `;

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
      console.log('Generated response options:', parsed.options);
      setResponseOptions(parsed.options);
      setButtonRevealComplete(false);
      setIsSpinning(false); // Turn off the spinning state
    } else {
      console.error('Invalid response structure:', parsed);
      setErrorMessage('Failed to generate response options. Please try again.');
    }
  };

    // Generate feedback for user response
  const generateFeedback = async (userMessage) => {
    const userRole = scenario.roles.find((r) => r.name === selectedRole);
    const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);

    const feedbackPrompt = `
            Analyze the user's message: "${userMessage}" as ${userRole.name} in the role of ${userRole.role}, in the context of the current negotiation, with a focus on negotiation tactics.
            Consider the opponent's position as ${opponentRole.name} in the role of ${opponentRole.role}.
            Provide feedback to the user on the effectiveness of their message and what they did well or not so well, considering also whether their message was appropriate for a conversation between roommates.
            Focus on how the user could improve in the future by exploring common ground and advancing the negotiation goals, or by being more emotionally responsive.
            Keep your feedback encouraging and focus on strategic communication and negotiation tactics.
            Score the user's message on the following categories using a scale from -2 to +2, but **only award points if the message actually demonstrates the value of each category, and not simply by including it in their message**:
                - Assertiveness: How effectively the user stated their position while respecting the opponent's viewpoint and objectives.
                - Flexibility: How well the user adapted their strategy, incorporated new information, or found alternative solutions to overcome obstacles.
                - Empathy: How genuinely the user understood, acknowledged, and addressed the opponent's feelings and needs.
                - Strategic Planning: How effectively the user approached the negotiation with a structured, forward-thinking plan to achieve their objective while maximizing mutual gains.
                - Clarity of Communication: How precisely, concisely, and effectively the user conveyed their message, ensuring ease of understanding for the opponent.
                - Collaborative Problem Solving: How proactively the user engaged in identifying mutual gains, exploring innovative options, and seeking win-win solutions to create a more satisfying outcome.
            Return the feedback and scores in JSON format:
            {
            "feedback": "<p>Your concise feedback here</p><p>Another paragraph of feedback here</p>",
                "scores": {
                    "Assertiveness": number,
                    "Flexibility": number,
                    "Empathy": number,
                    "Strategic Planning": number,
                    "Clarity of Communication": number,
                    "Collaborative Problem Solving": number
                }
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

  // Generate opponent's response
  const generateOpponentResponse = async (lastUserMessage) => {
    try {
      const userRole = scenario.roles.find((r) => r.name === selectedRole);
      const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);
      if (!userRole || !opponentRole) {
        throw new Error('Roles not correctly set.');
      }
      const systemPrompt = generateOpponentSystemPrompt(scenario, userRole, opponentRole, opponentDifficulty, chatHistory);

      const opponentPrompt = `
                 As ${opponentRole.name}, in the role of ${opponentRole.role}, respond to ${userRole.name} in the negotiation. The message must be short and to the point, fitting for a chat interface, and should address the tone and content of the user's last message: "${lastUserMessage}". Also, utilize the system prompt you were provided to maintain consistency. Return the message in JSON with the format: { "message": "<p>string</p><p>string</p>..." }.
                 `;
      logMessage('System Prompt:', systemPrompt);
      logMessage('Opponent Prompt:', opponentPrompt);

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

      logMessage('Raw Opponent Response', rawResponse);
      const parsed = parseAiJson(rawResponse);
      logMessage('Parsed Opponent Response', parsed);
      const finalMessage = parsed?.message;
      if (!finalMessage) {
        throw new Error('Opponent response is empty or invalid JSON.');
      }
      logMessage('Final Opponent Message', finalMessage);
      const initialScore = 0;
      addMessageToHistory(finalMessage.trim(), 'opponent', initialScore);

      const outcome = assessNegotiationOutcome();
      if (outcome && outcome.outcome !== 'Draw') {
        finalizeSimulation();
        return;
      }
      return finalMessage.trim();
    } catch (error) {
      logMessage('Error generating opponent response:', error);
      console.error('Failed to generate opponent response:', error);
      setErrorMessage('Failed to generate opponent response. Please try again.');
      return null;
    } finally {
       setIsFetchingOpponent(false);
    }
  };

  // Send user reply and process AI response
  const sendUserReply = async () => {
    if (!userDraft.trim()) {
      setErrorMessage('Please type a reply before sending.');
      return;
    }
    setErrorMessage('');
    const userMessage = convertLineBreaksToParagraphs(userDraft);
    setUserDraft('');
    setIsUserTurn(false);

    // Add user message to chat history immediately
    addMessageToHistory(userMessage, 'user');

     // Generate feedback if the toggle is on and add it to history
    let feedbackContent = null;
    let scores = null;
    if (showFeedback) {
      const rawFeedback = await generateFeedback(userMessage);
      if (rawFeedback) {
        feedbackContent = rawFeedback.feedback;
        scores = rawFeedback.scores;
        addMessageToHistory(feedbackContent, 'feedback', scores);
      }
    }
    setIsFetchingOpponent(true);
    try {
      await generateOpponentResponse(userMessage);
    } finally {
      setIsFetchingOpponent(false);
    }

    // Check if negotiation is already complete
    const outcome = assessNegotiationOutcome();
    if (outcome && outcome.outcome !== 'Draw') {
      finalizeSimulation();
      return;
    }

    // Generate opponent's response
    // Ensure generateOpponentResponse is called only once per user reply

    // Update progress
    if (scores) {
      const scoreSum = Object.values(scores).reduce((sum, score) => sum + score, 0);
      setPerformanceScore(prev => prev + scoreSum);
      let scaledProgress = ((performanceScore + scoreSum + 5) / 10) * 100;
        //Update Values

      const updatedValues = {
        Assertiveness: aiPerformanceValues.Assertiveness + scores.Assertiveness,
        Flexibility: aiPerformanceValues.Flexibility + scores.Flexibility,
        Empathy: aiPerformanceValues.Empathy + scores.Empathy,
        'Strategic Planning': aiPerformanceValues['Strategic Planning'] + scores['Strategic Planning'],
        'Clarity of Communication': aiPerformanceValues['Clarity of Communication'] + scores['Clarity of Communication'],
        'Collaborative Problem Solving': aiPerformanceValues['Collaborative Problem Solving'] + scores['Collaborative Problem Solving'],
      };
        setAiPerformanceValues(updatedValues);

      if (scaledProgress > 100) scaledProgress = 100;
      setProgress(scaledProgress);
      setPerformanceData(prev => [...prev, { turn: currentTurnIndex, score: performanceScore + scoreSum }]);
    }

    setCurrentTurnIndex(prev => prev + 1);
    setIsUserTurn(true);
  };

  // --- Revised outcome assessment using aggregate scoring ---
  const assessNegotiationOutcome = () => {
    if (performanceScore >= 5) {
      return { outcome: 'Win', reason: 'Your objective was clearly reached.' };
    } else if (performanceScore <= -5) {
      return { outcome: 'Lose', reason: 'Your performance fell short of your objective.' };
    }
    if (currentTurnIndex >= 10) {
      return { outcome: 'Draw', reason: 'The negotiation ended without a decisive win or loss.' };
    }
    return null;
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
    setFeedbackVisible(false);
  };

  // Handles the complete button animation
  const handleButtonAnimationComplete = () => {
    setButtonRevealComplete(true);
  };

  // Toggle showing feedback
  const toggleFeedback = () => {
    setShowFeedback(!showFeedback);
  };

  // --- Tooltip positioning for feedback ---
  const handleFeedbackClick = (event, messageId) => {
    // Calculate tooltip position offset (10px right and 10px below the cursor)
    const tooltipX = event.clientX + 10;
    const tooltipY = event.clientY + 10;
    setTooltipPosition({ x: tooltipX, y: tooltipY });
    // Toggle feedback visibility for the clicked message:
    setChatHistory(prevHistory =>
      prevHistory.map(msg =>
        msg.id === messageId ? { ...msg, feedbackVisible: !msg.feedbackVisible } : msg
      )
    );
  };


  const analyzeNegotiation = async () => {
    const userRole = scenario.roles.find((r) => r.name === selectedRole);
    const analysisPrompt = `
                     You are to provide a strategic debrief of a negotiation simulation.
                     The scenario is: "${scenario.context}".
                     The user played as ${userRole.name}, in the role of ${userRole.role}, aiming to achieve the goal of ${scenario.goal}.

                     Analyze the following negotiation transcript, focusing on ${userRole.name}’s overall negotiation strategy and specific strategic decisions made throughout the negotiation.
                     Evaluate ${userRole.name}’s performance based on the following key negotiation tactics (Rubric), providing a score on a scale of 1-10 for each tactic, reflecting their *strategic effectiveness* in this *specific scenario*:
                     - Assertiveness
                     - Flexibility
                     - Empathy
                     - Strategic Planning
                     - Clarity of Communication
                     - Collaborative Problem Solving

                     For each tactic in the Rubric:
                     1. Provide a score (1-10) that reflects the user's strategic effectiveness in this area *within the context of this scenario*.
                     2. Identify and describe 1-2 *strategic highlights* from the transcript that *exemplify* the user's approach to this tactic. These can be positive or negative examples. Quote specific lines from the transcript to illustrate each highlight.
                     3. Based on your analysis and the strategic highlights, provide 1-2 *actionable recommendations* for ${userRole.name} to improve their strategic approach to this tactic in *future, similar negotiations*. Recommendations must be specific and directly related to the scenario and user's role.

                     Provide an overall summary that assesses ${userRole.name}’s *dominant negotiation strategy* in this scenario.  Discuss whether this strategy was effective given the scenario's context and goals.  Mention specific examples of when this strategy was particularly effective or ineffective, citing transcript lines. Start your summary with a sentence directly addressing ${userRole.name}, by name and role, before proceeding to the rest of your summary.

                      Return the result in JSON format with the following structure, ensuring that keys appear in Sentence Case, and recommendations are offered as a string array:
                      {
                          "Summary": "string",
                          "Tactics": {
                               "Assertiveness": { "score": number, "strategicHighlights": ["string"], "recommendations": ["string"] },
                               "Flexibility": { "score": number, "strategicHighlights": ["string"], "recommendations": ["string"] },
                               "Empathy": { "score": number, "strategicHighlights": ["string"], "recommendations": ["string"] },
                              "Strategic Planning": { "score": number, "strategicHighlights": ["string"], "recommendations": ["string"] },
                              "Clarity of Communication": { "score": number, "strategicHighlights": ["string"], "recommendations": ["string"] },
                               "Collaborative Problem Solving": { "score": number, "strategicHighlights": ["string"], "recommendations": ["string"] }
                          }
                      }

                     The negotiation transcript:
                     ${JSON.stringify(chatHistory.filter(msg => msg.role !== 'feedback'), null, 2)}
                 `;
    try {
      const rawAnalysisResponse = await fetchOpenAIResponse({
        messages: [{ role: 'system', content: analysisPrompt }],
      }, '/api/generate');
      const parsedAnalysis = parseAiJson(rawAnalysisResponse);

      if (parsedAnalysis) {
        console.log('Parsed Analysis:', parsedAnalysis);
        const sentenceCaseKeys = (obj) => {
          if (typeof obj !== 'object' || obj === null) {
            return obj;
          }
          if (Array.isArray(obj)) {
            return obj.map(sentenceCaseKeys);
          }
          const newObj = {};
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const newKey = key.charAt(0).toUpperCase() + key.slice(1);
              newObj[newKey] = sentenceCaseKeys(obj[key]);
            }
          }
          return newObj;
        };

        const formattedAnalysis = sentenceCaseKeys(parsedAnalysis);

        setDebriefing((prev) => ({
          ...prev,
          summary: formattedAnalysis.Summary,
          tactics: formattedAnalysis.Tactics,
        }));
        const radarDataFormatted = Object.entries(formattedAnalysis.Tactics).map(([name, value]) => ({
          skill: name,
          score: value.score,
        }));

        setRadarData(radarDataFormatted);
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

  const generateRecommendation = async () => {
    const userRole = scenario.roles.find((r) => r.name === selectedRole);
    const transcript = chatHistory.filter(msg => msg.role !== 'feedback');
    const analysisPrompt = `
                 Given this negotiation transcript: "${JSON.stringify(transcript)}", and the context of the scenario: "${scenario.context}" evaluate the user's performance, playing as ${userRole.name}. Provide clear, concise and actionable advice on what specific strategies to improve next time, in the format: "string".
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
  };

  // Finalize the simulation after completion
  const finalizeSimulation = async () => {
    const outcomeData = assessNegotiationOutcome();
    const analysisData = await analyzeNegotiation();
    const recommendationData = await generateRecommendation();

    // You might compute an overall effectiveness metric based on performanceScore and message counts.
    const effectivenessScore = performanceScore; // already on -5 to 5 scale.
    if (analysisData && outcomeData && recommendationData) {
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
        advice: recommendationData,
        transcript: chatHistory,
        outcome: outcome,
        outcomeReason: outcomeReason,
        summary: analysisData.Summary,
          performanceOverview: analysisData.PerformanceOverview,
        recommendations: analysisData.Recommendations,
      }));
    } else {
      setErrorMessage('Failed to generate a proper summary. Please try again.');
      setDebriefing(null);
    }
    setSimulationComplete(true);
  };


  // Reset all state variables for new simulations
  const resetNegotiation = () => {
    setScenario(null);
    setRoles(['Role 1', 'Role 2']);
    setSelectedRole('');
    setChatHistory([]);
    setUserDraft('');
    setProgress(50);
    setPerformanceScore(0);
    setSimulationComplete(false);
    setDebriefing(null);
    setErrorMessage('');
    setImages({});
    setNegotiationStarted(false);
    setScenarioGenerated(false); // Reset the scenario generated flag
    setCurrentTurnIndex(1);
    setRadarData(null);
    setResponseOptions([]);
    setButtonRevealComplete(true);
    setShowFeedback(true); // Also reset the feedback toggle
    setIsScenarioEditable(false); // Reset scenario edit state
    setEditableScenario(null);
    setCustomOutcomeInput('');
    setCustomSetupStage('selection');
      setPerformanceData([]);
       setAiPerformanceValues({
        Assertiveness: 0,
        Flexibility: 0,
        Empathy: 0,
        'Strategic Planning': 0,
        'Clarity of Communication': 0,
        'Collaborative Problem Solving': 0,
      });
  };

  // Function to go to previous turn
  const goToPreviousTurn = () => {
    if (currentTurnIndex > 1 && simulationComplete) {
      setCurrentTurnIndex(prevIndex => prevIndex - 1);
    }
  };

  // Function to go to next turn
  const goToNextTurn = () => {
    const totalTurns = Math.ceil(chatHistory.length / 2);
    if (currentTurnIndex < totalTurns && simulationComplete) {
      setCurrentTurnIndex(prevIndex => prevIndex + 1);
    }
  };

  // Update the progress to factor in scores
  const updateProgress = (newProgress, scores = null) => {
    let scoreSum = 0;
    if (scores) {
      scoreSum = Object.values(scores).reduce((sum, score) => sum + score, 0);
      setPerformanceScore(prev => prev + scoreSum);
    }
    setPerformanceData(prevData => [...prevData, { turn: currentTurnIndex, score: performanceScore + scoreSum }]);
    let scaledProgress = ((performanceScore + scoreSum + 5) / 10) * 100;
    if (scaledProgress > 100) {
      scaledProgress = 100;
    }
    setProgress(scaledProgress);
  };


  // --- Render JSX ---
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-box">
          <span className="header-title">Negotiation Challenge</span>
        </div>
      </header>

      <main className="content-grid">
        <aside className="left-column">
          {/* Step Box */}
          {scenario && (
            <div className="step-box">
              <ChevronLeft
                onClick={goToPreviousTurn}
                className={`nav-arrow ${currentTurnIndex <= 1 && simulationComplete ? 'disabled' : ''}`}
                title="Previous Turn"
              />
              <span className="step-text">
                {negotiationStarted ? (
                  simulationComplete ? (
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
                  className={`nav-arrow ${simulationComplete && currentTurnIndex >= Math.ceil(chatHistory.length / 2) ? 'disabled' : ''}`}
                  title="Next Turn"
                />
              )}
            </div>
          )}

          {/* Scenario Info */}
          {negotiationStarted && scenario && (
            <div className="scenario-info">
              <h3 className="left-column-scenario-title">{scenario.title}</h3>
              <div className="scenario-description left-column-scenario-description" dangerouslySetInnerHTML={{ __html: scenario.context }} />
            </div>
          )}

          {/* Details Card */}
          <Card className="details-card">
            <CardContent>
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
              {negotiationStarted && scenario && (
                <div>
                  <div className="role-info" style={{ marginBottom: '5px' }}>
                    <strong>Your Role:</strong>
                    <div className="role-details">
                      {selectedRoleObject ? `${selectedRoleObject.name} - ${selectedRoleObject.role}` : 'Role not selected'}
                    </div>
                  </div>
                  <p style={{ marginBottom: '5px' }}>
                    <strong>Desired Outcome:</strong> {desiredOutcome === 'custom' ? customOutcomeInput : desiredOutcome}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', padding: '10px', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 className="scenario-title">Performance Meter</h3>
                    <div className="meter-container">
                      <div className="meter-gradient">
                        <div className="meter-needle" style={{ left: `${progress}%` }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '5px' }}>
                        <span style={{ color: 'black', position: 'absolute', left: '0%', top: '20px' }}>Lose</span>
                        <span style={{ color: 'black', position: 'absolute', left: 'calc(50% - 20px)', top: '20px' }}>Draw</span>
                        <span style={{ color: 'black', position: 'absolute', right: '0%', top: '20px' }}>Win</span>
                      </div>
                      <p style={{ fontSize: '0.8em', textAlign: 'center' }}>Your Goal: {scenario.goal}. Current Progress: {progress}%</p>
                    </div>
                  </div>
                </div>
              )}
              {!negotiationStarted && (
                <div className="module-description">
                  <h2>Negotiation Simulator</h2>
                  <p>
                    Welcome to the Negotiation Simulator, where you will engage
                    in a strategic battle of wits against an intelligent
                    opponent. Your objective is to navigate the negotiation
                    process and achieve your desired outcome while considering
                    the goals of the other party.
                  </p>
                  <Button onClick={() => setShowInstructions(!showInstructions)}>
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
              {scenario && !negotiationStarted && (
                <div className="left-column-setup-container">
                  <div className="roles-customization">
                    <strong>Customize Roles:</strong>
                    {roles.map((role, index) => (
                      <div key={index} className="form-group">
                        <input
                          type="text"
                          className="editable-role"
                          value={role}
                          onChange={(e) => updateRoles(e.target.value, index)}
                          placeholder={`Role ${index + 1} Name`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label>Set Opponent Personality:</label>
                    <div className="form-slider">
                      <div className="form-slider-labels">
                        <span>Collaborative</span>
                        <span>Balanced</span>
                        <span>Aggressive</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Object.keys(opponentPersonalitySetting).length - 1}
                        step="1"
                        value={Object.keys(opponentPersonalitySetting).indexOf(opponentPersonality)}
                        onChange={handleOpponentPersonalityChange}
                      />
                      <div className="form-slider-description">
                        <span>
                          Choose a personality for your opponent, which will affect their tone, communication style,
                          and negotiation tactics. A collaborative opponent is more agreeable,
                          while an aggressive opponent can be manipulative and unwilling to compromise.
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      startNegotiation();
                      setShowInstructions(false);
                    }}
                    className="start-button"
                    disabled={!selectedRole || !desiredOutcome || (desiredOutcome === 'custom' && !customOutcomeInput.trim())}
                  >
                    Start Negotiation
                  </Button>
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
                          {chatHistory.map((msg) => (
                            <div key={msg.id} className={`chat-message ${msg.role}`}>
                              {msg.role === 'feedback' && (
                                <div
                                  className="feedback-box"
                                  // Apply inline positioning based on tooltipPosition if visible
                                  style={msg.feedbackVisible ? { top: tooltipPosition.y, left: tooltipPosition.x } : {}}
                                  onClick={(e) => handleFeedbackClick(e, msg.id)}
                                >
                                  <h4 className="feedback-title">
                                    <Info className="icon" /> Feedback
                                  </h4>
                                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                  {msg.scores && (
                                    <div className="feedback-scores">
                                      <span title="Assertiveness" className="score-item">
                                        <Swords style={{ color: msg.scores.Assertiveness > 0 ? 'green' : 'red' }} />
                                        <span>{msg.scores.Assertiveness > 0 ? `+${msg.scores.Assertiveness}` : msg.scores.Assertiveness}</span>
                                      </span>
                                      <span title="Flexibility" className="score-item">
                                        <HandCoins style={{ color: msg.scores.Flexibility > 0 ? 'green' : 'red' }} />
                                        <span>{msg.scores.Flexibility > 0 ? `+${msg.scores.Flexibility}` : msg.scores.Flexibility}</span>
                                      </span>
                                      <span title="Empathy" className="score-item">
                                        <HandHeart style={{ color: msg.scores.Empathy > 0 ? 'green' : 'red' }} />
                                        <span>{msg.scores.Empathy > 0 ? `+${msg.scores.Empathy}` : msg.scores.Empathy}</span>
                                      </span>
                                      <span title="Strategic Planning" className="score-item">
                                        <LandPlot style={{ color: msg.scores['Strategic Planning'] > 0 ? 'green' : 'red' }} />
                                        <span>{msg.scores['Strategic Planning'] > 0 ? `+${msg.scores['Strategic Planning']}` : msg.scores['Strategic Planning']}</span>
                                      </span>
                                      <span title="Clarity of Communication" className="score-item">
                                        <Speech style={{ color: msg.scores['Clarity of Communication'] > 0 ? 'green' : 'red' }} />
                                        <span>{msg.scores['Clarity of Communication'] > 0 ? `+${msg.scores['Clarity of Communication']}` : msg.scores['Clarity of Communication']}</span>
                                      </span>
                                      <span title="Collaborative Problem Solving" className="score-item">
                                        <Handshake style={{ color: msg.scores['Collaborative Problem Solving'] > 0 ? 'green' : 'red' }} />
                                        <span>{msg.scores['Collaborative Problem Solving'] > 0 ? `+${msg.scores['Collaborative Problem Solving']}` : msg.scores['Collaborative Problem Solving']}</span>
                                      </span>
                                    </div>
                                  )}

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
                          <div className="spinner-container">
                            <BeatLoader color="#0073e6" size={8} />
                          </div>
                        )}
                      </CardContent>
                      {/* Message Input */}
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
                                <CheckSquare className="checkbox-icon-filled" />
                                :
                                <Square className="checkbox-icon-empty" />}
                              Show Feedback
                            </label>
                          </div>
  
                          <div className="user-input-container">
                            <textarea
                              value={userDraft}
                              onChange={(e) => setUserDraft(e.target.value)}
                              className="user-draft-textarea"
                              placeholder="Type your reply here or select an option above..."
                              onKeyDown={handleKeyDown}
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
                            {/* Conditionally render the title based on edit mode */}
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
                              {isLoadingScenario && (<BarLoader color="#0073e6" width="100%" />)}
                            </div>
  
                            <div className="scenario-description main-content-scenario-description" dangerouslySetInnerHTML={{ __html: scenario.context }} />
  
                            {negotiationType === 'custom' && scenarioGenerated && !isScenarioEditable && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '10px' }}>
                                <span onClick={handleScenarioEditToggle} className="edit-control-label">
                                  <Edit className="scenario-edit-icon" style={{ marginLeft: '5px' }} />
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
                                onChange={(e) => {
                                  setDesiredOutcome(e.target.value);
                                  if (e.target.value !== 'custom') {
                                    setCustomOutcomeInput('');
                                  }
                                }}
                                value={desiredOutcome}
                              >
                                <option value="">Choose outcome</option>
                                {scenario.desiredOutcomes.map((outcome, index) => (
                                  <option key={index} value={outcome}>
                                    {outcome}
                                  </option>
                                ))}
                                <option value="custom">Custom Outcome</option>
                              </select>
                              {desiredOutcome === 'custom' && (
                                <textarea
                                  value={customOutcomeInput}
                                  onChange={(e) => setCustomOutcomeInput(e.target.value)}
                                  className="custom-outcome-input"
                                  placeholder="Type your custom desired outcome..."
                                />
                              )}
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
                              disabled={!selectedRole || !desiredOutcome || (desiredOutcome === 'custom' && !customOutcomeInput.trim())}
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
                      <CardTitle className="header-title">Setup Your Simulation</CardTitle>
                      <div className="spinner-container">
                        {isLoadingScenario && <BarLoader color="#0073e6" width="100%" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!isCustomInputMode ? (
                        <>
                          <div className="form-group">
                            <label>Select negotiation type</label>
                            <select
                              onChange={(e) => {
                                setNegotiationType(e.target.value);
                                if (e.target.value === 'custom') {
                                  setIsCustomInputMode(true);
                                } else {
                                  setIsCustomInputMode(false);
                                }
                              }}
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
                        <div className="form-group">
                          <label>Enter your custom negotiation scenario</label>
                          <div className="scenario-title-container">
                            <div className="scenario-description" style={{ position: 'relative' }}>
                              <textarea
                                value={customScenarioInput}
                                onChange={(e) => setCustomScenarioInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault(); // Prevent newline
                                    handleCustomScenarioSubmit();
                                  }
                                }}
                                placeholder="Describe a custom negotiation scenario, including the people and situations you want to simulate."
                                className="custom-scenario-input"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {!isCustomInputMode ? (
                        <Button onClick={generateScenario} disabled={isLoadingScenario}>
                          {isLoadingScenario ? 'Generating...' : 'Generate Scenario'}
                        </Button>
                      ) : (
                        <>
                          {!isScenarioEditable && (
                            <Button onClick={handleCustomScenarioSubmit} disabled={isFetchingScenario}>
                              {isFetchingScenario ? 'Generating Custom Scenario...' : 'Generate Custom Scenario'}
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              ) : (
                debriefing && (
                  <div className="debriefing-section">
                    <h4 className="debriefing-title">Simulation Debriefing</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      {radarData && (
                        <div style={{ width: '48%', height: 300 }}>
                          <ResponsiveContainer>
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="skill" />
                              <PolarRadiusAxis angle={30} domain={[0, 10]} />
                              <Radar name="User" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            </RadarChart>
                          </ResponsiveContainer>
                          <p style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '5px' }}>
                            This graph illustrates your scores in key negotiation tactics.
                          </p>
                        </div>
                      )}
                      {performanceData.length > 0 && (
                        <div style={{ width: '48%', height: 300 }}>
                          <ResponsiveContainer>
                            <LineChart data={performanceData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="turn" />
                              <YAxis domain={[-5, 5]} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                          </ResponsiveContainer>
                          <p style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '5px' }}>
                            Your performance score over turns.
                          </p>
                        </div>
                      )}
                    </div>
  
                    <div className="debriefing-text-container">
                      <p>
                        <strong>Summary:</strong>
                        {debriefing.summary?.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </p>
                    </div>
  
                    <div className="debriefing-text-container">
                      <p>
                        <strong>Performance Overview:</strong>
                         <ul className="debriefing-list">
                          {debriefing.performanceOverview &&
                            Object.entries(debriefing.performanceOverview).map(([key, value], i) => (
                              <li key={i}>
                                <strong>{key}:</strong> {value}
                              </li>
                            ))}
                        </ul>
                      </p>
                    </div>
  
                    <div className="debriefing-text-container">
                      <p>
                        <strong>Recommendations:</strong>
                        <ul className="debriefing-list">
                          {debriefing.recommendations &&
                            Object.entries(debriefing.recommendations).map(([key, value], i) => (
                              <li key={i}>
                                <strong>{key}:</strong> {value}
                              </li>
                            ))}
                        </ul>
                      </p>
                    </div>
  
                    <div className="debriefing-text-container">
                      <p>
                        <strong>Outcome:</strong> {debriefing.outcome}
                        {debriefing.outcomeReason && (
                          <>
                            <br /><strong>Reason:</strong> {debriefing.outcomeReason}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="debriefing-text-container">
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
                    </div>
                    <div className="debriefing-text-container">
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
                    </div>
                    <div className="debriefing-text-container">
                      <p>
                        <strong>Overall Score:</strong> {debriefing.overallScore}
                      </p>
                    </div>
                    <div className="debriefing-text-container">
                      <p>
                        <strong>Letter Grade:</strong> {debriefing.letterGrade}
                      </p>
                    </div>
                    <div className="debriefing-text-container">
                      <p>
                        <strong>Recommendations:</strong> {debriefing.advice}
                      </p>
                    </div>
                    <Button onClick={() => setShowTranscript(!showTranscript)}>
                      {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                    </Button>
                    {showTranscript && (
                      <div className="transcript">
                        <h5>Full Transcript:</h5>
                        {chatHistory
                          .filter(msg => msg.role === 'user' || msg.role === 'opponent')
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
  
  // Metadata for the module
  export const metadata = {
    title: 'Negotiation Simulator',
    description: 'Flex your negotiation skills against a skilled opponent.',
    imageUrl: '../images/NegotiationModule.png',
    instructions: `
      <h2>Gameplay Overview</h2>
      <p>Welcome to the Negotiation Simulator, where you will engage in a strategic battle of wits against an intelligent opponent. Your objective is to negotiate until your objective is reached or the negotiation is deemed a draw.</p>
      <h3>Scoring and Outcome</h3>
      <p>Your performance score starts at 0 (displayed as 50% on the meter) and moves between -5 (loss) and +5 (win). The negotiation ends if your score reaches +5 (win) or -5 (loss), or if 10 turns are completed without a decisive result (draw).</p>
      <h3>Feedback</h3>
      <p>Click on any feedback bubble to see detailed comments. The tooltip will appear offset from your cursor for readability.</p>
    `,
    component: NegotiationModule,
  };
  
  export default NegotiationModule;