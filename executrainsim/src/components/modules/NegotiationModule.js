import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Define negotiation types with titles and methodologies
const negotiationTypes = {
    corporate: [
        { value: 'contract', title: 'Contract/Service Agreement' },
        { value: 'credit', title: 'Credit/Lending' },
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
        { value: 'custom', title: 'Custom Area' } // Custom option for Corporate
    ],
    harvard: [
        { value: 'partnership', title: 'Partnership/Joint Venture' },
        { value: 'community_disputes', title: 'Community Disputes' },
        { value: 'environmental_agreements', title: 'Environmental Agreements' },
        { value: 'long_term_contracts', title: 'Long-Term Contracts' },
        { value: 'internal_conflicts', title: 'Internal Conflicts' },
        { value: 'custom', title: 'Custom Area' } // Custom option for Harvard
    ],
    fbi: [
        { value: 'crisis_management', title: 'Crisis Management' },
        { value: 'labor_disputes', title: 'Labor Disputes' },
        { value: 'customer_escalations', title: 'Customer Escalations' },
        { value: 'internal_investigations', title: 'Internal Investigations' },
        { value: 'regulatory_compliance', title: 'Regulatory Compliance' },
        { value: 'hostage_negotiation', title: 'Hostage Negotiation (Simulated)' }, // Added simulated hostage negotiation
        { value: 'custom', title: 'Custom Area' } // Custom option for FBI
    ]
};

// Define negotiation subtypes for different types and methodologies
const negotiationSubTypes = {
    corporate: { // Subtypes for Corporate Methodology
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
    },
    harvard: { // Subtypes for Harvard Methodology
        partnership: [
            'Business Partnership Agreement',
            'Community Partnership Initiative',
            'International Collaboration',
            'Joint Research Project',
            'Non-Profit Alliance',
            'Strategic Alliance'
        ],
        community_disputes: [
            'Environmental Concerns',
            'Local Development Project',
            'Noise Pollution Issues',
            'Public Space Usage',
            'Resource Allocation',
            'Zoning Regulation Debate'
        ],
        environmental_agreements: [
            'Carbon Emission Reduction',
            'Conservation Land Trust',
            'Pollution Control Treaty',
            'Renewable Energy Project',
            'Sustainable Resource Management',
            'Wildlife Protection Pact'
        ],
        long_term_contracts: [
            'Decade-Long Supply Contract',
            'Generational Lease Agreement',
            'Infrastructure Maintenance Contract',
            'Strategic Outsourcing Partnership',
            'Thirty-Year Service Agreement',
            'Utility Service Agreement'
        ],
        internal_conflicts: [
            'Department Budget Allocation',
            'Inter-Team Project Dispute',
            'Management Style Clash',
            'Office Space Reorganization',
            'Resource Priority Conflict',
            'Strategic Direction Disagreement'
        ],
    },
    fbi: { // Subtypes for FBI Methodology
        crisis_management: [
            'Hostage Situation (Simulated)', // Re-iterating simulated hostage situation
            'Cybersecurity Breach Crisis',
            'Major Product Recall',
            'Public Relations Disaster',
            'Sudden Executive Departure',
            'Workplace Violence Incident'
        ],
        labor_disputes: [
            'Airline Pilot Strike',
            'Factory Worker Union Negotiations',
            'Healthcare Staff Shortage Crisis',
            'Teacher Union Impasse',
            'Transit Worker Strike',
            'Unfair Labor Practice Claim'
        ],
        customer_escalations: [
            'Defective Product Complaint',
            'Executive Customer Intervention',
            'High-Profile Account Threat',
            'Service Outage Apology',
            'Social Media Backlash Control',
            'VIP Client Dissatisfaction'
        ],
        internal_investigations: [
            'Corporate Espionage Case',
            'Embezzlement Investigation',
            'Harassment Claim Resolution',
            'Insider Trading Suspicions',
            'Misconduct Allegation Review',
            'Whistleblower Case'
        ],
        regulatory_compliance: [
            'Environmental Regulation Violation',
            'Financial Audit Failure',
            'Health and Safety Inspection Crisis',
            'Industry Compliance Deadline',
            'New Data Privacy Law Rollout',
            'Securities Law Infringement'
        ],
        hostage_negotiation: [ // Subtypes for Simulated Hostage Negotiation
            'Bank Robbery Hostage',
            'Business Executive Kidnapping',
            'Embassy Siege Scenario',
            'School Bus Hostage',
            'Terrorist Kidnapping Simulation',
            'Workplace Lockdown Situation'
        ]
    }
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
        return messageContent; // If it's an object, return it directly
    }

    return apiResponse;
};

// Generate sample BATNA
const generateSampleBATNAFromAPI = async (scenarioContext, selectedRoleName, desiredOutcome) => {
    const prompt = `
    Given the negotiation scenario: "${scenarioContext}",
    where the user is playing the role of "${selectedRoleName}" and desires the outcome: "${desiredOutcome}",
    suggest a realistic and effective Best Alternative to a Negotiated Agreement (BATNA).

    The BATNA should be a concrete action or option the user could pursue if they fail to reach an agreement.
    It should be specific to the scenario and represent a viable alternative.

    Respond with the BATNA in JSON format:
    {
      "batna": "A concise description of a realistic BATNA option for the user"
    }
  `;

    try {
        const rawResponse = await fetchOpenAIResponse({
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.7,
            max_tokens: 200,
        }, '/api/generate');
        const parsedResponse = parseAiJson(rawResponse);
        return parsedResponse?.batna || 'Could not generate a sample BATNA. Please try again or define your own.';
    } catch (error) {
        console.error('Error generating sample BATNA:', error);
        return 'Error generating sample BATNA. Please try again or define your own.';
    }
};

