import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '../../components/ui/Card'; // Corrected import path
import Button from '../../components/ui/Button'; // Corrected import path
import Select, { SelectItem } from '../../components/ui/Select'; // Corrected import path
import TextArea from '../../components/ui/TextArea'; // Corrected import path
import Progress from '../../components/ui/Progress'; // Corrected import path
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
    Presentation, // Lucide Icon for Stage Presentation
    Layout, // Lucide Icon for War Room
    Rocket, // Lucide Icon for Elevator Pitch
    Map, // Lucide Icon for CYOA
    LayoutPanelLeft, // Lucide Icon for Deck Builder
    UserRound // Lucide Icon for Role Playing Panelist
} from 'lucide-react';
import '../../styles/AppStyles.css';
import '../../styles/PitchModule.css'; // Make sure PitchModule.css exists
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
    const [pitchStyle, setPitchStyle] = useState(''); // Tracks selected pitch style ('', 'stage', 'warroom', etc.)
    const [editableScenario, setEditableScenario] = useState(null); // ADDED: For storing the generated scenario
    const [numPanelists, setNumPanelists] = useState(1);
    const [panelistTypes, setPanelistTypes] = useState(['Investor']);
    const [pitchCategory, setPitchCategory] = useState('');
    const [pitchSubcategory, setPitchSubcategory] = useState('');
    const [desiredOutcome, setDesiredOutcome] = useState('');
    const [customOutcomeInput, setCustomOutcomeInput] = useState('');
    const [businessPlanInput, setBusinessPlanInput] = useState('');
    const [panelists, setPanelists] = useState([]);
    const [pitchLog, setPitchLog] = useState([]);
    const [userPitchDraft, setUserPitchDraft] = useState('');
    const [performanceScore, setPerformanceScore] = useState(0);
    const [simulationComplete, setSimulationComplete] = useState(false);
    const [debriefing, setDebriefing] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isFetchingScenario, setIsFetchingScenario] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [notifications, setNotifications] = useState([]);
    const [responseOptions, setResponseOptions] = useState([]);
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
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [panelistSentiment, setPanelistSentiment] = useState({});
    const [images, setImages] = useState({}); // For panelist avatars
    const [imageStatus, setImageStatus] = useState('idle'); // 'idle', 'loading', 'success', 'failed'
    const [isCustomInputMode, setIsCustomInputMode] = useState(false);

    const pitchCategories = [ // ... (same categories as before) ...
        { value: 'technology', title: 'Technology' },
        { value: 'healthcare', title: 'Healthcare' },
        { value: 'finance', title: 'Finance' },
        { value: 'consumer_goods', title: 'Consumer Goods' },
        { value: 'services', title: 'Services' },
        { value: 'custom', title: 'Custom Area' }
    ];

    const pitchSubcategories = { // ... (same subcategories as before) ...
        technology: ['SaaS', 'AI', 'Biotech', 'Hardware', 'E-commerce'],
        healthcare: ['MedTech', 'Pharma', 'Digital Health', 'Healthcare Services'],
        finance: ['FinTech', 'Investment Management', 'Banking', 'Insurance'],
        consumer_goods: ['Food & Beverage', 'Fashion', 'Home Goods', 'Personal Care'],
        services: ['Consulting', 'Marketing', 'Education', 'Logistics']
    };

    const desiredOutcomesList = [ // ... (same outcomes as before) ...
        "Secure Seed Funding",
        "Gain Strategic Partnership",
        "Acquire Key Client",
        "Receive Positive Market Validation",
        "Custom Outcome"
    ];


    const scrollToBottom = () => { // ... (same scrollToBottom function as before) ...
        pitchLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => { // ... (same useEffect hook as before) ...
        if (pitchLog.length > 0) {
            scrollToBottom();
        }
    }, [pitchLog]);


    const generateSequentialTimestamp = () => { // ... (same timestamp function as before) ...
        const now = new Date();
        const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
        return now.toLocaleTimeString('en-US', options);
    };


    const addLog = (log) => { // ... (same addLog function as before) ...
        setPitchLog(prev => [...prev, { message: log, timestamp: new Date() }]);
    };
    const addNotification = (message) => { // ... (same addNotification function as before) ...
        setNotifications(prev => [...prev, message]);
    };


    const handleNumPanelistsChange = (event) => { // ... (same handleNumPanelistsChange function as before) ...
        setNumPanelists(parseInt(event.target.value, 10));
    };

    const handlePanelistTypeChange = (index, event) => { // ... (same handlePanelistTypeChange function as before) ...
        const newTypes = [...panelistTypes];
        newTypes[index] = event.target.value;
        setPanelistTypes(newTypes);
    };

    const generatePanelistImages = async (panelistNames) => { // ... (same generatePanelistImages function as before) ...
        setImageStatus('loading');
        let newImages = {};
        for (let i = 0; i < panelistNames.length; i++) {
            const prompt = `Create a professional avatar for ${panelistNames[i]}, a panelist for a business pitch, 1990s colorful stock art, simple lines, diverse.`;
            try {
                const endpoint = constructEndpoint(API_BASE_URL, '/api/dalle/image'); // Use constructEndpoint
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


    const fetchOpenAIResponse = async (input, endpointPath, isUserAction = false) => { // ... (same fetchOpenAIResponse function as before) ...
        setIsFetching(true);
        if (isUserAction) {
            setIsUserReplyLoading(true);
        }
        try {
            const endpoint = constructEndpoint(API_BASE_URL, endpointPath); // Use constructEndpoint
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


    const generatePitchScenario = async () => { // ... (same generatePitchScenario function as before) ...
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
                '/api/generate' // Use generate endpoint
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


    const startPitch = async () => { // ... (same startPitch function as before) ...
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
                    '/api/generate' // Use generate endpoint
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
        setActivePhase('pitch'); // Set active phase to 'pitch'
    };


    const handlePitchSubmit = async () => { // ... (same handlePitchSubmit function as before) ...
        if (!userPitchDraft.trim()) { // User pitch draft - might not be needed in this UI
            setErrorMessage('Please type your pitch before submitting.');
            return;
        }
        setErrorMessage('');
        const userPitchContent = DOMPurify.sanitize(userPitchDraft);
        setUserPitchDraft(''); // Clear user pitch draft

        addLog(`You: Initial Pitch Submitted.`); // Log user pitch submission

        // Generate panelist questions/responses (similar to previous version)
        for (const panelist of panelists) {
            const questionPrompt = `
                As ${panelist.name}, in your role as "${panelist.role}" and with your persona: "${panelist.persona}", having just heard the user's pitch: "${userPitchContent}", ask one thoughtful and concise question to the user about their pitch.
                Focus your question on your area of expertise and persona. Make sure the question is open-ended and encourages the user to elaborate.
                Return the question in JSON format: { "message": "<p>string</p><p>string</p>..." }
            `;

            const rawQuestionResponse = await fetchOpenAIResponse(
                { messages: [{ role: 'system', content: questionPrompt }], temperature: 0.7, max_tokens: 300 },
                '/api/generate' // Use generate endpoint
            );
            const parsedQuestion = parseAiJson(rawQuestionResponse);
            const questionMessageContent = parsedQuestion?.message || 'Could you elaborate further?';

            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay

            addLog(`${panelist.name}: ${questionMessageContent}`); // Log panelist question
             setResponseOptions([]); // Clear previous response options
            setSelectedQuestion({ panelist: panelist.name, question: questionMessageContent }); // Set current question
        }
        setIsUserTurn(true); // Set back to user turn
        setCurrentTurnIndex(prev => prev + 1);
        setUserPitchDraft(''); // Clear user pitch draft again just in case
    };


    const generateResponseOptions = async (context) => { // ... (same generateResponseOptions function as before) ...
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
            }, '/api/generate'); // Use generate endpoint
            handleResponseOptions(rawResponse);
        } catch (error) {
            console.error('Failed to generate response options:', error);
            setErrorMessage('Failed to generate response options. Please try again.');
        }
    };

    const handleResponseOptions = async (rawResponse) => { // ... (same handleResponseOptions function as before) ...
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

    const handleResolution = async (actionIndex) => { // ... (same handleResolution function as before) ...
        if (!selectedQuestion) return;
        setIsResponseLoading(true);
        setIsUserReplyLoading(true);
        const selectedOption = responseOptions[actionIndex] || null;
        const actionDescription = selectedOption ? selectedOption.description : 'No action selected';
        const responseText = selectedOption ? selectedOption.name : 'No action selected';

        addLog(`You: Response - ${responseText}.`); // Log user response

        const panelist = panelists.find(p => p.name === selectedQuestion.panelist); // Find the panelist who asked the question

        const systemPrompt = `
              As ${panelist.name}, in your role as "${panelist.role}" and with your persona: "${panelist.persona}", having just heard the user's response: "${actionDescription}" to your question: "${selectedQuestion.question}", provide a brief follow-up message.
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


    const resetPitchModule = () => { // ... (updated resetPitchModule function) ...
        setPitchStyle(''); // Reset pitchStyle to ''
        setEditableScenario(null); // Reset editableScenario
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


    const renderLeftColumnCardContent = () => { // ... (same renderLeftColumnCardContent function as before, now using editableScenario?.scenario) ...
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


    const renderMainContent = () => { // --- Updated renderMainContent for Style Selection ---
        if (pitchStyle === '') {
            return renderStyleSelectionUI(); // Render style selection UI
        } else if (pitchStyle === 'stage-presentation') {
            return renderStagePresentationUI(); // Placeholder - Stage Presentation UI
        } else if (pitchStyle === 'war-room') {
            return renderWarRoomUI(); // Placeholder - War Room UI
        } else if (pitchStyle === 'elevator-pitch') {
            return renderElevatorPitchUI(); // Placeholder - Elevator Pitch UI
        } else if (pitchStyle === 'cyoa') {
            return renderCYOAUI(); // Placeholder - CYOA UI
        } else if (pitchStyle === 'deck-builder') {
            return renderDeckBuilderUI(); // Placeholder - Deck Builder UI
        } else if (pitchStyle === 'role-playing-panelist') {
            return renderRolePlayingPanelistUI(); // Placeholder - Role-Playing Panelist UI
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
        <Card className="setup-card">
            <CardHeader>
                <CardTitle className="header-title">Choose Your Pitch Style</CardTitle>
            </CardHeader>
            <CardContent className="pitch-style-selection-content">
                <p>Select the style of pitch simulation you want to experience:</p>
                <div className="pitch-style-options">
                    <Card
                        className="pitch-style-card"
                        onClick={() => {
                            console.log('Stage Presentation Clicked');
                            setPitchStyle('stage-presentation');
                        }}
                    >
                        <CardHeader><CardTitle><Presentation className="style-icon"/>Stage Presentation</CardTitle></CardHeader>
                        <CardContent>Present on a virtual stage, facing a live panel.</CardContent>
                    </Card>
                    <Card
                        className="pitch-style-card"
                        onClick={() => {
                            console.log('War Room Clicked');
                            setPitchStyle('war-room');
                        }}
                    >
                        <CardHeader><CardTitle><Layout className="style-icon"/>War Room</CardTitle></CardHeader>
                        <CardContent>High-pressure, metric-driven, real-time decisions.</CardContent>
                    </Card>
                    <Card
                        className="pitch-style-card"
                        onClick={() => {
                            console.log('Elevator Pitch Clicked');
                            setPitchStyle('elevator-pitch');
                        }}
                    >
                        <CardHeader><CardTitle><Rocket className="style-icon"/>Elevator Pitch Challenge</CardTitle></CardHeader>
                        <CardContent>Fast-paced, concise pitching against the clock.</CardContent>
                    </Card>
                    <Card
                        className="pitch-style-card"
                        onClick={() => {
                            console.log('CYOA Clicked');
                            setPitchStyle('cyoa');
                        }}
                    >
                        <CardHeader><CardTitle><Map className="style-icon"/>Choose Your Own Adventure</CardTitle></CardHeader>
                        <CardContent>Narrative-driven, branching story with varied outcomes.</CardContent>
                    </Card>
                    <Card
                        className="pitch-style-card"
                        onClick={() => {
                            console.log('Deck Builder Clicked');
                            setPitchStyle('deck-builder');
                        }}
                    >
                        <CardHeader><CardTitle><LayoutPanelLeft className="style-icon"/>Gamified Pitch Deck Builder</CardTitle></CardHeader>
                        <CardContent>Interactive deck building, visual presentation focus.</CardContent>
                    </Card>
                    <Card
                        className="pitch-style-card"
                        onClick={() => {
                            console.log('Role-Playing Panelist Clicked');
                            setPitchStyle('role-playing-panelist');
                        }}
                    >
                        <CardHeader><CardTitle><UserRound className="style-icon"/>Role-Playing Panelist</CardTitle></CardHeader>
                        <CardContent>Empathy-focused, nuanced panelist interaction.</CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );


    const renderStagePresentationUI = () => { // Placeholder for Stage Presentation UI
        return (
            <div className="stage-presentation-container">
                <h3 className="stage-presentation-title">Stage Presentation</h3>
                <div className="stage-presentation-panelists">
                    {/* Panelist Avatars and Names will go here */}
                    <p>Panelist Area Placeholder - Style: Stage Presentation</p>
                </div>
                <div className="stage-presentation-stage-area">
                    {/* User Stage Area (initially text) */}
                    <p>Your Stage Area Placeholder</p>
                    <div className="stage-presentation-question-area">
                        {/* Panelist Question Display */}
                        <p>Question Area Placeholder</p>
                    </div>
                </div>
                <div className="stage-presentation-response-options">
                    {/* Response Options Buttons */}
                    <p>Response Options Placeholder</p>
                </div>
                <div className="stage-presentation-pitch-log">
                    {/* Pitch Log */}
                    <p>Pitch Log Placeholder</p>
                </div>
            </div>
        );
    };

    const renderWarRoomUI = () => { // Placeholder for War Room UI
        return ( // ... (rest of placeholder UI functions are the same as before) ...
            <div className="style-ui-placeholder">
                <h3>War Room UI - Under Construction</h3>
                {/* UI elements for War Room style will go here */}
                <p>... UI for War Room - Under Construction ...</p>
            </div>
        );
    };

    const renderElevatorPitchUI = () => { // Placeholder for Elevator Pitch UI
        return (
            <div className="style-ui-placeholder">
                <h3>Elevator Pitch Challenge UI - Under Construction</h3>
                {/* UI elements for Elevator Pitch Challenge style will go here */}
                <p>... UI for Elevator Pitch Challenge - Under Construction ...</p>
            </div>
        );
    };

    const renderCYOAUI = () => { // Placeholder for CYOA UI
        return (
            <div className="style-ui-placeholder">
                <h3>Choose Your Own Adventure Pitch UI - Under Construction</h3>
                {/* UI elements for Choose Your Own Adventure Pitch style will go here */}
                <p>... UI for Choose Your Own Adventure Pitch - Under Construction ...</p>
            </div>
        );
    };

    const renderDeckBuilderUI = () => { // Placeholder for Deck Builder UI
        return (
            <div className="style-ui-placeholder">
                <h3>Gamified Pitch Deck Builder UI - Under Construction</h3>
                {/* UI elements for Gamified Pitch Deck Builder style will go here */}
                <p>... UI for Gamified Pitch Deck Builder - Under Construction ...</p>
            </div>
        );
    };

    const renderRolePlayingPanelistUI = () => { // Placeholder for Role-Playing Panelist UI
        return (
            <div className="style-ui-placeholder">
                <h3>Role-Playing Panelist UI - Under Construction</h3>
                {/* UI elements for Role-Playing Panelist style will go here */}
                <p>... UI for Role-Playing Panelist - Under Construction ...</p>
            </div>
        );
    };


    const renderMainContentSetupCard = () => { // ... (same renderMainContentSetupCard function as before, now using editableScenario?.scenario) ...
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
                        <TextArea // Using imported TextArea component
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


    const renderMainContentCardSetup = () => { // ... (same renderMainContentCardSetup function as before) ...
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


    const renderMainContentDebriefing = () => { // ... (same renderMainContentDebriefing function as before) ...
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


    return ( // ... (Main Return - mostly the same, updated renderMainContent call) ...
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
                        {renderMainContent()} {/* Call updated renderMainContent */}
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


export const metadata = { // ... (same metadata as before) ...
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