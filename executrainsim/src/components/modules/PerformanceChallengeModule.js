import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Select, { SelectItem } from '../ui/Select';
import Progress from '../ui/Progress';
import { BarLoader, GridLoader } from 'react-spinners';
import { Info, Star, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import '../../styles/AppStyles.css';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import DOMPurify from 'dompurify';

// ---------------------------------------------------------------------
// Unified API Base URL setup
// In development, if REACT_APP_API_URL is not set, use http://localhost:8080.
// In production, default to a relative URL.
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');
console.log('[PerformanceChallengeModule] API_BASE_URL at runtime:', API_BASE_URL);

// ---------------------------------------------------------------------
// Helper to construct endpoints.
const constructEndpoint = (baseURL, path) => `${baseURL}${path}`;

// ---------------------------------------------------------------------
// Module Component
const PerformanceChallengeModule = ({ onReturn = () => {}, onSelectModule = () => {}, modules = [] }) => {
    // State variables
    const [role, setRole] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [scenario, setScenario] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [progress, setProgress] = useState(0);
    const [totalScore, setTotalScore] = useState(() => parseInt(localStorage.getItem('totalScore'), 10) || 0);
    const [simulationComplete, setSimulationComplete] = useState(false);
    const [debriefing, setDebriefing] = useState(null);
    const [images, setImages] = useState({});
    const [customAnswers, setCustomAnswers] = useState({});
    const [useCustomScenario, setUseCustomScenario] = useState(false);
    const [customScenarioText, setCustomScenarioText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [customRole, setCustomRole] = useState('');

    // Options for dropdowns
    const roles = [
        { value: 'ceo', title: 'CEO - Chief Executive Officer' },
        { value: 'cfo', title: 'CFO - Chief Financial Officer' },
        { value: 'chro', title: 'CHRO - Chief Human Resources Officer' },
        { value: 'clo', title: 'CLO - Chief Legal Officer' },
        { value: 'cmo', title: 'CMO - Chief Marketing Officer' },
        { value: 'cto', title: 'CTO - Chief Technology Officer' },
        { value: 'coo', title: 'COO - Chief Operations Officer' },
        { value: 'custom', title: 'Custom Role' }
    ];

    const experienceLevels = [
        { value: 'junior', title: 'Junior (0-2 years)' },
        { value: 'mid', title: 'Mid-level (3-5 years)' },
        { value: 'senior', title: 'Senior (6-10 years)' },
        { value: 'executive', title: 'Executive (10+ years)' }
    ];

    const difficultyLevels = [
        { value: 'easy', title: 'Easy' },
        { value: 'medium', title: 'Medium' },
        { value: 'hard', title: 'Hard' },
        { value: 'expert', title: 'Expert' }
    ];

    useEffect(() => {
        localStorage.setItem('totalScore', totalScore);
    }, [totalScore]);

    // ---------------------------------------------------------------------
    // Unified API Call Function
    // Similar to the Negotiation module, this function posts to the API endpoint,
    // cleans any triple-backtick formatting, and returns the parsed JSON.
    const fetchOpenAIResponse = async (prompt) => {
        setIsFetching(true);
        try {
            const response = await axios.post(
                constructEndpoint(API_BASE_URL, '/api/generate'),
                {
                    messages: [{ role: 'system', content: prompt }],
                    temperature: 0.75,
                    max_tokens: 1800
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (!response.data) {
                throw new Error('Empty or invalid response data');
            }
            // Check for ChatGPT-style response
            if (
              response.data.choices &&
              response.data.choices[0] &&
              response.data.choices[0].message &&
              response.data.choices[0].message.content
            ) {
                const rawData = response.data.choices[0].message.content;
                const cleanedData = rawData
                  .replace(/^```(?:json)?\s*/i, '')
                  .replace(/```$/i, '')
                  .trim();
                return JSON.parse(cleanedData);
            } else {
                return response.data;
            }
        } catch (error) {
            console.error('Error fetching from OpenAI:', error);
            setErrorMessage('Failed to communicate with the server. Please try again.');
            return null;
        } finally {
            setIsFetching(false);
        }
    };

    // ---------------------------------------------------------------------
    // Simulation Start / Reset Functions
    const startSimulation = async () => {
        // Determine the selected role title based on the value
        const selectedRoleTitle = role === 'custom'
            ? customRole
            : roles.find(r => r.value === role)?.title;
        if (!selectedRoleTitle || !experienceLevel || !difficulty) {
            setErrorMessage('Please select a role, experience level, and difficulty to start the simulation.');
            return;
        }
        setErrorMessage('');
        // Build a prompt based on whether a custom scenario is in use or not.
        const prompt = useCustomScenario && customScenarioText
            ? `Given the custom scenario description: "${customScenarioText}", generate a title, initial question, and options with consequences suitable for a ${selectedRoleTitle} with ${experienceLevels.find(level => level.value === experienceLevel).title} experience at ${difficultyLevels.find(level => level.value === difficulty).title} difficulty. Return a JSON object with: { "scenario": { "title": "Scenario Title", "description": "${customScenarioText}", "initial_question": "The initial question for the user", "options": [ {"description": "Option 1 description"}, {"description": "Option 2 description"}, {"description": "Option 3 description"}, {"description": "Option 4 description"} ] } }`
            : `Generate an engaging business scenario for a ${selectedRoleTitle} with ${experienceLevels.find(level => level.value === experienceLevel).title} experience at ${difficultyLevels.find(level => level.value === difficulty).title} difficulty. Create the initial question, scenario description, and several options with potential consequences for each choice. Return a JSON object with: { "scenario": { "title": "Scenario Title", "description": "Detailed scenario description", "initial_question": "The initial question for the user", "options": [ {"description": "Option 1 description"}, {"description": "Option 2 description"}, {"description": "Option 3 description"}, {"description": "Option 4 description"} ] } }`;

        const scenarioData = await fetchOpenAIResponse(prompt);

        if (scenarioData?.scenario) {
            setScenario(scenarioData.scenario);
            resetStateVariables();
            await generateImage(scenarioData.scenario.title, scenarioData.scenario.context);
        } else {
            setErrorMessage('Failed to generate scenario. Please try again.');
        }
    };

    const resetStateVariables = () => {
        setCurrentQuestionIndex(0);
        setProgress(0);
        setTotalScore(0);
        setAnswers([]);
        setSimulationComplete(false);
        setDebriefing(null);
        setCustomAnswers({});
        setImages({});
    };

    const resetSimulation = () => {
        setScenario(null);
        resetStateVariables();
        setCustomScenarioText('');
    };

    // ---------------------------------------------------------------------
    // Utility Functions
    const formatTextWithLineBreaks = (text) => {
        if (!text) return null;
        return text.split(/\.\s+/).map((sentence, index) => (
            <p key={index} style={{ marginBottom: '1em' }}>
                {sentence.trim()}
            </p>
        ));
    };

    // ---------------------------------------------------------------------
    // Answer / Follow-Up Functions
    const handleAnswer = async (selectedOptionIndex) => {
        if (!scenario || !scenario.options || selectedOptionIndex >= scenario.options.length) {
            setErrorMessage('Invalid option selected.');
            return;
        }
        const selectedOption = scenario.options[selectedOptionIndex];
        const followUpPayload = {
            role: role === 'custom'
                ? customRole
                : roles.find(r => r.value === role)?.title,
            experienceLevel,
            difficulty,
            scenario: scenario.description,
            question: scenario.initial_question,
            answer: selectedOption.description,
            previousAnswers: answers
        };

        const prompt = `Given the scenario: "${followUpPayload.scenario}", and the question: "${followUpPayload.question}", you answered: "${followUpPayload.answer}". Based on this, generate the next question and update the scenario by introducing new elements, challenges, or twists. The updated scenario should reflect changes or consequences of the previous decision, and introduce fresh dynamics that keep the user engaged. Provide feedback and a score for the chosen answer. Return a JSON object with: { "next_question": { "question": "Next question for the user", "scenario_description": "Updated scenario description introducing new dynamics", "options": [ {"description": "Option 1 description"}, {"description": "Option 2 description"}, {"description": "Option 3 description"}, {"description": "Option 4 description"} ] }, "score": { "current_score": (score), "feedback": "Detailed feedback on how the user's choice impacted the scenario" } }`;

        const responseData = await fetchOpenAIResponse(prompt);
        if (responseData && responseData.next_question && responseData.score) {
            updateStateWithAnswer(selectedOption.description, responseData.next_question, responseData.score);
            await generateImage(scenario.title, scenario.description); // Generate a new image based on the updated scenario
        } else {
            setErrorMessage('Failed to process your answer. Please try again.');
        }
    };

    const updateStateWithAnswer = (selectedOption, nextQuestion, score) => {
        setTotalScore(prevScore => prevScore + score.current_score);
        setAnswers(prevAnswers => [
            ...prevAnswers,
            {
                question: scenario.initial_question,
                answer: { description: selectedOption },
                feedback: score.feedback,
                score: score.current_score,
            }
        ]);
        setScenario(prevScenario => ({
            ...prevScenario,
            description: nextQuestion.scenario_description,
            options: nextQuestion.options,
            initial_question: nextQuestion.question
        }));
        setCurrentQuestionIndex(prev => prev + 1);
        setProgress(prev => Math.min(prev + 20, 100));

        if (answers.length >= 4) {
            setSimulationComplete(true);
            generateDebriefing();
        }
    };

    const goToPreviousQuestion = () => {
        if (simulationComplete) {
            setSimulationComplete(false);
            setCurrentQuestionIndex(answers.length - 1);
        } else if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < answers.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else if (!simulationComplete) {
            setSimulationComplete(true);
        }
    };

    const toggleCustomAnswer = (index) => {
        setCustomAnswers(prev => {
            const updated = { ...prev };
            if (updated[index]) {
                delete updated[index];
            } else {
                updated[index] = '';
            }
            return updated;
        });
    };

    // ---------------------------------------------------------------------
    // Image Generation (using the unified API_BASE_URL)
    const generateImage = async (title, description) => {
        setIsImageLoading(true);
        const imagePrompt = `Illustrate the following updated scenario titled "${title}": "${description}". The illustration should resemble colorful 1990s clip art with simple, clean lines and a focus on clarity. Use basic but colorful vector illustrations of the scenario, without any text.`;
        try {
            const response = await axios.post(
                constructEndpoint(API_BASE_URL, '/api/dalle/image'),
                { prompt: imagePrompt },
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (response.data && response.data.imagePath) {
                setImages(prevImages => ({
                    ...prevImages,
                    [currentQuestionIndex]: response.data.imagePath
                }));
            } else {
                throw new Error('Image generation failed');
            }
        } catch (error) {
            console.error('Error generating image:', error);
            setErrorMessage('Failed to generate the image. Please try again.');
        } finally {
            setIsImageLoading(false);
        }
    };

    // ---------------------------------------------------------------------
    // Debriefing Generation
    const generateDebriefing = async () => {
        const debriefingPayload = {
            scenario: scenario.title,
            answers
        };
        const prompt = `Provide a detailed debriefing summary for the scenario: "${debriefingPayload.scenario}" based on your answers: ${JSON.stringify(debriefingPayload.answers)}. Include strengths, areas for improvement, overall score, letter grade, and advice. Return a JSON object with: { "debriefing": { "summary": "Summary of the simulation", "strengths": ["Strength 1", "Strength 2"], "areasForImprovement": ["Improvement 1", "Improvement 2"], "overallScore": (X/150), "letterGrade": "(A-F)", "stars": (1-5), "advice": "Recommendations" } }`;
        const debriefingResponse = await fetchOpenAIResponse(prompt);
        if (debriefingResponse && debriefingResponse.debriefing) {
            setDebriefing(debriefingResponse.debriefing);
        } else {
            setErrorMessage('Failed to generate the debriefing. Please try again.');
        }
    };

    // ---------------------------------------------------------------------
    // Sample Scenario Generation (for custom scenario inspiration)
    const generateSampleScenario = async () => {
        const samplePrompt = `Generate a short, engaging sample scenario that would be used for an executive performance challenge, focusing on a business or leadership situation. The scenario should be one to two sentences long. Return only the scenario text, do not include any JSON.`;
        try {
            const response = await fetchOpenAIResponse(samplePrompt);
            if (response) {
                const sampleText = typeof response === 'string' ? response.trim() : '';
                setCustomScenarioText(sampleText);
            } else {
                setErrorMessage('Failed to generate the sample scenario. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching sample scenario:', error);
            setErrorMessage('Failed to generate a sample scenario. Please try again.');
        }
    };

    // ---------------------------------------------------------------------
    // Render JSX
    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-box">
                    <span className="header-title">Executive Performance Challenge</span>
                    <Menu className="hamburger-icon" onClick={() => setDropdownVisible(!dropdownVisible)} />
                    {dropdownVisible && (
                        <div className="dropdown-menu">
                            {modules.map((module, index) => (
                                <div key={index} onClick={() => onSelectModule(module.title)}>
                                    {module.title}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <main className="content-grid">
                <aside className="left-column">
                    {scenario ? (
                        <>
                            <div className="step-box">
                                <ChevronLeft
                                    onClick={goToPreviousQuestion}
                                    className={`nav-arrow ${currentQuestionIndex === 0 && !simulationComplete ? 'disabled' : ''}`}
                                    title="Previous Question"
                                />
                                <span>{simulationComplete ? "Summary" : `Question ${currentQuestionIndex + 1}`}</span>
                                <ChevronRight
                                    onClick={goToNextQuestion}
                                    className={`nav-arrow ${simulationComplete ? 'disabled' : ''}`}
                                    title={simulationComplete ? "Summary" : "Next Question"}
                                />
                            </div>
                            <Card className="details-card">
                                <CardHeader>
                                    <CardTitle>Your Simulation</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="progress-info">
                                        <Progress value={progress} />
                                        <span className="progress-text">{progress}% Complete</span>
                                    </div>
                                    <div className="module-description">
                                        <Button onClick={() => setShowInstructions(!showInstructions)}>
                                            {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                                        </Button>
                                        {showInstructions && (
                                            <div dangerouslySetInnerHTML={{ __html: metadata.instructions }} />
                                        )}
                                    </div>
                                    <div className="user-settings">
                                        <p><strong>Role:</strong> {role === 'custom' ? customRole : roles.find(r => r.value === role)?.title}</p>
                                        <p><strong>Experience Level:</strong> {experienceLevels.find(level => level.value === experienceLevel)?.title}</p>
                                        <p><strong>Difficulty:</strong> {difficultyLevels.find(level => level.value === difficulty)?.title}</p>
                                    </div>
                                    {images[currentQuestionIndex] ? (
                                        <img src={images[currentQuestionIndex]} alt="Scenario Illustration" className="scenario-image" />
                                    ) : (
                                        <div className="image-placeholder">
                                            <GridLoader color="#FFDAA1" loading={isImageLoading} size={15} />
                                        </div>
                                    )}
                                    <Button onClick={resetSimulation} className="restart-button">Restart Simulation</Button>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="details-card">
                            <CardContent>
                                <img src="images/PerformanceChallengeModule.png" alt="Scenario Illustration" className="scenario-image" />
                            </CardContent>
                            <CardHeader>
                                <CardTitle>Performance Challenge</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="module-description">
                                    <h2>Executive Performance Challenge</h2>
                                    <p>Test your strategic skills in a dynamic simulation. Make impactful decisions and navigate complex challenges to enhance your executive capabilities.</p>
                                    <Button onClick={() => setShowInstructions(!showInstructions)}>
                                        {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                                    </Button>
                                    {showInstructions && (
                                        <div dangerouslySetInnerHTML={{ __html: metadata.instructions }} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </aside>

                <section className="main-content">
                    {errorMessage && (
                        <div className="error-box">
                            <h4 className="error-title">
                                <Info className="icon" size={18} />
                                Error
                            </h4>
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    {!simulationComplete ? (
                        scenario ? (
                            <Card className="scenario-card">
                                <CardHeader>
                                    <div className="scenario-title-container">
                                        <CardTitle>{scenario.title}</CardTitle>
                                    </div>
                                    <div className="spinner-container">
                                        <BarLoader color="#0073e6" loading={isFetching} width="100%" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {currentQuestionIndex > 0 && currentQuestionIndex <= answers.length && (
                                        <div className="feedback-section">
                                            <p className="your-answer"><strong>Your Answer:</strong> {answers[currentQuestionIndex - 1]?.answer.description}</p>
                                            <div className="feedback">
                                                <h4 className="feedback-title">
                                                    <Info className="icon" size={18} />
                                                    Feedback
                                                </h4>
                                                <p>{answers[currentQuestionIndex - 1]?.feedback}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="scenario-description">
                                        {formatTextWithLineBreaks(scenario.description)}
                                    </div>
                                    <h3 className="question-title">{formatTextWithLineBreaks(scenario.initial_question)}</h3>
                                    <div className="options-container">
                                        {scenario && scenario.options && scenario.options.map((option, index) => (
                                            <Button key={index} onClick={() => handleAnswer(index)} className="option-button">
                                                {option.description}
                                            </Button>
                                        ))}
                                        <div className="custom-answer-section">
                                            <div className="form-group">
                                                <label className="custom-answer-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!customAnswers[currentQuestionIndex]}
                                                        onChange={() => toggleCustomAnswer(currentQuestionIndex)}
                                                    />
                                                    Submit Custom Answer
                                                </label>
                                            </div>
                                            {customAnswers[currentQuestionIndex] !== undefined && (
                                                <div className="form-group custom-answer-form">
                                                    <textarea
                                                        placeholder="Enter your custom answer here."
                                                        value={customAnswers[currentQuestionIndex] || ''}
                                                        onChange={(e) =>
                                                            setCustomAnswers(prev => ({
                                                                ...prev,
                                                                [currentQuestionIndex]: e.target.value,
                                                            }))
                                                        }
                                                        rows="4"
                                                        className="custom-answer-textarea"
                                                    />
                                                    <Button onClick={() => handleAnswer(null, customAnswers[currentQuestionIndex])}>
                                                        Submit Custom Answer
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="setup-card">
                                <CardHeader>
                                    <CardTitle className="header-title">Setup Your Simulation</CardTitle>
                                    <div className="spinner-container">
                                        <BarLoader color="#0073e6" loading={isFetching} width="100%" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Role Selection */}
                                    <div className="form-group">
                                        <label>Select your role</label>
                                        <Select onValueChange={setRole} value={role} disabled={!!scenario}>
                                            <SelectItem value="">Choose a role</SelectItem>
                                            {roles.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>{r.title}</SelectItem>
                                            ))}
                                        </Select>
                                        {role === 'custom' && (
                                            <input
                                                type="text"
                                                className="custom-role-input"
                                                placeholder="Enter your custom role"
                                                value={customRole}
                                                onChange={(e) => setCustomRole(e.target.value)}
                                                disabled={!!scenario}
                                            />
                                        )}
                                    </div>
                                    {/* Experience Level Selection */}
                                    <div className="form-group">
                                        <label>Select your experience level</label>
                                        <Select onValueChange={setExperienceLevel} value={experienceLevel} disabled={!!scenario}>
                                            <SelectItem value="">Choose experience level</SelectItem>
                                            {experienceLevels.map((level) => (
                                                <SelectItem key={level.value} value={level.value}>{level.title}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    {/* Difficulty Level Selection */}
                                    <div className="form-group">
                                        <label>Select difficulty level</label>
                                        <Select onValueChange={setDifficulty} value={difficulty} disabled={!!scenario}>
                                            <SelectItem value="">Choose difficulty</SelectItem>
                                            {difficultyLevels.map((level) => (
                                                <SelectItem key={level.value} value={level.value}>{level.title}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    {/* Custom Scenario Input */}
                                    <div className="form-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={useCustomScenario}
                                                onChange={() => setUseCustomScenario(!useCustomScenario)}
                                            />
                                            Use Custom Scenario
                                        </label>
                                    </div>
                                    {useCustomScenario && (
                                        <>
                                            <div className="form-group">
                                                <textarea
                                                    placeholder="Enter your custom scenario here or click Generate Sample Scenario for inspiration."
                                                    value={customScenarioText}
                                                    onChange={(e) => setCustomScenarioText(e.target.value)}
                                                    rows="6"
                                                    className="custom-scenario-textarea"
                                                />
                                            </div>
                                            <Button onClick={generateSampleScenario}>Generate Sample Scenario</Button>
                                        </>
                                    )}
                                    {/* Start Simulation Button */}
                                    <div className="button-group">
                                        <Button onClick={startSimulation}>Start Simulation</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    ) : (
                        debriefing && (
                            <div className="debriefing-section">
                                <h4 className="debriefing-title">Simulation Debriefing</h4>
                                <p><strong>Summary:</strong> {debriefing.summary}</p>
                                <p><strong>Strengths:</strong> {debriefing.strengths ? debriefing.strengths.join(', ') : 'None'}</p>
                                <p><strong>Areas for Improvement:</strong> {debriefing.areasForImprovement ? debriefing.areasForImprovement.join(', ') : 'None'}</p>
                                <p><strong>Overall Score:</strong> {debriefing.overallScore}</p>
                                <p><strong>Letter Grade:</strong> {debriefing.letterGrade}</p>
                                <div className="stars-container">
                                    {[...Array(debriefing.stars || 0)].map((_, i) => (
                                        <Star key={i} className="star filled" />
                                    ))}
                                    {[...Array(5 - (debriefing.stars || 0))].map((_, i) => (
                                        <Star key={i} className="star" />
                                    ))}
                                </div>
                                <p><strong>Recommendations:</strong> {debriefing.advice}</p>
                                <div className="action-buttons">
                                    <Button onClick={() => setSimulationComplete(false)}>Try Different Choices</Button>
                                    <Button onClick={resetSimulation}>Run as Different Role</Button>
                                </div>
                            </div>
                        )
                    )}
                </section>
            </main>
        </div>
    );
};

// ---------------------------------------------------------------------
// Metadata for the Module
export const metadata = {
    title: 'Executive Performance Challenge',
    description: 'Unleash your strategic prowess with our Performance Challenge Module.',
    imageUrl: '../images/PerformanceChallengeModule.png',
    component: PerformanceChallengeModule,
    instructions: `
      <h2>Gameplay Overview</h2>
      <p>Welcome to the Executive Performance Challenge module! Here, you'll test and enhance your strategic decision-making skills in a dynamic business environment. Step into the shoes of a high-level executive and tackle critical business scenarios that demand careful judgment and strategic thinking.</p>

      <h3>Simulation Process</h3>
      <ol>
        <li><strong>Role and Scenario Selection:</strong> Choose your executive role (CEO, CFO, etc.), experience level, and challenge difficulty. Opt for a custom scenario for a personalized experience.</li>
        <li><strong>Scenario Unfolding:</strong> Face a business scenario with an initial question requiring a strategic decision.</li>
        <li><strong>Decision Making:</strong> Select from predefined options or input a custom answer to address the situation strategically.</li>
        <li><strong>Dynamic Challenges:</strong> The simulation adapts to your decisions, presenting new questions and challenges based on your choices.</li>
        <li><strong>Feedback and Scoring:</strong> Receive immediate feedback and scores evaluating your decision effectiveness and strategic skills.</li>
        <li><strong>Progress Tracking:</strong> Monitor your cumulative score and completion progress throughout the simulation.</li>
        <li><strong>Debriefing:</strong> Upon completion, receive a comprehensive debriefing with a performance summary, strengths, areas for improvement, score, grade, star rating and actionable advice for future challenges.</li>
      </ol>

      <h3>Key Features</h3>
      <ul>
        <li><strong>Role-Based Simulations:</strong> Experience challenges tailored to different executive roles.</li>
        <li><strong>Adaptive Difficulty:</strong> Match the simulation difficulty to your experience level, ensuring a challenging yet engaging learning experience.</li>
        <li><strong>Custom Scenarios:</strong> Option to use custom scenarios, allowing for training in specific, user-defined business contexts.</li>
        <li><strong>Strategic Options & Custom Answers:</strong> Choose from predefined strategic options or implement your own solutions with custom answers.</li>
        <li><strong>Performance Scoring & Feedback:</strong> Receive scores and feedback that evaluate your decision-making effectiveness, helping you understand your strengths and weaknesses.</li>
        <li><strong>Comprehensive Debriefing:</strong> Get a detailed debriefing at the end of each simulation, offering insights and recommendations for continuous improvement.</li>
      </ul>

      <p>Prepare to make critical decisions under pressure and see how your strategic choices impact the outcome. The Executive Performance Challenge is your platform to hone executive skills and strategic acumen.</p>
    `,
};

export default PerformanceChallengeModule;