// MAIN COMPONENT
const NegotiationModule = ({ onReturn }) => {
    const [negotiationMethodology, setNegotiationMethodology] = useState('corporate'); // Default to corporate
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
    const [areResponseHintsVisible, setAreResponseHintsVisible] = useState(true); //response hints
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
    const [isBATNASectionVisible, setIsBATNASectionVisible] = useState(false); // BATNA section visibility
    const [isGeneratingBATNA, setIsGeneratingBATNA] = useState(false); // BATNA generating state
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const chatHistoryContainerRef = useRef(null);
    const [aiPerformanceValues, setAiPerformanceValues] = useState({
        Assertiveness: 0,
        Flexibility: 0,
        Empathy: 0,
        'Strategic Planning': 0,
        'Clarity of Communication': 0,
        'Collaborative Problem Solving': 0,
    });
    const [progress, setProgress] = useState(50);
    const [userBATNA, setUserBATNA] = useState('');

    const [opponentPersonalitySetting] = useState({
        collaborative: {
            tone: 'friendly, casual, and lighthearted',
            complexity: 'simple negotiation tactics, often making concessions',
            strategy: 'accommodating and quick to compromise, focus on common ground',
            reactivity: `responds positively to user's points, often conceding or agreeing, seeks harmony and common ground. Uses casual, friendly language and humor to build rapport.`,
        },
        slightlyCollaborative: {
            tone: 'generally friendly and accommodating but occasionally firm',
            complexity: 'simple negotiation tactics with some strategic thinking, less frequent concessions',
            strategy: 'mostly accommodating but will attempt to get a slightly better deal while focusing on common ground',
            reactivity: `responds generally positively to user's points, occasionally concedes, and uses friendly language.`,
        },
        balanced: {
            tone: 'professional, but still friendly and relatable',
            complexity: 'standard negotiation strategies, sometimes challenges the user but aims for mutual benefit',
            strategy: 'firm but fair, seeking mutual benefit, will defend key points well',
            reactivity: `responds directly to the user's points, uses balanced responses that consider both positions. Uses relatable, friendly language.`,
        },
        slightlyAggressive: {
            tone: 'assertive but generally respectful with occasional challenges',
            complexity: 'standard negotiation strategies with some advanced tactics, often challenging the user directly',
            strategy: 'prioritizes own interests but also seeks mutual benefit, often challenges user’s points but might concede for a significant benefit',
            reactivity: `responds directly to the user's points, sometimes aggressively undermines them, occasionally concedes. Uses challenging but respectful language.`,
        },
        aggressive: {
            tone: 'highly assertive, sometimes combative',
            complexity: 'advanced negotiation tactics, often uses strong or confrontational statements',
            strategy: 'prioritizes own interests, uses direct challenges or put-downs, rarely concedes without major gain',
            reactivity: `attempts to dominate, actively undermines user's points, rarely concedes unless strongly beneficial. May use sarcasm or put-downs.`,
        },
        disruptive: { // New "Disruptive" personality setting
            tone: 'erratic and unpredictable, shifting between friendly and aggressive',
            complexity: 'highly нестандартные and often illogical tactics, uses diversions and personal attacks', // Using 'нестандартные' as a placeholder for unconventional in English
            strategy: 'unpredictable and ego-driven, may change demands impulsively, uses personal attacks and bluffs',
            reactivity: `responds emotionally and unpredictably, may ignore user points or shift topics abruptly, uses personal remarks and aggressive language.`,
        },
    });


    useEffect(() => {
        if (chatHistoryContainerRef.current) {
            chatHistoryContainerRef.current.scrollTop = chatHistoryContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const selectedRoleObject = scenario?.roles?.find((role) => role.name === selectedRole);

    // Convert HTML <p> blocks to line breaks
    const convertParagraphsToLineBreaks = (htmlString) => {
        if (!htmlString) return '';
        try {
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
            // fallback
            return htmlString.replace(/<p>|<\/p>/g, '').replace(/<br\s*\/?>/gi, '\n');
        }
    };

    // Convert line breaks to <p> blocks
    const convertLineBreaksToParagraphs = (text) => {
        if (!text) return '';
        return text
            .split('\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph !== '')
            .map(paragraph => `<p>${paragraph}</p>`)
            .join('');
    };

    // handle text area "Enter" to send
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendUserReply();
        }
    };

    // Add a message to chat history
    const addMessageToHistory = (content, role, scores) => {
        const roleName =
            role === 'user'
                ? selectedRole
                : scenario?.roles.find((r) => r.name !== selectedRole)?.name || 'Unknown';

        const sanitizedContent = DOMPurify.sanitize(content);
        const newMessage = {
            content: sanitizedContent,
            role,
            name: roleName,
            timestamp: generateSequentialTimestamp(),
            id: Date.now(),
            feedbackVisible: false,
            scores: scores || null,
        };

        setChatHistory((prev) => [...prev, newMessage]);
    };

    // Update roles from text inputs
    const updateRoles = (newRole, index) => {
        const newRoles = [...roles];
        newRoles[index] = newRole;
        setRoles(newRoles);

        if (scenario) {
            scenario.roles[index].name = newRole;
        }
    };

    // Opponent personality slider
    const handleOpponentPersonalityChange = (event) => {
        const index = parseInt(event.target.value, 10);
        const personalityKeys = Object.keys(opponentPersonalitySetting);
        setOpponentPersonality(personalityKeys[index]);
    };

    const getOpponentPersonalitySettings = (personality) => {
        return opponentPersonalitySetting[personality] || opponentPersonalitySetting['balanced'];
    };

    // fetchOpenAIResponse
    const fetchOpenAIResponse = async (input, endpointPath, isUserAction = false) => {
        try {
            const response = await axios.post(`${API_BASE_URL}${endpointPath}`, input);
            return response.data;
        } catch (error) {
            console.error('Error fetching from OpenAI:', error);
            return null;
        }
    };

    // Generate an image (DALL-E, etc.)
    const generateImage = async (title, context) => {
        setImageStatus('loading');
        const prompt = `Illustrate the negotiation scenario titled "${title}" with context: "${context}". The illustration should resemble colorful, writing-free, diverse universal stock art from the 1990s with simple, clean lines.`;

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

    const retryImageGeneration = (title, context) => {
        setErrorMessage('');
        generateImage(title, context);
    };

    // Generate scenario
    const generateScenario = async () => {
        setIsLoadingScenario(true);
        try {
            if (negotiationType === 'custom') {
                setIsCustomInputMode(true);
                return;
            }
            const selectedType = negotiationTypes[negotiationMethodology].find((type) => type.value === negotiationType)?.title;
            const selectedSub = negotiationSubTypes[negotiationMethodology][negotiationType]?.find(
                (subType) => subType === negotiationSubType
            );

            if (!selectedType) {
                setErrorMessage('Please select a negotiation type.');
                return;
            }
            setErrorMessage('');
            const subTxt = selectedSub ? ` with a focus on ${selectedSub}` : '';
            const prompt = `
        Create a ${selectedType} negotiation scenario${subTxt}.
        Provide a detailed description including the context,
        two distinct roles with realistic names, and their conflicting objectives.
        Include potential challenges for each role.
        Add a numeric 'goal' field.
        Generate 4-6 role-agnostic desired outcomes based on the context.
        Return JSON:
        {
          "scenario": {
              "title": "string",
              "goal": "number",
              "context": "<p>...</p><p>...</p>",
              "roles": [
                  { "name": "string", "role": "string", "objective": "string" }
              ],
              "desiredOutcomes": ["..."]
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
        } finally {
            setIsLoadingScenario(false);
        }
    };

    const handleCustomScenarioSubmit = async () => {
        setIsFetchingScenario(true);
        try {
            const prompt = `
        Create a custom negotiation scenario based on the user input: ${customScenarioInput}.
        Provide a detailed description, context, two conflicting roles, potential challenges,
        a numeric 'goal', and 4-6 desired outcomes.
        Return the scenario in JSON format:
        {
          "scenario": {
              "title": "string",
              "goal": "number",
              "context": "<p>...</p><p>...</p>",
              "roles": [
                  { "name": "string", "role": "string", "objective": "string" }
              ],
              "desiredOutcomes": ["..."]
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
                setErrorMessage('Failed to generate custom scenario. Please try again.');
            }
        } catch (error) {
            console.error('generateScenario Error:', error);
            setErrorMessage('An error occurred while generating the custom scenario.');
        } finally {
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
    };

    const handleScenarioChange = (field, value) => {
        setEditableScenario((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveScenario = () => {
        // convert new lines to <p>
        const cleanedContext = editableScenario.context
            .replace(/<p>|<\/p>/g, '')
            .split('\n')
            .map((paragraph) => paragraph.trim())
            .filter((p) => p !== '')
            .map((p) => `<p>${p}</p>`)
            .join('');

        // update scenario
        setEditableScenario((prev) => ({
            ...prev,
            context: cleanedContext,
        }));
        setScenario((prev) => ({
            ...prev,
            context: cleanedContext,
            title: editableScenario.title,
        }));
        setIsScenarioEditable(false);
    };

    const handleGenerateBATNAClick = async () => {
        if (!desiredOutcome || !selectedRole || !scenario) {
            setErrorMessage('Please select your role and outcome before generating a BATNA.');
            return;
        }
        setIsGeneratingBATNA(true);
        setErrorMessage('');
        try {
            const sampleBatna = await generateSampleBATNAFromAPI(
                scenario.context,
                selectedRole,
                desiredOutcome
            );
            setUserBATNA(sampleBatna);
        } catch (error) {
            console.error('BATNA Generation Error:', error);
            setErrorMessage('Failed to generate BATNA. Please try again.');
        } finally {
            setIsGeneratingBATNA(false);
        }
    };

    const startNegotiation = async () => {
        if (!selectedRole || !desiredOutcome) {
            setErrorMessage('Please select a role and desired outcome.');
            return;
        }
        if (isBATNASectionVisible && !userBATNA.trim()) {
            setErrorMessage('Please define your BATNA before starting.');
            return;
        }
        if (desiredOutcome === 'custom' && !customOutcomeInput.trim()) {
            setErrorMessage('Please enter a custom outcome.');
            return;
        }
        setNegotiationStarted(true);
        setErrorMessage('');

        try {
            const userRole = scenario.roles.find((r) => r.name === selectedRole);
            const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);

            if (!userRole || !opponentRole) {
                throw new Error('Roles not correctly set or not found.');
            }

            // Prompt for opponent objective
            const opponentObjectivePrompt = `
        Generate a specific objective for the role of ${opponentRole.role}.
        Return JSON: { "opponentObjective": "string" }
      `;
            const rawObjectiveResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: opponentObjectivePrompt }], temperature: 0.7, max_tokens: 150 },
                '/api/generate'
            );
            const parsedObjective = parseAiJson(rawObjectiveResponse);
            opponentRole.objective =
                parsedObjective?.opponentObjective || 'Negotiate effectively.';

            // Opponent opening message
            const openingPrompt = `
        As ${opponentRole.name}, in your role as "${opponentRole.role}",
        provide a direct opening message to ${userRole.name} with a concrete offer and a deadline.
        Return JSON: { "message": "<p>...</p>" }
      `;
            const rawOpeningResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: openingPrompt }], temperature: 0.7, max_tokens: 500 },
                '/api/generate'
            );
            const parsedOpening = parseAiJson(rawOpeningResponse);
            const opponentMessageContent = parsedOpening?.message || 'Unable to fetch opening message.';
            if (opponentMessageContent) {
                addMessageToHistory(opponentMessageContent, 'opponent', 0);
            }

            // Set initial progress from performanceScore
            let scaledProgress = (performanceScore / scenario.goal) * 100;
            if (scaledProgress > 100) scaledProgress = 100;
            setProgress(scaledProgress);

            // Generate initial user response options
            generateResponseOptions(scenario?.context);
        } catch (error) {
            console.error('Error generating opening message:', error);
            setErrorMessage('Failed to generate the opponent’s opening message.');
        }
    };

    const getLatestMessage = (role) => {
        return (
            chatHistory.filter((msg) => msg.role === role).slice(-1)[0]?.content || ''
        );
    };

    const createResponseOptionsPrompt = (context, latestOpponentMessage, previousUserMessage) => `
    Based on the negotiation scenario: ${context},
    consider the latest opponent message: "${latestOpponentMessage}"
    and the user's previous message: "${previousUserMessage}".
    Generate four strategic response options, each describing a high-level negotiation tactic
    (e.g. Counter Offer, Concede, Bargain, Delay, etc.).
    Return JSON: { "options": [{ "name": "string", "description": "string" }, ...] }
  `;

    const generateResponseOptions = async (context) => {
        if (!selectedRole || !desiredOutcome) return;
        const latestOpponentMessage = getLatestMessage('opponent');
        const previousUserMessage = getLatestMessage('user');
        const prompt = createResponseOptionsPrompt(
            context,
            latestOpponentMessage,
            previousUserMessage
        );
        setIsResponseLoading(true);
        setIsSpinning(true);
        try {
            const rawResponse = await fetchOpenAIResponse({
                messages: [{ role: 'system', content: prompt }],
                temperature: 0.7,
                max_tokens: 550,
            },
                '/api/generate');
            handleResponseOptions(rawResponse);
        } catch (error) {
            handleError('Failed to generate response options.', error);
        } finally {
            setIsResponseLoading(false);
            setIsSpinning(false);
        }
    };

    const handleResponseOptions = (rawResponse) => {
        if (!rawResponse) {
            console.error('Received empty response from API.');
            setErrorMessage('Failed to generate response options.');
            return;
        }
        const parsed = parseAiJson(rawResponse);
        if (parsed?.options) {
            setResponseOptions(parsed.options);
            setButtonRevealComplete(false);
            setIsSpinning(false);
        } else {
            console.error('Invalid response structure:', parsed);
            setErrorMessage('Failed to generate response options.');
        }
    };

    const generateUserResponse = async (strategyDescription) => {
        const userRole = scenario.roles.find((r) => r.name === selectedRole);
        const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);

        const prompt = `
      As ${userRole.name}, respond to ${opponentRole.name} using the strategy: "${strategyDescription}".
      Keep it short, direct, casual, and professional.
      Return JSON: { "message": "<p>...</p>" }
    `;
        try {
            const rawResponse = await fetchOpenAIResponse({
                messages: [{ role: 'system', content: prompt }],
                temperature: 0.7,
                max_tokens: 500,
            }, '/api/generate', true);
            handleUserResponse(rawResponse);
        } catch (error) {
            handleError('Failed to generate user draft.', error);
        }
    };

    const handleUserResponse = (rawResponse) => {
        const parsed = parseAiJson(rawResponse);
        if (parsed?.message) {
            const messageWithLineBreaks = convertParagraphsToLineBreaks(parsed.message);
            setUserDraft(messageWithLineBreaks);
        } else {
            setErrorMessage('Failed to generate user draft.');
        }
    };

    const handleError = (message, error) => {
        console.error(message, error);
        setErrorMessage(message);
    };

    // Generate feedback for user's message
    const generateFeedback = async (userMessage, userBATNA) => {
        const userRole = scenario.roles.find((r) => r.name === selectedRole);
        const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);

        let methodologySpecificFeedbackPrompt = "";

        switch (negotiationMethodology) {
            case 'harvard':
                methodologySpecificFeedbackPrompt = `
                    Evaluate how well the user applied Harvard Principled Negotiation:
                    - Did they separate people from the problem?
                    - Did they focus on interests over positions?
                    - Did they invent options for mutual gain?
                    - Did they use objective criteria?
                    - How effectively did they consider their BATNA and the opponent's potential BATNA?
                `;
                break;
            case 'fbi':
                methodologySpecificFeedbackPrompt = `
                    Evaluate how well the user applied FBI Hostage Negotiation techniques and the Behavioral Change Stairway Model (BCSM):
                    - Active Listening: Did they demonstrate active listening?
                    - Tactical Empathy: Did they show tactical empathy by labeling emotions?
                    - Rapport Building: Did they attempt to build rapport?
                    - Influence and Persuasion: How influential was their message?
                    - Composure and Patience: Did they maintain composure and patience?
                `;
                break;
            case 'corporate':
            default:
                methodologySpecificFeedbackPrompt = `
                    Evaluate the user's negotiation using standard corporate negotiation strategies:
                    - Balance of Competitive and Collaborative Tactics: Was the balance appropriate?
                    - Preparation: Based on the message, how well-prepared do they seem?
                    - Agenda Setting: Did they attempt to influence the agenda or flow of negotiation?
                    - Effectiveness of Concessions: Were concessions strategic and effective?
                `;
                break;
        }


        const feedbackPrompt = `
            Analyze user's message: "${userMessage}" in context of the scenario.
            ${methodologySpecificFeedbackPrompt}
            Evaluate how effectively they used their BATNA: "${userBATNA}".
            Score from -2 to +2 in: Assertiveness, Flexibility, Empathy, Strategic Planning,
            Clarity of Communication, Collaborative Problem Solving.
            Provide overall feedback and justifications for scores based on the chosen methodology.
            Return JSON:
            {
                "feedback": "<p>...</p>",
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
            return parseAiJson(rawFeedbackResponse);
        } catch (error) {
            console.error('Failed to generate feedback:', error);
            return null;
        }
    };

    // Generate the opponent's response
    const generateOpponentResponse = async (lastUserMessage) => {
        try {
            const userRole = scenario.roles.find((r) => r.name === selectedRole);
            const opponentRole = scenario.roles.find((r) => r.name !== selectedRole);
            if (!userRole || !opponentRole) {
                throw new Error('Roles not correctly set or not found.'); // Corrected Error
            }

            const settings = getOpponentPersonalitySettings(opponentPersonality);
            const chatHistoryString = chatHistory.map((m) => `${m.name}: ${m.content}`).join('\n');

            const systemPrompt = getSystemPrompt(opponentRole, userRole, userBATNA, chatHistoryString, settings);

            const opponentPrompt = `
      As ${opponentRole.name}, respond to the last user message: "${lastUserMessage}".
      Keep it short, direct, and professional for a chat interface.
      Return JSON: { "message": "<p>...</p>" }
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
            if (!rawResponse) throw new Error('No response from AI server');

            const parsed = parseAiJson(rawResponse);
            const finalMessage = parsed?.message;
            if (!finalMessage) throw new Error('Opponent response invalid JSON.');

            addMessageToHistory(finalMessage.trim(), 'opponent', 0);

            const outcome = assessNegotiationOutcome();
            if (outcome && outcome.outcome !== 'Draw') {
                finalizeSimulation();
                return;
            }
            return finalMessage.trim();
        } catch (error) {
            console.error('Failed to generate opponent response:', error);
            setErrorMessage('Failed to generate opponent response. Please try again.');
            return null;
        } finally {
            setIsFetchingOpponent(false);
        }
    };

    const getSystemPrompt = (opponentRole, userRole, userBATNA, chatHistoryString, opponentPersonalitySettings) => {
        let methodologyPrompt = "";

        switch (negotiationMethodology) {
            case 'harvard':
                methodologyPrompt = `You are trained in Harvard Principled Negotiation. Focus on interests, not positions. Seek win-win solutions. Use objective criteria. Be aware of BATNA and help the user explore theirs.`;
                break;
            case 'fbi':
                methodologyPrompt = `You are trained in FBI Hostage Negotiation techniques. Use active listening, tactical empathy, calibrated questions, and mirroring. Build rapport gradually. Be patient and composed, even under pressure.`;
                break;
            case 'corporate':
            default:
                methodologyPrompt = `You are using standard corporate negotiation strategies, blending competitive and collaborative tactics. Be firm but fair. Seek mutual benefit where possible, but prioritize your own interests.`;
                break;
        }


        const settings = opponentPersonalitySettings; // Get personality settings

        return `
            You are ${opponentRole.name}, the ${opponentRole.role}.
            Your goal is to ${opponentRole.objective}.
            Negotiation Methodology: ${methodologyPrompt}
            Tone: ${settings.tone}, complexity: ${settings.complexity}, strategy: ${settings.strategy}.
            The user's BATNA is: "${userBATNA}".
            Chat so far:
            ${chatHistoryString}
        `;
    };


    // Generate debriefing
    const analyzeNegotiation = async () => {
        const userRole = scenario.roles.find((r) => r.name === selectedRole);
        const transcript = chatHistory.filter((msg) => msg.role !== 'feedback');

        let methodologySpecificAnalysisPrompt = "";

        switch (negotiationMethodology) {
            case 'harvard':
                methodologySpecificAnalysisPrompt = `
                    Debrief the negotiation using the framework of Harvard Principled Negotiation.
                    Analyze how effectively the user applied:
                    - Separation of people from the problem
                    - Focus on interests, not positions
                    - Invention of options for mutual gain
                    - Use of objective criteria
                    - BATNA awareness and consideration

                `;
                break;
            case 'fbi':
                methodologySpecificAnalysisPrompt = `
                    Debrief the negotiation using the framework of FBI Hostage Negotiation Techniques and BCSM.
                    Analyze how effectively the user employed:
                    - Active Listening
                    - Tactical Empathy
                    - Rapport Building
                    - Influence and Behavior Change
                    - Composure and Patience
                `;
                break;
            case 'corporate':
            default:
                methodologySpecificAnalysisPrompt = `
                    Provide a strategic debrief of the negotiation in the context of standard corporate negotiation strategies.
                    Analyze the user's:
                    - Use of Competitive vs. Collaborative Tactics
                    - Preparation and Strategy
                    - Agenda Setting Skills
                    - Effectiveness in Making Concessions

                `;
                break;
        }


        const analysisPrompt = `
            Provide a strategic debrief of the negotiation (scenario context: "${scenario.context}").
            The user is ${userRole.name}, role: ${userRole.role}, with a BATNA: "${userBATNA}".
            ${methodologySpecificAnalysisPrompt}
            Evaluate user performance using a 1-10 scale for:
            - Assertiveness
            - Flexibility
            - Empathy
            - Strategic Planning
            - Clarity of Communication
            - Collaborative Problem Solving

            Include examples from transcript: ${JSON.stringify(transcript, null, 2)}

            Return JSON:
            {
                "Summary": "string",
                "Tactics": {
                    "Assertiveness": {
                        "score": number,
                        "strategicHighlights": ["string"],
                        "recommendations": ["string"]
                    },
                    ... // for all tactics
                }
            }
        `;

        try {
            const rawAnalysisResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: analysisPrompt }] },
                '/api/generate'
            );
            const parsedAnalysis = parseAiJson(rawAnalysisResponse);

            if (parsedAnalysis) {
                const radarDataFormatted = parsedAnalysis.Tactics
                    ? Object.entries(parsedAnalysis.Tactics).map(([name, value]) => ({
                        skill: name,
                        score: value.score,
                    }))
                    : null;

                setDebriefing((prev) => ({
                    ...prev,
                    summary: parsedAnalysis.Summary,
                    tactics: parsedAnalysis.Tactics,
                }));
                setRadarData(radarDataFormatted);

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


    // Assess outcome
    const assessNegotiationOutcome = () => {
        if (performanceScore >= 5) {
            return { outcome: 'Win', reason: 'Objective reached.' };
        } else if (performanceScore <= -5) {
            return { outcome: 'Lose', reason: 'Performance fell short.' };
        }
        if (currentTurnIndex >= 10) {
            return { outcome: 'Draw', reason: 'No decisive result within 10 turns.' };
        }
        return null;
    };

    const dismissFeedback = (messageId) => {
        setChatHistory((prev) =>
            prev.map((msg) =>
                msg.id === messageId ? { ...msg, feedbackVisible: false } : msg
            )
        );
    };

    const handleFeedbackClick = (event, messageId) => {
        const tooltipX = event.clientX + 10;
        const tooltipY = event.clientY + 10;
        setTooltipPosition({ x: tooltipX, y: tooltipY });
        setChatHistory((prev) =>
            prev.map((msg) =>
                msg.id === messageId
                    ? { ...msg, feedbackVisible: !msg.feedbackVisible }
                    : msg
            )
        );
    };

    const handleButtonAnimationComplete = () => {
        setButtonRevealComplete(true);
    };

    const toggleFeedback = () => {
        setShowFeedback(!showFeedback);
    };

    const toggleResponseHints = () => {
        setAreResponseHintsVisible(!areResponseHintsVisible);
    };


    const generateRecommendation = async () => {
        const userRole = scenario.roles.find((r) => r.name === selectedRole);
        const transcript = chatHistory.filter((msg) => msg.role !== 'feedback');

        const analysisPrompt = `
    Based on transcript: "${JSON.stringify(transcript)}",
    scenario: "${scenario.context}", and user's BATNA: "${userBATNA}",
    provide advice on what to improve next time. Return a single string.
  `;
        try {
            const rawRecommendationResponse = await fetchOpenAIResponse({
                messages: [{ role: 'system', content: analysisPrompt }] },
                '/api/generate');
            return parseAiJson(rawRecommendationResponse);
        } catch (error) {
            console.error('Failed to generate recommendation:', error);
            return "Try again to find a clearer outcome. Consider refining your approach.";
        }
    };

    const finalizeSimulation = async () => {
        try {
            const outcomeData = assessNegotiationOutcome(); // Use your existing outcome assessment
            const analysisData = await analyzeNegotiation();

            if (analysisData && outcomeData) {
                const userStrategyEffectiveness = chatHistory.filter(msg => msg.role === 'user').length;
                const totalMessages = chatHistory.length;
                const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 10; // Example calculation

                setDebriefing({
                    strengths: analysisData.Tactics ? Object.entries(analysisData.Tactics)
                        .filter(([, value]) => value.score > 7)
                        .map(([key]) => key) : [],
                    areasForImprovement: analysisData.Tactics ? Object.entries(analysisData.Tactics)
                        .filter(([, value]) => value.score < 6)
                        .map(([key]) => key) : [],
                    overallScore: Math.round(effectivenessScore),
                    letterGrade: effectivenessScore > 8.5 ? 'A' : effectivenessScore > 7 ? 'B' : effectivenessScore > 5 ? 'C' : 'D',
                    advice: outcomeData.outcome === 'Win'
                        ? 'Continue refining your negotiation strategies.'
                        : 'Consider a different approach for improved negotiation outcomes.',
                    transcript: chatHistory,
                    outcome: outcomeData.outcome,
                    outcomeReason: outcomeData.reason,
                    summary: analysisData.Summary,
                    tactics: analysisData.Tactics,
                    userBATNA: userBATNA, // Include BATNA in debriefing
                });
            } else {
                setErrorMessage('Failed to generate a proper summary. Please try again.');
                setDebriefing(null); // Clear previous debriefing data
            }
        } catch (error) {
            console.error('Error finalizing simulation:', error);
            setErrorMessage('An error occurred while finalizing the simulation.');
            setDebriefing(null); // Clear previous debriefing data in case of error
        } finally {
            setSimulationComplete(true);
            // setActivePhase('debriefing'); //  This line is removed as it is not used.
        }
    };


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
        setScenarioGenerated(false);
        setCurrentTurnIndex(1);
        setRadarData(null);
        setResponseOptions([]);
        setButtonRevealComplete(true);
        setShowFeedback(true);
        setIsScenarioEditable(false);
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
        setUserBATNA('');
        setIsBATNASectionVisible(false); // Reset BATNA section visibility
        setNegotiationType('');
        setNegotiationSubType('');
        setIsCustomInputMode(false);
        setCustomScenarioInput('');
        setIsLoadingScenario(false);
        setIsFetchingScenario(false);
        setNegotiationMethodology('corporate'); // Reset methodology to default
    };

    // Simple nav for turn review (optional)
    const goToPreviousTurn = () => {
        if (currentTurnIndex > 1 && simulationComplete) {
            setCurrentTurnIndex((prev) => prev - 1);
        }
    };
    const goToNextTurn = () => {
        const totalTurns = Math.ceil(chatHistory.length / 2);
        if (currentTurnIndex < totalTurns && simulationComplete) {
            setCurrentTurnIndex((prev) => prev + 1);
        }
    };

    const renderScenarioSetup = () => (
        <Card className="full-width-card">
            <CardHeader>
                <CardTitle>Negotiation Setup</CardTitle>
                 {(isFetchingScenario || isLoadingScenario) && (
                    <div className="spinner-container">
                      <BarLoader color="#0073e6" width="100%" />
                    </div>
                )}
            </CardHeader>
            <CardContent>
             <div className="form-group">
                <label>Negotiation Methodology</label>
                <Select
                    value={negotiationMethodology}
                    onChange={(value) => {
                        setNegotiationMethodology(value);
                        setNegotiationType(''); // Reset negotiation type when methodology changes
                        setNegotiationSubType(''); // Reset subtype as well
                    }}
                >
                    <SelectItem value="corporate">Corporate Negotiation Strategies</SelectItem>
                    <SelectItem value="harvard">Harvard Principled Negotiation</SelectItem>
                    <SelectItem value="fbi">FBI Hostage Negotiation Techniques</SelectItem>
                </Select>
            </div>


                <div className="form-group">
                    <label>Negotiation Type</label>
                    <Select
                        value={negotiationType}
                        onChange={handleNegotiationTypeChange}
                    >
                        <SelectItem value="" disabled>Select a type</SelectItem>
                        {negotiationTypes[negotiationMethodology].map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.title}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                {negotiationType && negotiationType !== 'custom' && negotiationSubTypes[negotiationMethodology][negotiationType] && (
                    <div className="form-group">
                        <label>Negotiation Subtype</label>
                        <Select
                            value={negotiationSubType}
                            onChange={handleNegotiationSubTypeChange}
                        >
                            <SelectItem value="" disabled>Select a subtype</SelectItem>
                            {negotiationSubTypes[negotiationMethodology][negotiationType].map((subType) => (
                                <SelectItem key={subType} value={subType}>{subType}</SelectItem>
                            ))}
                        </Select>
                    </div>
                )}

                {isCustomInputMode && (
                    <div className="form-group">
                        <label>Describe the Negotiation Scenario:</label>
                        <textarea
                            value={customScenarioInput}
                            onChange={(e) => setCustomScenarioInput(e.target.value)}
                            className="custom-scenario-input"
                            placeholder="Enter the details of your custom negotiation scenario..."
                        />
                    </div>
                )}

                <Button
                    onClick={
                        negotiationType === 'custom'
                            ? handleCustomScenarioSubmit
                            : generateScenario
                    }
                    disabled={
                        (negotiationType === 'custom' && !customScenarioInput) ||
                        (negotiationType !== 'custom' && !negotiationType)
                    }
                >
                    {negotiationType === 'custom'
                        ? 'Generate Custom Scenario'
                        : 'Generate Scenario'
                    }
                </Button>


            </CardContent>
        </Card>
    );

    const renderDebriefingSection = () => (
        debriefing ? (
            <div className="debriefing-section">
                <h4 className="debriefing-title">Simulation Debriefing</h4>
                <div
                    style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}
                >
                    {radarData && (
                        <div style={{ width: '48%', height: 300 }}>
                            <ResponsiveContainer>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="skill" />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                    <Radar
                                        name="User"
                                        dataKey="score"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.6}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                            <p>
                                Radar scores in key tactics
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
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#8884d8"
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            <p>
                                Performance score by turn
                            </p>
                        </div>
                    )}
                </div>


                <div className="debriefing-text-container">
                    <p>
                        <strong>Summary:</strong>{' '}
                        {debriefing.summary?.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </p>
                </div>

                {debriefing.outcome && (
                    <div className="debriefing-text-container">
                        <p>
                            <strong>Outcome:</strong> {debriefing.outcome}
                        </p>
                        {debriefing.outcomeReason && (
                            <p>
                                <strong>Reason:</strong> {debriefing.outcomeReason}
                            </p>
                        )}
                    </div>
                )}

                <div className="debriefing-text-container">
                    <p>
                        <strong>Overall Score:</strong> {debriefing.overallScore}
                    </p>
                    <p>
                        <strong>Letter Grade:</strong> {debriefing.letterGrade}
                    </p>
                </div>

                <div className="debriefing-text-container">
                    <p>
                        <strong>Your Defined BATNA:</strong> {debriefing.userBATNA}
                    </p>
                </div>

                <div className="debriefing-text-container">
                    <p>
                        <strong>Advice:</strong> {debriefing.advice}
                    </p>
                </div>

                {/* Show tactics if available */}
                {debriefing.tactics && (
                    <div className="debriefing-text-container">
                        <h4>Tactic Scores</h4>
                        {Object.entries(debriefing.tactics).map(([key, val]) => (
                            <div key={key} style={{ marginBottom: '1em' }}>
                                <strong>{key}</strong>: Score = {val.score}
                                <br />
                                <em>Strategic Highlights:</em>
                                <ul>
                                    {val.strategicHighlights?.map((h, i) => (
                                        <li key={i}>{h}</li>
                                    ))}
                                </ul>
                                <em>Recommendations:</em>
                                <ul>
                                    {val.recommendations?.map((r, i) => (
                                        <li key={i}>{r}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                <Button onClick={() => setShowTranscript(!showTranscript)}>
                    {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                </Button>
                {showTranscript && (
                    <div className="transcript">
                        <h5>Full Transcript:</h5>
                        {chatHistory
                            .filter(
                                (msg) => msg.role === 'user' || msg.role === 'opponent'
                            )
                            .map((msg, index) => (
                                <div key={index}>
                                    <strong>{msg.name}:</strong>{' '}
                                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                </div>
                            ))}
                    </div>
                )}

                <div className="action-buttons">
                    <Button onClick={() => setSimulationComplete(false)}>
                        Try Different Choices
                    </Button>
                    <Button onClick={resetNegotiation}>Run Another Simulation</Button>
                </div>
            </div>
        ) : (
            <p>Debriefing data is missing.</p>
        )
    );
    const renderChatArea = () => (
        <div className="chat-area">
            <CardContent
                className="chat-history-container"
                ref={chatHistoryContainerRef}
            >
                <div className="chat-history">
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`chat-message ${msg.role}`}>
                            {msg.role === 'feedback' ? (
                                <div
                                    className="feedback-box"
                                    style={
                                        msg.feedbackVisible
                                            ? {
                                                top: tooltipPosition.y,
                                                left: tooltipPosition.x,
                                            }
                                            : {}
                                    }
                                    onClick={(e) => handleFeedbackClick(e, msg.id)}
                                >
                                    <h4 className="feedback-title">
                                        <Info className="icon" /> Feedback
                                    </h4>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: msg.content }}
                                    />
                                    {msg.scores && (
                                        <div className="feedback-scores">
                                            <span
                                                title="Assertiveness"
                                                className="score-item"
                                            >
                                                <Swords
                                                    style={{
                                                        color:
                                                            msg.scores.Assertiveness > 0
                                                                ? 'green'
                                                                : 'red',
                                                    }}
                                                />
                                                <span>
                                                    {msg.scores.Assertiveness > 0
                                                        ? `+${msg.scores.Assertiveness}`
                                                        : msg.scores.Assertiveness}
                                                </span>
                                            </span>
                                            <span
                                                title="Flexibility"
                                                className="score-item"
                                            >
                                                <HandCoins
                                                    style={{
                                                        color:
                                                            msg.scores.Flexibility > 0
                                                                ? 'green'
                                                                : 'red',
                                                    }}
                                                />
                                                <span>
                                                    {msg.scores.Flexibility > 0
                                                        ? `+${msg.scores.Flexibility}`
                                                        : msg.scores.Flexibility}
                                                </span>
                                            </span>
                                            <span title="Empathy" className="score-item">
                                                <HandHeart
                                                    style={{
                                                        color:
                                                            msg.scores.Empathy > 0
                                                                ? 'green'
                                                                : 'red',
                                                    }}
                                                />
                                                <span>
                                                    {msg.scores.Empathy > 0
                                                        ? `+${msg.scores.Empathy}`
                                                        : msg.scores.Empathy}
                                                </span>
                                            </span>
                                            <span
                                                title="Strategic Planning"
                                                className="score-item"
                                            >
                                                <LandPlot
                                                    style={{
                                                        color:
                                                            msg.scores['Strategic Planning'] > 0
                                                                ? 'green'
                                                                : 'red',
                                                    }}
                                                />
                                                <span>
                                                    {msg.scores['Strategic Planning'] > 0
                                                        ? `+${msg.scores['Strategic Planning']}`
                                                        : msg.scores['Strategic Planning']}
                                                </span>
                                            </span>
                                            <span
                                                title="Clarity of Communication"
                                                className="score-item"
                                            >
                                                <Speech
                                                    style={{
                                                        color:
                                                            msg.scores['Clarity of Communication'] >
                                                                0
                                                                ? 'green'
                                                                : 'red',
                                                    }}
                                                />
                                                <span>
                                                    {msg.scores['Clarity of Communication'] >
                                                        0
                                                        ? `+${msg.scores['Clarity of Communication']}`
                                                        : msg.scores['Clarity of Communication']}
                                                </span>
                                            </span>
                                            <span
                                                title="Collaborative Problem Solving"
                                                className="score-item"
                                            >
                                                <Handshake
                                                    style={{
                                                        color:
                                                            msg.scores[
                                                                'Collaborative Problem Solving'
                                                            ] > 0
                                                                ? 'green'
                                                                : 'red',
                                                    }}
                                                />
                                                <span>
                                                    {msg.scores[
                                                        'Collaborative Problem Solving'
                                                    ] > 0
                                                        ? `+${msg.scores[
                                                            'Collaborative Problem Solving'
                                                        ]
                                                        }`
                                                        : msg.scores[
                                                            'Collaborative Problem Solving'
                                                        ]}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => dismissFeedback(msg.id)}
                                        className="dismiss-button"
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <strong className="sender-name">Sender:</strong>{' '}
                                        {msg.name}
                                    </div>
                                    <div>
                                        <strong className="message-timestamp">Time:</strong>{' '}
                                        {msg.timestamp}
                                    </div>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: msg.content }}
                                    />
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


            <div className="message-input-container">
                {areResponseHintsVisible && (
                    <div className="response-options-container">
                        <div className="response-buttons">
                            {responseOptions.map((option, index) => (
                                <Button
                                    key={index}
                                    onClick={() => generateUserResponse(option.description)}
                                    disabled={isResponseLoading || !buttonRevealComplete}
                                    className={`response-button ${isResponseLoading ? 'loading' : ''
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
                )}


                <div className="feedback-toggle-container">
                    <label className="feedback-checkbox-label" style={{marginRight: '20px'}}>
                        <input
                            type="checkbox"
                            checked={areResponseHintsVisible}
                            onChange={toggleResponseHints}
                        />
                        {areResponseHintsVisible ?  'Hide Response Hints' : 'Show Response Hints'}
                    </label>
                    <label className="feedback-checkbox-label">
                        <input
                            type="checkbox"
                            checked={showFeedback}
                            onChange={toggleFeedback}
                        />
                        {showFeedback ?  <CheckSquare className="checkbox-icon-filled" /> : <Square className="checkbox-icon-empty" />}
                        Show Feedback
                    </label>
                </div>


                <div className="user-input-container">
                    <textarea
                        value={userDraft}
                        onChange={(e) => setUserDraft(e.target.value)}
                        className="user-draft-textarea"
                        placeholder="Type your reply here or select a response option above..."
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
    );

    const renderScenarioCardContent = () => (
        <>
            <CardHeader>
                <div className="scenario-title-container">
                    {isScenarioEditable ? (
                        <input
                            type="text"
                            value={editableScenario.title}
                            onChange={(e) =>
                                handleScenarioChange('title', e.target.value)
                            }
                            className="editable-scenario-title"
                            style={{
                                fontFamily: 'Jura, sans-serif',
                                fontSize: '2.5em',
                                color: 'black',
                                minWidth: '100%',
                            }}
                        />
                    ) : (
                        <CardTitle>{scenario.title}</CardTitle>
                    )}
                    <div className="spinner-container">
                        {isLoadingScenario && (
                            <BarLoader color="#0073e6" width="100%" />
                        )}
                    </div>
                    <div
                        className="scenario-description main-content-scenario-description"
                        dangerouslySetInnerHTML={{ __html: scenario.context }}
                    />
                    {negotiationType === 'custom' &&
                        scenarioGenerated &&
                        !isScenarioEditable && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    paddingLeft: '10px',
                                }}
                            >
                                <span
                                    onClick={handleScenarioEditToggle}
                                    className="edit-control-label"
                                >
                                    <Edit
                                        className="scenario-edit-icon"
                                        style={{ marginLeft: '5px' }}
                                    />
                                </span>
                            </div>
                        )}
                    {isScenarioEditable && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                paddingLeft: '10px',
                                marginBottom: '10px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span
                                style={{ whiteSpace: 'nowrap' }}
                                onClick={handleSaveScenario}
                                className="edit-control-label"
                            >
                                <Save style={{ marginLeft: '5px' }} />
                            </span>
                            <span
                                style={{ whiteSpace: 'nowrap' }}
                                onClick={handleCancelScenarioEdit}
                                className="edit-control-label"
                            >
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
                            {scenario.desiredOutcomes.map((outcome, i) => (
                                <option key={i} value={outcome}>
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

                    {/* BATNA Input */}
                    <div className="form-group">
                        <label className="feedback-checkbox-label">
                            <input
                                type="checkbox"
                                checked={isBATNASectionVisible}
                                onChange={handleBATNACheckboxChange}
                            />
                            Define Your BATNA
                            <Info
                                className="icon"
                                title="BATNA stands for Best Alternative to a Negotiated Agreement.  \n\nIt's what you'll do if no agreement is reached in this negotiation. \n\nDefining your BATNA is optional but recommended to inform your strategy and assess performance."
                                style={{ marginLeft: '5px' }}
                            />
                        </label>
                        {isBATNASectionVisible && (
                            <>
                                <textarea
                                    id="batna-input"
                                    className="custom-scenario-input"
                                    placeholder="e.g., Work with another supplier, Maintain status quo, etc."
                                    value={userBATNA}
                                    onChange={(e) => setUserBATNA(e.target.value)}
                                />
                                <Button
                                    onClick={handleGenerateBATNAClick}
                                    disabled={
                                        isGeneratingBATNA || !desiredOutcome || !selectedRole
                                    }
                                >
                                    {isGeneratingBATNA
                                        ? 'Generating BATNA...'
                                        : 'Generate BATNA'}
                                </Button>
                            </>
                        )}
                    </div>


                    <Button
                        onClick={() => {
                            startNegotiation();
                            setShowInstructions(false);
                        }}
                        className="start-button"
                        disabled={
                            !selectedRole ||
                            !desiredOutcome ||
                            (desiredOutcome === 'custom' &&
                                !customOutcomeInput.trim()) ||
                            (isBATNASectionVisible && !userBATNA.trim())
                        }
                    >
                        Start Negotiation
                    </Button>
                </div>
            </CardContent>
        </>
    );

    const handleNegotiationTypeChange = (value) => {
        setNegotiationType(value);
        setNegotiationSubType(''); // Clear subtype when type changes
        setIsCustomInputMode(value === 'custom');
    };

    const handleNegotiationSubTypeChange = (value) => {
        setNegotiationSubType(value);
    };

    const handleBATNACheckboxChange = (event) => {
        setIsBATNASectionVisible(event.target.checked);
    };

    const sendUserReply = async () => {
        if (!userDraft.trim()) return;
        setIsUserReplyLoading(true);
        setIsUserTurn(false);
        const currentMessage = userDraft.trim();
        setUserDraft('');
        addMessageToHistory(currentMessage, 'user');

        try {
            const feedbackData = await generateFeedback(currentMessage, userBATNA);
            if (feedbackData) {
                addMessageToHistory(feedbackData.feedback, 'feedback', feedbackData.scores);

                // Update performance score based on feedback - adjust logic as needed
                const scoreAggregates = Object.values(feedbackData.scores).reduce((sum, score) => sum + score, 0);
                const turnScore = Math.round(scoreAggregates / Object.keys(feedbackData.scores).length); // Average score
                setPerformanceScore((prevScore) => prevScore + turnScore);

                setPerformanceData((prevData) => [...prevData, { turn: currentTurnIndex, score: turnScore }]);
                setCurrentTurnIndex((prevIndex) => prevIndex + 1);

                // Calculate progress based on updated performanceScore
                let scaledProgress = ((performanceScore + turnScore) / scenario.goal) * 100;
                if (scaledProgress > 100) scaledProgress = 100;
                setProgress(scaledProgress);

                const outcome = assessNegotiationOutcome();
                if (outcome && outcome.outcome !== 'Draw') {
                    finalizeSimulation();
                    return;
                }
            }

            setIsFetchingOpponent(true);
            await generateOpponentResponse(currentMessage);

            generateResponseOptions(scenario?.context); // Generate new response options after opponent reply

        } catch (error) {
            console.error('Error in sendUserReply:', error);
            setErrorMessage('Failed to process turn or generate opponent response.');
        } finally {
            setIsUserReplyLoading(false);
            setIsUserTurn(true);
        }
    };


    // MAIN RENDER
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
                                ) : isCustomInputMode ? (
                                    <span>Custom Negotiation Setup</span>
                                ) : (
                                    <span>Negotiation Setup</span>
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

                    {/* Scenario Info (only after negotiationStarted) */}
                    {negotiationStarted && scenario && (
                        <div className="scenario-info">
                            <h3 className="left-column-scenario-title">{scenario.title}</h3>
                            <div
                                className="scenario-description left-column-scenario-description"
                                dangerouslySetInnerHTML={{ __html: scenario.context }}
                            />
                        </div>
                    )}


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
                            {!negotiationStarted && !scenarioGenerated && ( // <-- Conditional rendering here
                            <div className="module-description">
                                <h2>Negotiation Simulator</h2>
                                <p>
                                    Welcome to the Negotiation Simulator, where you will engage
                                    in strategic scenarios to hone your executive skills. This module focuses on negotiation, allowing you to practice and refine your approach in various business contexts.
                                </p>
                                <Button onClick={() => setShowInstructions(!showInstructions)}>
                                    {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                                </Button>
                                {showInstructions && (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: metadata.instructions }}
                                    />
                                )}
                            </div>
                        )}

                            {negotiationStarted && scenario && (
                                <div>
                                    <div className="role-info" style={{ marginBottom: '5px' }}>
                                        <strong>Your Role:</strong>
                                        <div className="role-details">
                                            {selectedRoleObject
                                                ? `${selectedRoleObject.name} - ${selectedRoleObject.role}`
                                                : 'Role not selected'}
                                        </div>
                                    </div>
                                    <p style={{ marginBottom: '5px' }}>
                                        <strong>Desired Outcome:</strong>{' '}
                                        {desiredOutcome === 'custom'
                                            ? customOutcomeInput
                                            : desiredOutcome}
                                    </p>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexDirection: 'column',
                                            padding: '10px',
                                            justifyContent: 'space-between',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        <h3 className="scenario-title">Performance Meter</h3>
                                        <div className="meter-container">
                                            <div className="meter-gradient">
                                                <div
                                                    className="meter-needle"
                                                    style={{ left: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    position: 'relative',
                                                    marginTop: '5px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: 'black',
                                                        position: 'absolute',
                                                        left: '0%',
                                                        top: '20px',
                                                    }}
                                                >
                                                    Lose
                                                </span>
                                                <span
                                                    style={{
                                                        color: 'black',
                                                        position: 'absolute',
                                                        left: 'calc(50% - 20px)',
                                                        top: '20px',
                                                    }}
                                                >
                                                    Draw
                                                </span>
                                                <span
                                                    style={{
                                                        color: 'black',
                                                        position: 'absolute',
                                                        right: '0%',
                                                        top: '20px',
                                                    }}
                                                >
                                                    Win
                                                </span>
                                            </div>
                                            <p
                                                style={{ fontSize: '0.8em', textAlign: 'center' }}
                                            >{`Your Goal: ${scenario.goal}. Current Progress: ${progress}%`}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Conditional rendering of setup elements in left column */}
                            {scenario && !negotiationStarted && (
                                <div className="left-column-setup-container">

                                    <div className="form-group">
                                        <label>Select difficulty level</label> {/* Changed label here */}
                                        <select
                                            onChange={(e) => setOpponentDifficulty(e.target.value)}
                                            value={opponentDifficulty}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Set Opponent Personality:</label>
                                        <div className="form-slider">
                                            <div className="form-slider-labels">
                                                <span style={{left: '0'}}>Balanced</span> {/* Adjusted label positions */}
                                                <span style={{left: 'calc(50% - 40px)'}}>Aggressive</span>
                                                <span style={{right: '-20px'}}>Disruptive</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max={Object.keys(opponentPersonalitySetting).length - 1}
                                                step="1"
                                                value={Object.keys(opponentPersonalitySetting).indexOf(
                                                    opponentPersonality
                                                )}
                                                onChange={handleOpponentPersonalityChange}
                                            />
                                            <div className="form-slider-description">
                                                <span>
                                                    Choose a personality for your opponent, affecting their
                                                    tone and negotiation tactics.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
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

                        {simulationComplete ? (
                            renderDebriefingSection()
                        ) : scenario ? (
                            <Card className="scenario-card">
                                {negotiationStarted ? (
                                    renderChatArea()
                                ) : (
                                    renderScenarioCardContent()
                                )}
                            </Card>
                        ) : (
                            renderScenarioSetup()
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

// Metadata - instructions are updated in the component above
export const metadata = {
    title: 'Negotiation Simulator',
    description: 'Flex your negotiation skills against a skilled opponent.',
    imageUrl: '../images/NegotiationModule.png',
    instructions: `
    <h2>Gameplay Overview</h2>
    <p>Welcome to the Negotiation Simulator. Engage in strategic negotiation to achieve your objectives. Your goal is to reach a beneficial agreement or understand when to walk away.</p>

    <h3>Best Alternative to a Negotiated Agreement (BATNA)</h3>
    <p>Considering your BATNA can significantly enhance your negotiation strategy. Your BATNA is what you'll do if no agreement is reached in this negotiation. Defining your BATNA helps you:</p>
    <ul>
        <li><strong>Determine your Reservation Point:</strong> Know when to stop negotiating and pursue your alternative.</li>
        <li><strong>Set Realistic Goals:</strong> Adjust your ambition based on how strong your BATNA is.</li>
        <li><strong>Evaluate Offers:</strong>  Compare any offer to your BATNA to make informed decisions.</li>
    </ul>
    <p>While defining BATNA is optional in this simulator, it is highly recommended for strategic gameplay and performance assessment.</p>

    <h3>Response Hints and Feedback</h3>
    <p>Use 'Show Response Hints' to get strategic suggestions during the negotiation. These hints offer different tactical approaches to consider.</p>
    <p>Enable 'Show Feedback' to receive immediate feedback on your negotiation moves, helping you understand the impact of your communication and improve your skills.</p>

    <h3>Scoring and Outcome</h3>
    <p>Your performance score ranges from -5 to +5. The simulation concludes when you reach a decisive win (+5), a loss (-5), or after 10 turns resulting in a draw.</p>
    `,
    component: NegotiationModule,
};


export default NegotiationModule;