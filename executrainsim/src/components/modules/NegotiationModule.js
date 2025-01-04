import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import SlotMachineText from '../effects/SlotMachineText';
import Select, { SelectItem } from '../ui/Select';
import { Info, Star, ChevronLeft, ChevronRight, Menu, RefreshCw, SendHorizontal, Bell, CheckSquare, Square } from 'lucide-react';
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
    console.error('parseAiJson: No response data to parse.');
    return null; // Return null if no response
  }

  try {
      if (typeof apiResponse === 'string') {
          const cleaned = apiResponse.replace(/```json|```/g, '').trim();
          return JSON.parse(cleaned);
      }
      return apiResponse; // Assume it's already parsed
  } catch (err) {
      console.error('Failed to parse AI JSON:', err, apiResponse);
      return null; // Return null if parsing fails
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
  const [imageStatus, setImageStatus] = 'idle';
  const [isUserReplyLoading, setIsUserReplyLoading] = useState(false);  
  const [isSpinning, setIsSpinning] = useState(false);  
  const [isResponseLoading, setIsResponseLoading] = useState(false);  
  const [radarData, setRadarData] = useState(null);

   // NEW STATES FOR FEEDBACK
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState(null);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedbackTargetId, setFeedbackTargetId] = useState(null);


  
  // NEW STATE VARIABLE
  const [scenarioGenerated, setScenarioGenerated] = useState(false);
   const [buttonRevealComplete, setButtonRevealComplete] = useState(true);

  
  const MAX_TOTAL_TOKENS = 4096;  
  const MIN_RESPONSE_TOKENS = 150;  
  
  const selectedRoleObject = scenario?.roles?.find((role) => role.name === selectedRole);  
  
    const chatHistoryContainerRef = useRef(null);


  const scrollToBottom = () => {
    chatHistoryContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
     scrollToBottom()
  }, [chatHistory]);



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
         console.log("generateScenario: About to call generateImage:", parsedScenario.scenario.title, parsedScenario.scenario.context)
          await generateImage(parsedScenario.scenario.title, parsedScenario.scenario.context);  
        } else {  
          setErrorMessage('Failed to generate scenario. Please try again.');  
        }  
      } catch (error) {  
        setErrorMessage('An error occurred while generating the scenario.');  
      }  
    };
  
    const generateImage = async (title, context) => {  
      console.log("generateImage function called with title:", title, "and context:", context)
      setImageStatus('loading');  
      const prompt = `Illustrate the negotiation scenario titled "${title}" with context: "${context}". The illustration should resemble colorful, writing-free, diverse universal stock art from the 1990s with simple, clean lines and a focus on clarity.`;  
    
      try {  
        const endpoint = `${IMAGE_API_URL}/api/dalle/image`;  
        const response = await axios.post(endpoint, { prompt });  
        if(response?.data?.imagePath){
            try {
                setImages((prevImages) => ({ ...prevImages, [0]: response.data.imagePath }));
                setImageStatus('success');
              } catch(setImagesError){
               setImageStatus('failed');
                  console.error('Error setting image state:', setImagesError);
                   setErrorMessage(  
                      <span>  
                           Failed to generate image: Could not set state.  
                          <RefreshCw className="reload-icon" onClick={() => retryImageGeneration(title, context)} />  
                     </span>  
                  ); 
              }
        }
          else {
               setImageStatus('failed');
               setErrorMessage(  
                <span>  
                  Failed to generate image: Empty response data.  
                 <RefreshCw className="reload-icon" onClick={() => retryImageGeneration(title, context)} />  
                </span>  
              ); 
             console.error('API Error Details:', response);
          }
         
      } catch (error) {  
          setImageStatus('failed');
          console.error('Error generating image:', error);
        setErrorMessage(  
          <span>  
            Failed to generate image. Please try again.  
            <RefreshCw className="reload-icon" onClick={() => retryImageGeneration(title, context)} />  
          </span>  
        );   
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
  
  const addMessageToHistory = (content, role, feedback = null, feedbackId = null) => {
    if (!content && role !== 'feedback') {
        console.error('Invalid message content:', content);
        return;
    }
    const roleName =
        role === 'user'
            ? selectedRole
            : role === 'opponent'
                ? scenario?.roles.find((r) => r.name !== selectedRole)?.name || 'Unknown'
                : 'Feedback';

    const newMessage = {
        content,
        role,
        name: roleName,
        timestamp: generateSequentialTimestamp(),
         feedback: feedback,
        id: Date.now(),
        feedbackId: feedbackId,
      feedbackVisible: false,
    };
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
        - Value-Based Approach: Focus on the value that your service offers, rather than just focusing on price.
        - Anchoring:  Set the tone of the negotiation and establish your desired outcome by suggesting an initial number or point that is beneficial to you.
        - Concessions: Show flexibility by offering something of value in return for something else of value to you.
        - Delaying: Slow down the negotiation to give yourself time to think and to create a sense of urgency for the other party.
        - Information Gathering: Ask pointed questions that help you to understand the other party's needs and limitations.
        - Collaboration: Build mutual trust and find common ground in the negotiation.
         - Highlighting Success: Show past successful projects to increase confidence in your ability to deliver in this project.

        Return the response in the JSON format:  
        {  
            "options": [{ "name": "string", "description": "string" }]  
        }  
    `;
  
    const createUserResponsePrompt = (strategyDescription, userRole, opponentRole) => `
    As ${userRole.name}, respond to ${opponentRole.name} using the strategy: "${strategyDescription}". 
    In the context of the negotiation: "${scenario.context}", provide a short, direct, and professional message, appropriate for a chat interface (like Teams or Slack).
    Focus on moving the negotiation forward.
    Avoid overly formal language, filler, or unnecessary greetings.
    Return the response in JSON format:
    {
        "message": "Your concise message here"
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
        setIsSpinning(false); // Added line to turn off the spinning state
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

    const generateFeedback = async (userMessage) => {
        const feedbackPrompt = `
             Analyze the user's message: "${userMessage}" in the context of the current negotiation, with a focus on negotiation tactics.
             Provide feedback to the user on the effectiveness of their message, what they did well or not so well, and how they could improve in the future. 
             Keep your feedback positive and focus on strategic communication and negotiation tactics.
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
    setCurrentTurnIndex((prev) => prev + 1);

    setIsUserTurn(false);
    setIsFetching(true);

    // Get the delay time
    const delay = getRandomDelay();
     const feedbackDelay = delay * 0.5;
     const animationDelay = delay * 0.25;

    // Start loader animation
    setTimeout(() => {
      setIsFetchingOpponent(true);
    }, animationDelay);

  let feedback = null;
  let feedbackId = null;
    // Generate feedback if the toggle is on

    if (showFeedback) {
        const tempFeedback = await generateFeedback(userDraft);
         if(tempFeedback){
         feedback = tempFeedback;
         feedbackId = Date.now();
         }
     }

      setTimeout(() => {
      if (feedback) {
          addMessageToHistory(feedback, 'feedback', feedback, feedbackId)
      }
  }, feedbackDelay)

    // Send Response
    setTimeout(async () => {
      const opponentMessageContent = await generateOpponentResponse();
        if (opponentMessageContent) {
            addMessageToHistory(opponentMessageContent, 'opponent');
        } else {
            console.error("Opponent message is null or undefined.");
            setErrorMessage('Failed to generate opponent message.');
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
     if(!desiredOutcome) {
         return { outcome: 'draw', reason: 'No desired outcome was selected.' };
     }
    const userMessages = chatHistory.filter(msg => msg.role === 'user').map(msg => msg.content).join(' ');
      const outcomeCheckPrompt = `
     Based on the user's negotiation messages: "${userMessages}", and the context of the negotiation, including the desired outcome of "${desiredOutcome}", determine if the user has likely achieved their goal or if the negotiation has ended without a clear win. Return the result in JSON format:
    {
         "outcome": "win" | "lose" | "draw",
          "reason": "Your short justification here"
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
     }
      catch (error) {
         console.error('Failed to assess negotiation outcome', error);
         return { outcome: 'draw', reason: 'Failed to assess the outcome. Try again.' };
     }
 }

 const analyzeNegotiation = async () => {
  const userRole = scenario.roles.find((r) => r.name === selectedRole);
  const analysisPrompt = `
      Analyze the following negotiation transcript, paying special attention to how ${userRole.name}, in the role of the ${userRole.role}, navigated the negotiation.
       Evaluate ${userRole.name}’s performance based on several key negotiation tactics and provide a score on a scale of 1-10 for each tactic.
      For each tactic, provide 2-3 specific examples from the transcript to illustrate where ${userRole.name} demonstrated that tactic effectively or ineffectively.
      Provide an overall summary that describes ${userRole.name}’s strategy in the negotiation, and specific examples of when they employed those strategies well, or not so well. Start your summary with a sentence directly addressing ${userRole.name}, by name and role, before proceeding to the rest of your summary.
     
       Return the result in JSON format with the following structure:
      {
          "summary": "string",
          "tactics": {
              "Assertiveness": { "score": number, "examples": ["string"] },
              "Adaptability": { "score": number, "examples": ["string"] },
               "Empathy": { "score": number, "examples": ["string"] },
              "Strategic Thinking": { "score": number, "examples": ["string"] },
              "Communication": { "score": number, "examples": ["string"] },
               "Compromise": { "score": number, "examples": ["string"] }
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
        
        
          const radarData = Object.entries(parsedAnalysis.tactics).map(([name, value]) => ({
              skill: name,
              score: value.score,
          }));

        setRadarData(radarData)
          return parsedAnalysis;
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
      

      if (analysisData && outcomeData) {
        const outcome = outcomeData.outcome;
        const outcomeReason = outcomeData.reason;
          setDebriefing((prev) => ({
              ...prev,
              strengths: analysisData.tactics ? Object.entries(analysisData.tactics)
                   .filter(([, value]) => value.score > 7)
                   .map(([key]) => key) : ['None'],
                areasForImprovement:  analysisData.tactics ? Object.entries(analysisData.tactics)
                   .filter(([, value]) => value.score < 6)
                   .map(([key]) => key) : ['None'],
              overallScore: Math.round(effectivenessScore),
               letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
                 advice: outcome === 'win' ? 'Continue refining your strategies. Your approach was effective in this negotiation.':  outcome === 'lose' ? 'Consider revising your approach for better results. Take a closer look at the areas needing improvement.': 'Try again to find a more clear outcome. Be sure to use a strategic approach to get the outcome you want.',
               transcript: chatHistory,
                outcome: outcome,
               outcomeReason: outcomeReason,
               summary: analysisData.summary,
               tactics: analysisData.tactics
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
       setShowFeedback(false); // Also reset the feedback toggle
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
                    <CardContent className="chat-history-container" ref={chatHistoryContainerRef}>
                    <div className="chat-history">
                      {chatHistory.map((msg, index) => (
                        <div
                          key={msg.id}
                          className={`chat-message ${msg.role}`}
                          style={{ display: 'block' }}
                        >
                          {msg.role === 'feedback' ? (
                            <div
                                className={`feedback-box ${msg.hidden ? 'hidden' : ''}`}
                                style={{ display: msg.hidden ? 'none' : 'block' }}
                            >
                              <h4 className="feedback-title">
                                <Info className="icon" />
                                Feedback
                              </h4>
                                {msg.content?.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                              ))}
                            </div>
                          ) : (
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
                          {msg.role !== 'feedback' && msg.feedback && msg.feedbackVisible && (
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
                                        e.preventDefault(); // Prevent newline
                                        sendUserReply();
                                      }
                                    }}
                                  />
                                  <Button onClick={sendUserReply} className="send-button">
                                      Send <SendHorizontal style={{ marginLeft: '8px' }} />
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
                  <strong>Strengths:</strong>{' '}
                
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
                  <strong>Areas for Improvement:</strong>{' '}
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
component: NegotiationModule,  
};  

export default NegotiationModule;