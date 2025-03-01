import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select, { SelectItem } from '../../components/ui/Select';
import TextArea from '../../components/ui/TextArea';
import Progress from '../../components/ui/Progress';
import { BarLoader, BeatLoader } from 'react-spinners';
import {
    AlertTriangle,
    CheckCircle,
    Info,
    Menu,
    Square,
    CheckSquare,
    X,
    Edit,
    Save,
    RefreshCw,
    ChevronRight,
    ChevronLeft,
    MessageCircle,
    QuestionMarkCircle,
    Presentation,
    Layout,
    Rocket,
    Map,
    LayoutPanelLeft,
    UserRound
} from 'lucide-react';
import '../../styles/AppStyles.css';
import '../../styles/PitchModule.css';
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
import DOMPurify from 'dompurify';

// ... (API Base URL, constructEndpoint, parseAiJson - same as before) ...
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');
console.log("[PitchModule] API_BASE_URL at runtime:", API_BASE_URL);
const constructEndpoint = (baseURL, path) => `${baseURL}${path}`;

const parseAiJson = (apiResponse) => { // ... (same parseAiJson function as before) ...
    if (!apiResponse) {
        console.error('parseAiJson: No response data to parse.');
        return null;
    }
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
            return cleaned; // Fallback to returning the raw cleaned string.
        }
    }
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
                return cleaned;
            }
        }
        return messageContent;
    }
    return apiResponse;
};

// ---------------------------------------------------------------------
// Pitch Module Component (Refactored for Multi-Style)
const PitchModule = ({ onReturn, onSelectModule, modules }) => {
    // --- State Variables ---
    const [pitchStyle, setPitchStyle] = useState('');
    const [, forceUpdate] = useState({}); // State for forcing re-render
    const [editableScenario, setEditableScenario] = useState(null);
    const [numPanelists, setNumPanelists] = useState(1);
    const [panelistTypes, setPanelistTypes] = useState(['Investor']);
    const [pitchCategory, setPitchCategory] = useState('');
    const [pitchSubcategory, setPitchSubcategory] = useState('');
    const [desiredOutcome, setDesiredOutcome] = useState('');
    const [customOutcomeInput, setCustomOutcomeInput] = useState('');
    const [businessPlanInput, setBusinessPlanInput] = useState('');
    const [panelists, setPanelists] = useState([
        { name: 'Panelist 1', role: 'Role 1', persona: 'Persona 1' },
        { name: 'Panelist 2', role: 'Role 2', persona: 'Persona 2' },
        { name: 'Panelist 3', role: 'Role 3', persona: 'Persona 3' }
    ]); // Placeholder Panelists for UI demo
    const [pitchLog, setPitchLog] = useState([]);
    const [userPitchDraft, setUserPitchDraft] = useState('');
    const [performanceScore, setPerformanceScore] = useState(0);
    const [simulationComplete, setSimulationComplete] = useState(false);
    const [debriefing, setDebriefing] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isFetchingScenario, setIsFetchingScenario] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // Example for Elevator Pitch
    const [notifications, setNotifications] = useState([]);
    const [responseOptions, setResponseOptions] = useState([
        { name: 'Option 1', description: 'Description for Option 1' },
        { name: 'Option 2', description: 'Description for Option 2' },
        { name: 'Option 3', description: 'Description for Option 3' }
    ]); // Example Response Options
    const [pitchStarted, setPitchStarted] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [systemStatus, setSystemStatus] = useState({});
    const [performanceData, setPerformanceData] = useState([]);
    const [pitchGenerated, setPitchGenerated] = useState(false);
    const pitchLogEndRef = useRef(null);
    const [isResponseLoading, setIsResponseLoading] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [radarData, setRadarData] = useState(null);
    const [isScenarioEditable, setIsScenarioEditable] = useState(false);
    const [isUserReplyLoading, setIsUserReplyLoading] = useState(false);
    const [activePhase, setActivePhase] = useState('setup');
    const [currentTurnIndex, setCurrentTurnIndex] = useState(1);
    const [selectedQuestion, setSelectedQuestion] = useState({ panelist: 'Panelist Name', question: 'Example Question?' }); // Example Question
    const [panelistSentiment, setPanelistSentiment] = useState({});
    const [images, setImages] = useState({});
    const [imageStatus, setImageStatus] = useState('idle');
    const [isCustomInputMode, setIsCustomInputMode] = useState(false);

    const pitchCategories = [
        { value: 'technology', title: 'Technology' },
        { value: 'healthcare', title: 'Healthcare' },
        { value: 'finance', title: 'Finance' },
        { value: 'consumer_goods', title: 'Consumer Goods' },
        { value: 'services', title: 'Services' },
        { value: 'custom', title: 'Custom Area' }
    ];

    const pitchSubcategories = {
        technology: ['SaaS', 'AI', 'Biotech', 'Hardware', 'E-commerce'],
        healthcare: ['MedTech', 'Pharma', 'Digital Health', 'Healthcare Services'],
        finance: ['FinTech', 'Investment Management', 'Banking', 'Insurance'],
        consumer_goods: ['Food & Beverage', 'Fashion', 'Home Goods', 'Personal Care'],
        services: ['Consulting', 'Marketing', 'Education', 'Logistics']
    };

    const desiredOutcomesList = [
        "Secure Seed Funding",
        "Gain Strategic Partnership",
        "Acquire Key Client",
        "Receive Positive Market Validation",
        "Custom Outcome"
    ];


    const scrollToBottom = () => {
        pitchLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        if (pitchLog.length > 0) {
            scrollToBottom();
        }
    }, [pitchLog]);


    const generateSequentialTimestamp = () => {
        const now = new Date();
        const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
        return now.toLocaleTimeString('en-US', options);
    };


    const addLog = (log) => {
        setPitchLog(prev => [...prev, { message: log, timestamp: new Date() }]);
    };
    const addNotification = (message) => {
        setNotifications(prev => [...prev, message]);
    };


    const handleNumPanelistsChange = (event) => {
        setNumPanelists(parseInt(event.target.value, 10));
    };

    const handlePanelistTypeChange = (index, event) => {
        const newTypes = [...panelistTypes];
        newTypes[index] = event.target.value;
        setPanelistTypes(newTypes);
    };

    const generatePanelistImages = async (panelistNames) => {
        setImageStatus('loading');
        let newImages = {};
        for (let i = 0; i < panelistNames.length; i++) {
            const prompt = `Create a professional avatar for ${panelistNames[i]}, a panelist for a business pitch, 1990s colorful stock art, simple lines, diverse, **seated on a stage, facing forward.**`; // Added "seated on a stage, facing forward"
            try {
                const endpoint = constructEndpoint(API_BASE_URL, '/api/dalle/image');
                const response = await axios.post(endpoint, { prompt });
                newImages[panelistNames[i]] = response.data.imagePath;
            } catch (error) {
                console.error(`Error generating image for ${panelistNames[i]}:`, error.message);
                setErrorMessage(`Failed to generate image for ${panelistNames[i]}. Please try again.`);
                setImageStatus('failed');
                return;
            }
        }
        setImages(newImages);
        setImageStatus('success');
    };


    const fetchOpenAIResponse = async (input, endpointPath, isUserAction = false) => {
        setIsFetching(true);
        if (isUserAction) {
            setIsUserReplyLoading(true);
        }
        try {
            const endpoint = constructEndpoint(API_BASE_URL, endpointPath);
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
                setIsUserReplyLoading(false);
            }
            setIsFetching(false);
        }
    };


    const generatePitchScenario = async () => {
        setIsFetchingScenario(true);
        try {
            const selectedCategoryTitle = pitchCategories.find(cat => cat.value === pitchCategory)?.title;
            const subcategory = pitchSubcategories[pitchCategory]?.find(subCat => subCat === pitchSubcategory);
            if (!selectedCategoryTitle) {
                setErrorMessage('Please select a pitch category.');
                return;
            }
            setErrorMessage('');
            const numP = numPanelists;
            const panelTypesPrompt = panelistTypes.join(', or ');

            const scenarioPrompt = `
                Create a compelling business pitch scenario in the ${selectedCategoryTitle} ${subcategory ? `(${subcategory})` : ''} sector.
                The scenario should be for a pitch presentation to a panel of ${numP} ${panelTypesPrompt}(s).
                Generate a brief but engaging description of the business idea being pitched, highlighting its unique value proposition and target market.
                Also, create ${numP} distinct virtual panelists. For each panelist, define:
                - A realistic name
                - Their professional role/title (relevant to evaluating pitches)
                - A short, distinct persona or background that influences their questioning style (e.g., 'skeptical VC', 'industry expert', 'customer advocate').

                Return the scenario in JSON format:
                {
                    "scenario": {
                        "pitchTitle": "string",
                        "pitchDescription": "<p>string</p><p>string</p>...",
                        "panelists": [
                            {"name": "string", "role": "string", "persona": "string"}
                        ]
                    }
                }
            `;
            const rawScenarioData = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: scenarioPrompt }] },
                '/api/generate'
            );
            const parsedScenario = parseAiJson(rawScenarioData);
            if (parsedScenario?.scenario) {
                setEditableScenario(parsedScenario.scenario);
                setPanelists(parsedScenario.scenario.panelists);
                setPitchGenerated(true);
                await generatePanelistImages(parsedScenario.scenario.panelists.map(p => p.name));
            } else {
                setErrorMessage('Failed to generate scenario. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred while generating the pitch scenario.');
        }
        setIsFetchingScenario(false);
    };

    const generatePitchScenarioForCategory = async (selectedPanelCategory) => {
        setIsFetchingScenario(true);
        setErrorMessage(''); // Clear any previous errors

        try {
            // **[BASIC SCENARIO GENERATION - REPLACE LATER WITH CATEGORY-AWARE LOGIC]**
            // For now, let's just generate a generic scenario regardless of category
            const genericScenarioPrompt = `Create a generic business pitch scenario for a stage presentation. Include a title, short description, and 3 diverse panelists with names, roles, and personas. Return in JSON format: ... (same JSON format as before)`;

            const rawScenarioData = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: genericScenarioPrompt }] },
                '/api/generate'
            );
            const parsedScenario = parseAiJson(rawScenarioData);

            if (parsedScenario?.scenario) {
                setEditableScenario(parsedScenario.scenario);
                setPanelists(parsedScenario.scenario.panelists);
                setPitchGenerated(true);
                await generatePanelistImages(parsedScenario.scenario.panelists.map(p => p.name));

                // **[TRANSITION TO PITCH UI AFTER SCENARIO GENERATION]**
                setPanelCategory(selectedPanelCategory); // Set panelCategory state
                console.log(`Scenario generated for category: ${selectedPanelCategory}. Proceeding to pitch UI.`);

            } else {
                setErrorMessage('Failed to generate scenario. Please try again.');
            }

        } catch (error) {
            console.error('Error generating scenario for category:', error);
            setErrorMessage('Error generating pitch scenario. Please try again.');
        } finally {
            setIsFetchingScenario(false);
        }
    };

    const startPitch = async () => {
        if (!desiredOutcome) {
            setErrorMessage('Please select your desired outcome.');
            return;
        }
        if (desiredOutcome === 'Custom Outcome' && !customOutcomeInput.trim()) {
            setErrorMessage("Please enter a custom outcome");
            return;
        }
        setPitchStarted(true);
        setErrorMessage('');

        try {
            // Generate initial panelist introductions (similar to previous version)
            let introMessages = [];
            for (const panelist of panelists) {
                const introPrompt = `
                    As ${panelist.name}, in your role as "${panelist.role}" with the persona: "${panelist.persona}", provide a brief introductory message to the user who is about to pitch their business idea.
                    Keep it professional and welcoming, setting the stage for the pitch presentation.
                    Return the introduction in JSON format: { "message": "<p>string</p><p>string</p>..." }
                `;
                const rawIntroResponse = await fetchOpenAIResponse(
                    { messages: [{ role: 'system', content: introPrompt }], temperature: 0.7, max_tokens: 300 },
                    '/api/generate'
                );
                const parsedIntro = parseAiJson(rawIntroResponse);
                const introMessageContent = parsedIntro?.message || 'Welcome, we are ready for your pitch.';
                introMessages.push({ panelistName: panelist.name, message: introMessageContent });
            }

            // Add panelist introductions to pitchLog
            introMessages.forEach(intro => {
                addLog(`${intro.panelistName}: ${intro.message}`); // Simple text log for card-based UI
            });

        } catch (error) {
            console.error('Error generating panelist introductions:', error);
            setErrorMessage('Failed to generate panelist introductions. Please try again.');
        }
        setActivePhase('pitch');
    };


    const handlePitchSubmit = async () => {
        if (!userPitchDraft.trim()) {
            setErrorMessage('Please type your pitch before submitting.');
            return;
        }
        setErrorMessage('');
        const userPitchContent = DOMPurify.sanitize(userPitchDraft);
        setUserPitchDraft(''); // Clear input immediately

        addLog({ message: `You: ${userPitchContent}`, sender: 'user' }); // Log user pitch, set sender

        // Generate panelist questions/responses (similar to previous version)
        for (const panelist of panelists) {
            const questionPrompt = `
                As ${panelist.name}, in your role as "${panelist.role}" and with your persona: "${panelist.persona}", having just heard the user's pitch: "${userPitchContent}", ask one thoughtful and concise question to the user about their pitch.
                Focus your question on your area of expertise and persona. Make sure the question is open-ended and encourages the user to elaborate.
                Return the question in JSON format: { "message": "<p>string</p><p>string</p>..." }
            `;

            const rawQuestionResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: questionPrompt }], temperature: 0.7, max_tokens: 300 },
                '/api/generate'
            );
            const parsedQuestion = parseAiJson(rawQuestionResponse);
            const questionMessageContent = parsedQuestion?.message || 'Could you elaborate further?';

            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay

            addLog({ message: `${panelist.name}: ${questionMessageContent}`, sender: panelist.name }); // Log panelist question, set sender
            setResponseOptions([]);
            setSelectedQuestion({ panelist: panelist.name, question: questionMessageContent });
        }
        setIsUserTurn(true);
        setCurrentTurnIndex(prev => prev + 1);
        setUserPitchDraft('');
    };


    const generateResponseOptions = async (context) => {
        if (!selectedQuestion) {
            console.warn('No question selected. Skipping response option generation.');
            return;
        }
        const prompt = `
             Based on the panelist question: "${context}",
             generate 3 to 5 strategic response options that the user could employ in a pitch scenario.
             Each option should be concise and directly related to answering the question effectively and advancing their pitch.
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

    const handleResponseOptions = async (rawResponse) => {
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
        if (!selectedQuestion) {
            console.log('[DEBUG handleResolution] No selectedQuestion, returning early.');
            return;
        }
        setIsResponseLoading(true);
        setIsUserReplyLoading(true);
        const selectedOption = responseOptions[actionIndex] || null;
        const actionDescription = selectedOption ? selectedOption.description : 'No action selected';
        const responseText = selectedOption ? selectedOption.name : 'No action selected';

        addLog(`You: Response - ${responseText}.`); // Log user response

        console.log('[DEBUG handleResolution] selectedQuestion:', selectedQuestion); // Debug log
        console.log('[DEBUG handleResolution] selectedQuestion.panelist:', selectedQuestion.panelist); // Debug log
        console.log('[DEBUG handleResolution] panelists:', panelists); // Debug log

        const panelist = panelists.find(p => p.name === selectedQuestion.panelist); // Find the panelist who asked the question

        if (!panelist) {
            console.error('[ERROR handleResolution] Panelist not found for selectedQuestion.panelist:', selectedQuestion.panelist);
            setIsResponseLoading(false);
            setIsUserReplyLoading(false);
            return; // Return early if panelist not found
        }


        const panelistPersonalityProfile = panelistPersonalitySetting[opponentPersonality]; // Get personality profile

        const systemPrompt = `
              You are ${panelist.name}, in your role as "${panelist.role}" and with your persona: "${panelist.persona}".
              You are also embodying a **${panelistPersonalityProfile.tone}** and **${panelistPersonalityProfile.complexity}** communication style in this pitch scenario.
        `;

        const panelistResponsePrompt = `
              As ${panelist.name}, having just heard the user's response: "${actionDescription}" to your question: "${selectedQuestion.question}", provide a brief follow-up message.
              This could be a new question, feedback, or a statement indicating your current sentiment towards the pitch. Keep the message concise and professional, and in line with your personality.
              Return the response in JSON format:
              {
                 "message": "string",
                 "sentiment": "positive" | "negative" | "neutral" // Optional sentiment
              }
        `;

        try {
            const rawResponse = await fetchOpenAIResponse({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: panelistResponsePrompt }
                ],
                temperature: 0.7,
                max_tokens: 500,
            }, '/api/generate'); // Use generate endpoint
            if (!rawResponse) {
                throw new Error('No response from AI server');
            }
            const parsed = parseAiJson(rawResponse);
            const panelistResponse = parsed?.message;
            const panelistNewSentiment = parsed?.sentiment || 'neutral'; // Default to neutral sentiment if not provided

            if (!panelistResponse) {
                throw new Error('Panelist response is empty or invalid JSON.');
            }

            addLog(`${panelist.name}: ${panelistResponse}`); // Log panelist response
            setPanelistSentiment(prevSentiment => ({ // Update panelist sentiment
                ...prevSentiment,
                [panelist.name]: panelistNewSentiment,
            }));
            setSelectedQuestion(null); // Clear selected question after response
            setResponseOptions([]); // Clear response options after action
             // Check for simulation completion condition here, e.g., after a certain number of questions or sentiment reaches a threshold

        } catch (error) {
            console.error('Failed to generate panelist response:', error);
            setErrorMessage('Failed to generate panelist response. Please try again.');
        } finally {
            setIsResponseLoading(false);
            setIsUserReplyLoading(false);
        }
    };

    const handleResponseSubmit = async () => {
        if (!userPitchDraft.trim()) {
            setErrorMessage('Please type your response before sending.');
            return;
        }
        setErrorMessage('');
        const userResponseContent = DOMPurify.sanitize(userPitchDraft);
        setUserPitchDraft(''); // Clear input immediately

        addLog({ message: `You: ${userResponseContent}`, sender: 'user' }); // Log user response in chat

        setIsResponseLoading(true);
        setIsUserReplyLoading(true);

        if (!selectedQuestion) {
            console.warn('No question selected to respond to.');
            setIsResponseLoading(false);
            setIsUserReplyLoading(false);
            return;
        }

        const panelist = panelists.find(p => p.name === selectedQuestion.panelist);
        if (!panelist) {
            console.error('Panelist not found:', selectedQuestion.panelist);
            setIsResponseLoading(false);
            setIsUserReplyLoading(false);
            return;
        }

        const systemPrompt = `
              As ${panelist.name}, in your role as "${panelist.role}" and with your persona: "${panelist.persona}", having just heard the user's response: "${userResponseContent}" to your question: "${selectedQuestion.question}", provide a brief follow-up message.
              This could be a new question, feedback, or a statement indicating their current sentiment towards the pitch. Keep the message concise and professional.
              Return the response in JSON format:
              {
                 "message": "string",
                 "sentiment": "positive" | "negative" | "neutral" // Optional sentiment
              }
        `;

        try {
            const rawResponse = await fetchOpenAIResponse({
                messages: [{ role: 'system', content: systemPrompt }],
                temperature: 0.7,
                max_tokens: 500,
            }, '/api/generate', true); // isUserAction = true
            if (!rawResponse) {
                throw new Error('No response from AI server');
            }
            const parsed = parseAiJson(rawResponse);
            const panelistResponse = parsed?.message;
            const panelistNewSentiment = parsed?.sentiment || 'neutral';

            if (!panelistResponse) {
                throw new Error('Panelist response is empty or invalid JSON.');
            }

            addLog({ message: `${panelist.name}: ${panelistResponse}`, sender: panelist.name }); // Log panelist response
            setPanelistSentiment(prevSentiment => ({
                ...prevSentiment,
                [panelist.name]: panelistNewSentiment,
            }));
            setSelectedQuestion(null); // Clear selected question after response
            setResponseOptions([]);     // Clear response options

        } catch (error) {
            console.error('Failed to generate panelist response:', error);
            setErrorMessage('Failed to generate panelist response. Please try again.');
        } finally {
            setIsResponseLoading(false);
            setIsUserReplyLoading(false);
        }
    };

    const resetPitchModule = () => {
        setPitchStyle('');
        setEditableScenario(null);
        setNumPanelists(1);
        setPanelistTypes(['Investor']);
        setPitchCategory('');
        setPitchSubcategory('');
        setDesiredOutcome('');
        setCustomOutcomeInput('');
        setBusinessPlanInput('');
        setPanelists([]);
        setPitchLog([]);
        setUserPitchDraft('');
        setPerformanceScore(0);
        setSimulationComplete(false);
        setDebriefing(null);
        setErrorMessage('');
        setIsFetching(false);
        setImages({});
        setImageStatus('idle');
        setPitchStarted(false);
        setTimeLeft(300);
        setNotifications([]);
        setResponseOptions([]);
        setSystemStatus({});
        setPerformanceData([]);
        setPitchGenerated(false);
        setRadarData(null);
        setIsScenarioEditable(false);
        setIsUserReplyLoading(false);
        setActivePhase('setup');
        setCurrentTurnIndex(1);
        setSelectedQuestion(null);
        setPanelistSentiment({});
        setIsCustomInputMode(false);
    };


    const renderLeftColumnCardContent = () => {
        return (
            <>
                {pitchStarted && editableScenario ? (
                    <div className="scenario-info">
                        <h3 className="left-column-scenario-title">{editableScenario?.pitchTitle}</h3>
                        <div className="module-description left-column-scenario-description">
                            <div dangerouslySetInnerHTML={{ __html: editableScenario?.pitchDescription }} />
                        </div>
                        <div className="module-info">
                            <strong>Desired Outcome:</strong> {desiredOutcome}
                        </div>
                    </div>
                ) : (
                    <>
                        <img src={metadata.imageUrl} alt="Pitch Module Illustration" className="scenario-image" />
                        {!editableScenario && (
                            <div className="module-description">
                                <h2>Pitch Simulator</h2>
                                <p>
                                    Welcome to the Pitch Simulator. Refine your pitching skills and face a panel of virtual experts!
                                    Craft your pitch, address tough questions, and strive to achieve your desired outcome.
                                </p>
                                <Button onClick={() => setShowInstructions(!showInstructions)}>
                                    {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                                </Button>
                                {showInstructions && (
                                    <div dangerouslySetInnerHTML={{ __html: metadata.instructions }} />
                                )}
                            </div>
                        )}
                    </>
                )}

            </>
        );
    };


    const renderMainContent = () => {
        if (pitchStyle === '') {
            return renderStyleSelectionUI();
        } else if (pitchStyle === 'stage-presentation') {
            return renderStagePresentationUI();
        } else if (pitchStyle === 'war-room') {
            return renderWarRoomUI();
        } else if (pitchStyle === 'elevator-pitch') {
            return renderElevatorPitchUI();
        } else if (pitchStyle === 'cyoa') {
            return renderCYOAUI();
        } else if (pitchStyle === 'deck-builder') {
            return renderDeckBuilderUI();
        } else if (pitchStyle === 'role-playing-panelist') {
            return renderRolePlayingPanelistUI();
        } else if (simulationComplete) {
            return renderMainContentDebriefing();
        } else if (editableScenario) {
            return renderMainContentSetupCard();
        } else {
            return renderMainContentCardSetup();
        }
    };

    // --- Style Selection UI ---
    const renderStyleSelectionUI = () => (
        <div className="setup-card"> {/* We can keep the setup-card container for styling */}
            <div className="card-header">
                <h3 className="header-title">Choose Your Pitch Style</h3>
            </div>
            <div className="pitch-style-selection-content">
                <p>Select the style of pitch simulation you want to experience:</p>
                <div className="pitch-style-options">
                    {/* Using simple divs instead of Card components */}
                    <div
                        className="pitch-style-option" // Class for styling
                        style={{ cursor: 'pointer', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '10px' }} // Basic inline styles for now
                        onClick={() => { console.log('Stage Presentation Clicked (Simple)'); setPitchStyle('stage-presentation'); }}
                    >
                        <Presentation className="style-icon" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Stage Presentation
                        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Present on a virtual stage, facing a live panel.</p>
                    </div>
                    <div
                        className="pitch-style-option" // Class for styling
                        style={{ cursor: 'pointer', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '10px' }} // Basic inline styles for now
                        onClick={() => { console.log('War Room Clicked (Simple)'); setPitchStyle('war-room'); }}
                    >
                        <Layout className="style-icon" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> War Room
                        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>High-pressure, metric-driven, real-time decisions.</p>
                    </div>
                    <div
                        className="pitch-style-option" // Class for styling
                        style={{ cursor: 'pointer', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '10px' }} // Basic inline styles for now
                        onClick={() => { console.log('Elevator Pitch Clicked (Simple)'); setPitchStyle('elevator-pitch'); }}
                    >
                        <Rocket className="style-icon" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Elevator Pitch Challenge
                        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Fast-paced, concise pitching against the clock.</p>
                    </div>
                    <div
                        className="pitch-style-option" // Class for styling
                        style={{ cursor: 'pointer', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '10px' }} // Basic inline styles for now
                        onClick={() => { console.log('CYOA Clicked (Simple)'); setPitchStyle('cyoa'); }}
                    >
                        <Map className="style-icon" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Choose Your Own Adventure
                        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Narrative-driven, branching story with varied outcomes.</p>
                    </div>
                    <div
                        className="pitch-style-option" // Class for styling
                        style={{ cursor: 'pointer', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '10px' }} // Basic inline styles for now
                        onClick={() => { console.log('Deck Builder Clicked (Simple)'); setPitchStyle('deck-builder'); }}
                    >
                        <LayoutPanelLeft className="style-icon" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Gamified Pitch Deck Builder
                        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Interactive deck building, visual presentation focus.</p>
                    </div>
                    <div
                        className="pitch-style-option" // Class for styling
                        style={{ cursor: 'pointer', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '10px' }} // Basic inline styles for now
                        onClick={() => { console.log('Role-Playing Panelist Clicked (Simple)'); setPitchStyle('role-playing-panelist'); }}
                    >
                        <UserRound className="style-icon" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Role-Playing Panelist
                        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Empathy-focused, nuanced panelist interaction.</p>
                    </div>
                </div>
            </div>
        </div>
    );
    const renderStageSetupUI = () => ( // New function for Stage Presentation Setup
        <Card className="setup-card">
            <CardHeader>
                <CardTitle className="header-title">Stage Presentation Setup</CardTitle>
            </CardHeader>
            <CardContent className="pitch-style-selection-content">
                <p>Choose a category for your panel to tailor the expert focus:</p>
                <div className="pitch-style-options">
                    <div className="form-group">
                        <label>Select Panel Category</label>
                        <Select
                            onValueChange={(value) => setPanelCategory(value)}
                            value={panelCategory}
                        >
                            <SelectItem value="">Choose category</SelectItem>
                            {panelCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                    {category.title}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                    <Button
                        onClick={() => {
                            if (panelCategory) {
                                // Proceed to generate scenario and then pitch UI
                                console.log(`Panel Category Selected: ${panelCategory}`);
                                // **[MODIFIED]: Generate scenario and THEN transition to pitch UI**
                                generatePitchScenarioForCategory(panelCategory);
                            } else {
                                setErrorMessage('Please select a panel category.');
                            }
                        }}
                        disabled={!panelCategory} // Disable if no category selected
                    >
                        Confirm Category and Continue
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderStagePresentationUI = () => {
        return (
            <div className="stage-presentation-container">
                <h3 className="stage-presentation-title">Stage Presentation</h3>
                <div className="stage-presentation-panelists">
                <h4>Panelists</h4>
                <div className="panelist-row"> {/* Changed to panelist-row for horizontal layout */}
                    {panelists.map((panelist, index) => (
                        <div key={index} className="panelist-card"> {/* Changed to panelist-card for individual styling */}
                            <div className="panelist-avatar">
                                {/* Panelist Avatar will go here - Placeholder for now */}
                                {images[panelist.name] ? (
                                    <img src={images[panelist.name]} alt={panelist.name} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                                ) : (
                                    <UserRound size={48} />
                                )}
                            </div>
                            <div className="panelist-info">
                                <strong>{panelist.name}</strong>
                                <p>{panelist.role}</p>
                                <p className="persona">({panelist.persona})</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
                <div className="stage-presentation-stage-area">
                    <h4>Virtual Stage</h4>
                    <div className="stage-display">
                        {editableScenario && (
                            <div className="scenario-summary">
                                <h5>Scenario Summary: {editableScenario.pitchTitle}</h5>
                                <div dangerouslySetInnerHTML={{ __html: editableScenario.pitchDescription }} />
                            </div>
                        )}
                        {selectedQuestion && (
                            <div className="panelist-question">
                                <h5>Question from {selectedQuestion.panelist}:</h5>
                                <p>{selectedQuestion.question}</p>
                            </div>
                        )}
                    </div>
                </div>
    
                {/* Chat Area Integration */}
                <div className="chat-area-wrapper">
                    <div className="chat-history-container">
                        <div className="chat-history">
                            {pitchLog.map((logEntry, index) => (
                                <div key={index} className={`chat-message ${logEntry.sender || 'opponent'}-message-align ${logEntry.sender || 'opponent'}`}>
                                    <div className="message-content">
                                        <p>{logEntry.message}</p>
                                        <span className="message-timestamp">{generateSequentialTimestamp(logEntry.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={pitchLogEndRef} />
                        </div>
                    </div>
    
                    <div className="message-input-container">
                        <div className="user-input-container">
                            <div>
                                <TextArea
                                    className="user-draft-textarea"
                                    placeholder="Type your pitch or response here..."
                                    value={userPitchDraft}
                                    onValueChange={setUserPitchDraft}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) { // Send message on Enter, not Shift+Enter
                                            e.preventDefault(); // Prevent newline in textarea
                                            if (pitchStarted && selectedQuestion) {
                                                handleResponseSubmit(); // Call response submit if question is active
                                            } else if (pitchStarted) {
                                                handlePitchSubmit();      // Call pitch submit if no active question (initial pitch)
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                className="send-button"
                                onClick={() => {
                                    if (pitchStarted && selectedQuestion) {
                                        handleResponseSubmit(); // Call response submit if question is active
                                    } else if (pitchStarted) {
                                        handlePitchSubmit();      // Call pitch submit if no active question (initial pitch)
                                    }
                                }}
                                disabled={!userPitchDraft.trim()}
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                </div>
    
    
                {/* Response Options (moved below chat for better flow) */}
                <div className="stage-presentation-response-area">
                    <h4>Response Options</h4>
                    <div className="response-options-grid">
                        {responseOptions.map((option, index) => (
                            <Button key={index} className="response-button" onClick={() => handleResolution(index)} disabled={isResponseLoading}>
                                {option.name}
                            </Button>
                        ))}
                    </div>
                </div>
    
                <div className="stage-presentation-pitch-log" style={{display: 'none'}}> {/* Hiding the old pitch log */}
                    <h4>Pitch Log (Old - Hidden)</h4>
                    <div className="pitch-log-display">
                        {pitchLog.map((logEntry, index) => (
                            <div key={index} className="log-entry">
                                <span className="timestamp">{generateSequentialTimestamp(logEntry.timestamp)}</span>
                                <p className="message">{logEntry.message}</p>
                            </div>
                        ))}
                        <div ref={pitchLogEndRef} />
                    </div>
                </div>
    
            </div>
        );
    };

    const renderWarRoomUI = () => {
        return (
            <div className="war-room-container">
                <h3 className="war-room-title">War Room</h3>
                <div className="war-room-metrics">
                    <h4>Real-time Metrics</h4>
                    <div className="metrics-display">
                        <p>Engagement Level: <Progress value={60} /></p>
                        <p>Investor Interest: <Progress value={30} /></p>
                        <p>Market Sentiment: <Progress value={80} /></p>
                        {/* Add more metrics as needed */}
                    </div>
                </div>
                <div className="war-room-decision-center">
                    <h4>Decision Dashboard</h4>
                    <div className="decision-dashboard">
                        <div className="scenario-brief">
                            <h5>Scenario Brief</h5>
                            {editableScenario && (
                                <div dangerouslySetInnerHTML={{ __html: editableScenario.pitchDescription }} />
                            )}
                        </div>
                        <div className="current-question">
                            {selectedQuestion && (
                                <>
                                    <h5>Current Question from {selectedQuestion.panelist}</h5>
                                    <p>{selectedQuestion.question}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="war-room-response-options">
                    <h4>Immediate Response Options</h4>
                    <div className="response-options-list">
                        {responseOptions.map((option, index) => (
                            <Button key={index} className="response-button" onClick={() => { console.log(`Option ${index + 1} Clicked: ${option.name}`); }}>
                                {option.name}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="war-room-pitch-log">
                    <h4>Event Log</h4>
                    <div className="pitch-log-display">
                        {pitchLog.map((logEntry, index) => (
                            <div key={index} className="log-entry">
                                <span className="timestamp">{generateSequentialTimestamp(logEntry.timestamp)}</span>
                                <p className="message">{logEntry.message}</p>
                            </div>
                        ))}
                        <div ref={pitchLogEndRef} />
                    </div>
                </div>
            </div>
        );
    };

    const renderElevatorPitchUI = () => {
        const [timer, setTimer] = useState(timeLeft);
        useEffect(() => {
            if (pitchStarted && timer > 0) {
                const interval = setInterval(() => {
                    setTimer(timer - 1);
                }, 1000);
                return () => clearInterval(interval);
            } else if (timer === 0 && pitchStarted) {
                setPitchStarted(false); // End pitch when timer runs out (for now, just stop timer)
                alert("Time's up for your elevator pitch!"); // Example time-out action
            }
        }, [timer, pitchStarted]);


        return (
            <div className="elevator-pitch-container">
                <h3 className="elevator-pitch-title">Elevator Pitch Challenge</h3>
                <div className="elevator-pitch-timer">
                    <h4>Time Remaining: {timer} seconds</h4>
                    <Progress value={(timeLeft - timer) / timeLeft * 100} /> {/* Example progress bar */}
                </div>
                <div className="elevator-pitch-area">
                    <h4>Your Pitch Area</h4>
                    <div className="pitch-text-area">
                        <TextArea
                            placeholder="Start typing your elevator pitch here..."
                            value={userPitchDraft}
                            onValueChange={setUserPitchDraft}
                            className="elevator-pitch-textarea"
                        />
                    </div>
                </div>
                <div className="elevator-pitch-action">
                    <Button onClick={() => { console.log('Submit Elevator Pitch'); alert('Pitch Submitted (Placeholder)'); }} disabled={!userPitchDraft.trim()}>
                        Submit Pitch
                    </Button>
                </div>
                <div className="elevator-pitch-log">
                    <h4>Pitch Log</h4>
                    <div className="pitch-log-display">
                        {pitchLog.map((logEntry, index) => (
                            <div key={index} className="log-entry">
                                <span className="timestamp">{generateSequentialTimestamp(logEntry.timestamp)}</span>
                                <p className="message">{logEntry.message}</p>
                            </div>
                        ))}
                        <div ref={pitchLogEndRef} />
                    </div>
                </div>
            </div>
        );
    };


    const renderCYOAUI = () => {
        return (
            <div className="cyoa-container">
                <h3 className="cyoa-title">Choose Your Own Adventure Pitch</h3>
                <div className="cyoa-scenario-display">
                    <h4>Current Scenario Scene</h4>
                    <div className="scenario-text">
                        <p>You are in a critical juncture of your pitch. The lead investor leans forward, awaiting your response...</p>
                        {selectedQuestion && (
                            <div className="panelist-question">
                                <h5>Current Situation / Question:</h5>
                                <p>{selectedQuestion.question}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="cyoa-decision-points">
                    <h4>Decision Points</h4>
                    <div className="decision-options">
                        {responseOptions.map((option, index) => (
                            <Button key={index} className="response-button" onClick={() => { console.log(`Decision ${index + 1} Clicked: ${option.name}`); }}>
                                {option.name}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="cyoa-story-log">
                    <h4>Story Log</h4>
                    <div className="pitch-log-display">
                        {pitchLog.map((logEntry, index) => (
                            <div key={index} className="log-entry">
                                <span className="timestamp">{generateSequentialTimestamp(logEntry.timestamp)}</span>
                                <p className="message">{logEntry.message}</p>
                            </div>
                        ))}
                        <div ref={pitchLogEndRef} />
                    </div>
                </div>
            </div>
        );
    };

    const renderDeckBuilderUI = () => {
        return (
            <div className="deck-builder-container">
                <h3 className="deck-builder-title">Gamified Pitch Deck Builder</h3>
                <div className="deck-builder-slide-area">
                    <h4>Current Slide Preview</h4>
                    <div className="slide-preview">
                        <Square className="slide-placeholder-icon" size={100} />
                        <p>Slide Content Preview</p>
                        {/* Slide preview area - can be enhanced with actual slide rendering later */}
                    </div>
                </div>
                <div className="deck-builder-elements-palette">
                    <h4>Deck Elements Palette</h4>
                    <div className="elements-grid">
                        <Button className="element-button" onClick={() => { console.log('Added Title Slide'); alert('Title Slide Element Added (Placeholder)'); }}>Title Slide</Button>
                        <Button className="element-button" onClick={() => { console.log('Added Problem Slide'); alert('Problem Slide Element Added (Placeholder)'); }}>Problem Slide</Button>
                        <Button className="element-button" onClick={() => { console.log('Added Solution Slide'); alert('Solution Slide Element Added (Placeholder)'); }}>Solution Slide</Button>
                        {/* More deck elements can be added here */}
                    </div>
                </div>
                <div className="deck-builder-deck-overview">
                    <h4>Deck Overview</h4>
                    <div className="deck-slides-list">
                        <p>Deck Slides will be listed here as draggable thumbnails</p>
                        {/* Deck slide list - can be made interactive and draggable later */}
                    </div>
                </div>
                <div className="deck-builder-action-bar">
                    <Button onClick={() => { console.log('Present Deck'); alert('Deck Presentation Started (Placeholder)'); }}>Present Deck</Button>
                </div>
            </div>
        );
    };

    const renderRolePlayingPanelistUI = () => {
        return (
            <div className="role-playing-panelist-container">
                <h3 className="role-playing-panelist-title">Role-Playing Panelist</h3>
                <div className="role-playing-panelist-context">
                    <h4>Scenario Context</h4>
                    <div className="context-display">
                        <p>You are now role-playing as a panelist. Your task is to evaluate pitches with empathy...</p>
                        {editableScenario && (
                            <div className="scenario-summary">
                                <h5>Scenario: {editableScenario.pitchTitle}</h5>
                                <div dangerouslySetInnerHTML={{ __html: editableScenario.pitchDescription }} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="role-playing-panelist-pitch-area">
                    <h4>Pitch to Evaluate</h4>
                    <div className="pitch-summary">
                        <p>Pitch content from the user will appear here for you to evaluate...</p>
                        {userPitchDraft && (
                            <div className="user-pitch-content">
                                <h5>User's Pitch:</h5>
                                <p>{userPitchDraft}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="role-playing-panelist-evaluation-tools">
                    <h4>Evaluation Tools</h4>
                    <div className="evaluation-controls">
                        <Button onClick={() => { console.log('Provide Positive Feedback'); alert('Positive Feedback Provided (Placeholder)'); }}>Give Positive Feedback</Button>
                        <Button className="constructive-button" onClick={() => { console.log('Provide Constructive Criticism'); alert('Constructive Criticism Provided (Placeholder)'); }}>Offer Constructive Criticism</Button>
                        <Button className="question-button" onClick={() => { console.log('Ask Clarifying Question'); alert('Clarifying Question Asked (Placeholder)'); }}>Ask Question</Button>
                        {/* More evaluation tools and controls can be added */}
                    </div>
                </div>
                <div className="role-playing-panelist-log">
                    <h4>Panelist Role-Play Log</h4>
                    <div className="pitch-log-display">
                        {pitchLog.map((logEntry, index) => (
                            <div key={index} className="log-entry">
                                <span className="timestamp">{generateSequentialTimestamp(logEntry.timestamp)}</span>
                                <p className="message">{logEntry.message}</p>
                            </div>
                        ))}
                        <div ref={pitchLogEndRef} />
                    </div>
                </div>
            </div>
        );
    };


    const renderMainContentSetupCard = () => {
        return (
            <>
                <CardHeader>
                    <div className="scenario-title-container">
                        <CardTitle className="header-title">{editableScenario?.pitchTitle || "Pitch Title"}</CardTitle>
                        <div className="spinner-container">
                            {isFetching && (<BarLoader color="#0073e6" width="100%" />)}
                        </div>
                        <div className="scenario-description main-content-scenario-description" style={{ position: 'relative' }}>
                            <div dangerouslySetInnerHTML={{ __html: editableScenario?.pitchDescription }} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>

                    <div className="panelists-info">
                        <h3>Panelists:</h3>
                        <ul>
                            {panelists.map((panelist, index) => (
                                <li key={index}>
                                    <strong>{panelist.name}</strong> - {panelist.role} <br />
                                    {panelist.persona}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="business-plan-input">
                        <label htmlFor="businessPlan">Enter Your Business Plan (Optional)</label>
                        <TextArea
                            id="businessPlan"
                            className="custom-scenario-input"
                            placeholder="Paste your business plan here to get more specific feedback..."
                            value={businessPlanInput}
                            onValueChange={(value) => setBusinessPlanInput(value)}
                        />
                    </div>


                    <Button
                        onClick={startPitch}
                        className="start-button"
                        disabled={!desiredOutcome && desiredOutcome !== 'Custom Outcome'}
                    >
                        Start Pitch Simulation
                    </Button>
                </CardContent>
            </>
        );
    };


    const renderMainContentCardSetup = () => {
        return (
            <Card className="setup-card">
                <CardHeader>
                    <CardTitle className="header-title">Setup Your Pitch Simulation</CardTitle>
                    <div className="spinner-container">
                        {isFetchingScenario && <BarLoader color="#0073e6" width="100%" />}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Form elements for Pitch setup - Number of Panelists, Category, etc. - re-use from previous version */}
                    <div className="form-group">
                        <label>Select Pitch Category</label>
                        <Select
                            onValueChange={(value) => {
                                setPitchCategory(value);
                                setPitchSubcategory('');
                                if (value === 'custom') {
                                    setIsCustomInputMode(true);
                                } else {
                                    setIsCustomInputMode(false);
                                }
                            }}
                            value={pitchCategory}
                        >
                            <SelectItem value="">Choose category</SelectItem>
                            {pitchCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                    {category.title}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>

                    {pitchSubcategories[pitchCategory] && (
                        <div className="form-group">
                            <label>Select Pitch Subcategory (Optional)</label>
                            <Select
                                onValueChange={(value) => setPitchSubcategory(value)}
                                value={pitchSubcategory}
                                disabled={!pitchCategory || pitchCategory === 'custom'}
                            >
                                <SelectItem value="">Choose subcategory (optional)</SelectItem>
                                {pitchSubcategories[pitchCategory].map((subcategory, index) => (
                                    <SelectItem key={index} value={subcategory}>
                                        {subcategory}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Number of Panelists</label>
                        <Select onValueChange={(value) => setNumPanelists(parseInt(value))} value={String(numPanelists)}>
                            <SelectItem value="1">1 Panelist</SelectItem>
                            <SelectItem value="2">2 Panelists</SelectItem>
                            <SelectItem value="3">3 Panelists</SelectItem>
                        </Select>
                    </div>

                    <div className="form-group">
                        <label>Panelist Roles</label>
                        {Array.from({ length: numPanelists }).map((_, index) => (
                            <Select key={index} onValueChange={(value) => handlePanelistTypeChange(index, { target: { value } })} value={panelistTypes[index] || 'Investor'}>
                                <SelectItem value="Investor">Investor</SelectItem>
                                <SelectItem value="Client">Client</SelectItem>
                                <SelectItem value="Strategic Partner">Strategic Partner</SelectItem>
                                {/* Add more roles as needed */}
                            </Select>
                        ))}
                    </div>

                    {!pitchGenerated && (
                        <Button onClick={generatePitchScenario} disabled={isFetching}>
                            {isFetching ? 'Generating...' : 'Generate Pitch Scenario'}
                        </Button>
                    )}
                    {pitchGenerated && (
                        <Button onClick={startPitch} disabled={isFetching}>
                            {isFetching ? 'Starting...' : 'Start Pitch Simulation'}
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    };


    const renderMainContentDebriefing = () => {
        return (
            <div className="debriefing-section">
                <h4 className="debriefing-title">Pitch Simulation Debriefing</h4>
                {/* Radar Chart and Performance Data - To be implemented */}
                <p>Debriefing content will go here...</p>
                <div className="action-buttons">
                    <Button onClick={() => setSimulationComplete(false)}>Try Different Choices</Button>
                    <Button onClick={resetPitchModule}>Run New Pitch Simulation</Button>
                </div>
            </div>
        );
    };


    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-box">
                    <span className="header-title">{metadata.title}</span>
                    <Menu className="hamburger-icon" onClick={() => {/* Implement dropdown menu if needed */ }} />
                    {/* Dropdown Menu - if needed */}
                </div>
            </header>
            <main className="content-grid">
                <aside className="left-column">
                    <Card className="details-card">
                        <CardContent>
                            {renderLeftColumnCardContent()}
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
                        {renderMainContent()}
                    </div>
                </section>
                {/* Notifications Section - Consider if needed */}
                {/* <section className="notifications">
                    <h4>Notifications</h4>
                    {notifications.map((note, index) => (
                        <div key={index} className="notification">{note}</div>
                    ))}
                </section> */}
            </main>
        </div>
    );
};


export const metadata = {
    title: 'Pitch Simulator',
    description: 'Present your pitch to a panel of virtual experts and refine your presentation skills.',
    imageUrl: '../images/PitchModule.png',
    instructions: `
        <h2>Pitch Simulator Instructions</h2>
        <p>Welcome to the Pitch Simulator! In this module, you will hone your business pitching skills by presenting to a panel of virtual experts.</p>
        <h3>Getting Started</h3>
        <ol>
            <li><strong>Select Pitch Category and Subcategory:</strong> Choose the category and subcategory that best fits your pitch. This helps tailor the scenario to a specific industry or market.</li>
            <li><strong>Number of Panelists:</strong> Decide how many panelists you want to face. You can choose between 1 to 3 panelists to adjust the challenge level.</li>
            <li><strong>Panelist Roles:</strong> Specify the roles of the panelists (e.g., Investor, Client, Strategic Partner). This will influence the types of questions they ask and the feedback they provide.</li>
            <li><strong>Generate Scenario:</strong> Click 'Generate Pitch Scenario' to create a unique pitch scenario based on your selections.</li>
        </ol>
        <h3>During the Pitch</h3>
        <ol>
            <li><strong>Review Scenario:</strong> Once generated, review the pitch scenario, panelist profiles, and think about your strategy.</li>
            <li><strong>Start Pitch Simulation:</strong> When ready, click 'Start Pitch Simulation'. Panelists will introduce themselves, setting the stage for your pitch.</li>
            <li><strong>Craft Your Pitch:</strong> Prepare your initial pitch in advance (you can paste it into the 'Business Plan' input). The simulation will start with panelist questions.</li>
            <li><strong>Respond to Panelist Questions:</strong> Each panelist will ask questions. Response Options will appear - choose the best option to answer thoughtfully and strategically.</li>
            <li><strong>Iterate and Learn:</strong> Continue answering questions and adapting your approach based on the panel's reactions.</li>
        </ol>
        <h3>Debriefing and Review</h3>
        <ol>
            <li><strong>Simulation Outcome:</strong> After the pitch, the simulation will conclude, and a debriefing section will become available.</li>
            <li><strong>Review Feedback:</strong> The debriefing will provide insights into your pitch performance, highlighting strengths and areas for improvement.</li>
            <li><strong>Run Again:</strong> Use the feedback to refine your pitch and run the simulation again to practice and improve your skills.</li>
        </ol>
        <p>Use this simulator to practice different pitching styles, refine your business ideas, and become more confident in presenting to panels of experts. Good luck!</p>
    `,
    component: PitchModule,
};


export default PitchModule;