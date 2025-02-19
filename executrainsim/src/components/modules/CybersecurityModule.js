// CybersecurityModule.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import {
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Button,
  Grid,
  Typography,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Menu as MenuIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { BeatLoader } from 'react-spinners';
import Progress from '../ui/Progress';

// --- Configuration helpers ---
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');
const constructEndpoint = (baseURL, path) => `${baseURL}${path}`;

// --- JSON parsing helper ---
const parseAiJson = (apiResponse) => {
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
      return cleaned;
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

// --- Create Material UI theme ---
const moduleTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#007bff' },
    secondary: { main: '#f0a202' },
    background: { default: '#1a1a1a', paper: '#222' },
    text: { primary: '#eee' },
  },
});

// --- Main Component ---
const CybersecurityModule = ({ onReturn, onSelectModule, modules }) => {
  // ============================================================
  // STATE VARIABLES
  // ============================================================
  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [scenario, setScenario] = useState(null);
  const [editableScenario, setEditableScenario] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [progress, setProgress] = useState(0);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [debriefing, setDebriefing] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [notifications, setNotifications] = useState([]); // Feedback messages
  const [responseOptions, setResponseOptions] = useState([]);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ networkHealth: 100, serverLoad: 0, intrusionAttempts: 0 });
  const [metrics, setMetrics] = useState({ securityScore: 100, threatLevel: 0, systemUptime: 100, timeElapsed: 0 });
  const [metricHistory, setMetricHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [logs, setLogs] = useState([]);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [radarData, setRadarData] = useState(null);
  const [isScenarioEditable, setIsScenarioEditable] = useState(false);
  const [isUserReplyLoading, setIsUserReplyLoading] = useState(false);
  const [activePhase, setActivePhase] = useState('setup');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef(null);
  const logsEndRef = useRef(null);
  const chatHistoryContainerRef = useRef(null);
  const [isSystemMessageLoading, setIsSystemMessageLoading] = useState(false);

  // Role & Difficulty Options
  const roles = [
    { value: 'security-analyst', title: 'Security Analyst' },
    { value: 'it-manager', title: 'IT Manager' },
    { value: 'ciso', title: 'CISO - Chief Information Security Officer' },
    { value: 'software-developer', title: 'Software Developer' },
    { value: 'network-administrator', title: 'Network Administrator' },
  ];
  const difficultyLevels = [
    { value: 'easy', title: 'Easy' },
    { value: 'medium', title: 'Medium' },
    { value: 'hard', title: 'Hard' },
    { value: 'expert', title: 'Expert' },
  ];

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    if (logs.length > 0) {
      scrollToBottom();
    }
  }, [logs]);

  useEffect(() => {
    if (simulationStarted && scenario) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
        setMetrics((prev) => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [simulationStarted, scenario]);

  useEffect(() => {
    if (simulationStarted) {
      setMetricHistory((prev) => [...prev, { ...metrics, time: timeElapsed }]);
    }
  }, [timeElapsed, metrics, simulationStarted]);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const scrollToBottom = () => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const addLog = (log) => {
    setLogs((prev) => [...prev, { message: log, timestamp: new Date() }]);
  };

  const addNotification = (message) => {
    setNotifications((prev) => [...prev, { message, timestamp: new Date() }]);
  };

  const updateMetrics = (changes, points = 0) => {
    setMetrics((prev) => ({ ...prev, ...changes }));
  };

  // ============================================================
  // API CALL FUNCTIONS
  // ============================================================
  const fetchOpenAIResponse = async (input, endpointPath, isUserAction = false) => {
    setIsFetching(true);
    if (isUserAction) {
      setIsUserReplyLoading(true);
    }
    try {
      const endpoint = constructEndpoint(API_BASE_URL, endpointPath);
      const response = await axios.post(endpoint, input, {
        headers: { 'Content-Type': 'application/json' },
      });
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

  // ============================================================
  // SIMULATION FUNCTIONS
  // ============================================================
  const generateScenario = async () => {
    setIsFetching(true);
    try {
      const selectedRoleTitle = roles.find((r) => r.value === role)?.title;
      const selectedDifficultyTitle = difficultyLevels.find((level) => level.value === difficulty)?.title;
      if (!selectedRoleTitle || !selectedDifficultyTitle) {
        setErrorMessage('Please select a role and difficulty.');
        return;
      }
      setErrorMessage('');
      const prompt = String.raw`
        Create a detailed cybersecurity simulation scenario for a ${selectedRoleTitle} at ${selectedDifficultyTitle} difficulty level.
        The scenario should include a title, a detailed context, specific objectives, a description of the starting state of the system, and a series of interconnected decision points to be resolved by the user.
        Each decision point should have:
           - an ID
           - a description of the security alert,
           - 3-5 options to choose from with a brief description of the intended action,
           - expected results of each option,
           - and a "consequences" object with specific values for networkHealth, serverLoad, intrusionAttempts, securityScore, threatLevel, and systemUptime.
        Also provide a brief 'feedback' message to be delivered after a user response.
        Return the result in JSON format:
        {
            "scenario": {
                "title": "string",
                "context": "string",
                "objectives": ["string"],
                "startingState": {
                    "networkHealth": "number",
                    "serverLoad": "number",
                    "intrusionAttempts": "number"
                },
                "decision_points": [
                    {
                        "id": "number",
                        "description": "string",
                        "options": [
                            { "name": "string", "description": "string", "result": "string", "consequences": { "networkHealth": "number", "serverLoad": "number", "intrusionAttempts": "number", "securityScore": "number", "threatLevel": "number", "systemUptime": "number" }, "points": "number" }
                        ]
                    }
                ],
                "feedback": "string"
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
        setEditableScenario(parsedScenario.scenario);
        setSystemStatus(parsedScenario.scenario.startingState);
        addNotification(`Urgent: ${parsedScenario.scenario.decision_points[0].description}`);
      } else {
        setErrorMessage('Failed to generate scenario. Please try again.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while generating the scenario.');
    }
    setIsFetching(false);
  };

  const startSimulation = async () => {
    if (!role || !difficulty) {
      setErrorMessage('Please select a role and difficulty.');
      return;
    }
    if (!scenario) {
      setErrorMessage('Please generate a scenario first.');
      return;
    }
    setSimulationStarted(true);
    setErrorMessage('');
    setSystemStatus(scenario.startingState);
    addLog(
      `Simulation started. Role: ${roles.find((r) => r.value === role).title}, Difficulty: ${difficultyLevels.find(
        (level) => level.value === difficulty
      ).title}`
    );
    setActivePhase('simulation');
    if (scenario?.decision_points && scenario.decision_points.length > 0) {
      const initialAlert = {
        id: scenario.decision_points[0].id,
        description: scenario.decision_points[0].description,
        options: scenario.decision_points[0].options,
      };
      setAlerts([initialAlert]);
      setSelectedAlert(initialAlert);
      generateResponseOptions(initialAlert.description);
    }
  };

  const generateResponseOptions = async (context) => {
    if (!role || !difficulty) {
      console.warn('Role or difficulty not set. Skipping response option generation.');
      return;
    }
    const prompt = String.raw`
      Based on the active simulation and the current alert: "${context}",
      generate 3 to 5 strategic response options that the user could employ.
      Each option should be concise and directly related to the current issue.
      Return the response in the JSON format:
      {
        "options": [{ "name": "string", "description": "string" }]
      }
    `;
    try {
      const rawResponse = await fetchOpenAIResponse(
        { messages: [{ role: 'system', content: prompt }], temperature: 0.7, max_tokens: 400 },
        '/api/generate'
      );
      handleResponseOptions(rawResponse);
    } catch (error) {
      console.error('Failed to generate response options:', error);
      setErrorMessage('Failed to generate response options. Please try again.');
    }
  };

  const handleResponseOptions = (rawResponse) => {
    if (!rawResponse) {
      console.error('Received empty response from API.');
      setErrorMessage('Failed to generate response options. Please try again.');
      return;
    }
    const parsed = parseAiJson(rawResponse);
    if (parsed?.options) {
      setResponseOptions(parsed.options);
    } else {
      console.error('Invalid response structure:', parsed);
      setErrorMessage('Failed to generate response options. Please try again.');
    }
  };

  const handleResolution = async (actionIndex) => {
    if (!selectedAlert) return;
    setIsResponseLoading(true);
    const selectedOption = responseOptions[actionIndex] || null;
    const actionDescription = selectedOption ? selectedOption.description : 'No action selected';
    addLog(`User action: ${actionDescription}.`);
    const systemPrompt = String.raw`
      As a simulation engine in a cybersecurity environment, respond to the user's action based on the current alert: "${selectedAlert.description}".
      Evaluate the effectiveness of the user's choice: "${actionDescription}" and adjust the simulation accordingly.
      Provide a follow-up message that includes next steps or challenges the user will face. Keep the message brief and to the point.
      Return the response in JSON format with the following structure:
      {
         "message": "string",
         "feedback": "string",
         "updatedScenario": { ... },
         "nextAlert": { ... }
      }
    `;
    try {
      const rawResponse = await fetchOpenAIResponse(
        { messages: [{ role: 'system', content: systemPrompt }], temperature: 0.7, max_tokens: 1000 },
        '/api/generate'
      );
      if (!rawResponse) {
        throw new Error('No response from AI server');
      }
      const parsed = parseAiJson(rawResponse);
      const systemMessage = parsed?.message;
      const systemFeedback = parsed?.feedback;
      const nextAlert = parsed?.nextAlert;
      const updatedScenario = parsed?.updatedScenario;
      if (!systemMessage || !updatedScenario) {
        throw new Error('System response is empty or invalid JSON.');
      }
      addLog(`System message: ${systemMessage}`);
      addNotification(`System: ${systemMessage}`);
      if (updatedScenario?.decision_points) {
        const nextAlerts = updatedScenario.decision_points.map((dp) => ({
          id: dp.id,
          description: dp.description,
          options: dp.options,
        }));
        setAlerts(nextAlerts);
      } else {
        setAlerts([]);
      }
      addLog(`System feedback: ${systemFeedback}`);
      setSelectedAlert(nextAlert);
      setScenario(updatedScenario);
      setSystemStatus(updatedScenario.startingState);
      setProgress((prev) => Math.min(prev + 20, 100));
      if (selectedAlert.options[actionIndex]?.consequences) {
        const consequences = selectedAlert.options[actionIndex].consequences;
        updateMetrics({
          securityScore: Math.max(0, Math.min(100, metrics.securityScore + (consequences.securityScore || 0))),
          threatLevel: Math.max(0, metrics.threatLevel + (consequences.threatLevel || 0)),
          systemUptime: Math.max(0, Math.min(100, metrics.systemUptime + (consequences.systemUptime || 0))),
        });
      }
      if (nextAlert) {
        generateResponseOptions(nextAlert.description);
      }
    } catch (error) {
      console.error('Failed to generate simulation response:', error);
      setErrorMessage('Failed to generate simulation response. Please try again.');
    } finally {
      setIsResponseLoading(false);
    }
  };

  const assessSimulationOutcome = async () => {
    try {
      const userStrategyEffectiveness = logs.reduce((acc, log) => {
        return log.message.includes('User action') ? acc + 1 : acc;
      }, 0);
      const totalMessages = logs.length;
      const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 100;
      const outcome = effectivenessScore > 50 ? 'Win' : 'Lose';
      return {
        outcome: outcome,
        reason:
          outcome === 'Win'
            ? 'The user effectively managed the threats.'
            : 'The user could have been more effective in handling the threats.',
      };
    } catch (error) {
      console.error('Failed to assess simulation outcome', error);
      return { outcome: 'draw', reason: 'Failed to assess the outcome. Try again.' };
    }
  };

  const analyzeSimulation = async () => {
    const analysisPrompt = String.raw`
      Analyze the following simulation transcript and provide an in-depth analysis of the user's performance based on their responses.
      Evaluate the user’s performance on key decision-making tactics and provide a score (1-10) for each tactic with 2-3 examples.
      Provide an overall summary that includes actionable recommendations.
      Return the result in JSON format with keys in Sentence Case:
      {
          "Summary": "string",
          "Tactics": {
               "Problem Solving": { "score": "number", "examples": ["string"], "recommendations": ["string"] },
               "Decision Making": { "score": "number", "examples": ["string"], "recommendations": ["string"] },
               "Adaptability": { "score": "number", "examples": ["string"], "recommendations": ["string"] },
               "Strategic Thinking": { "score": "number", "examples": ["string"], "recommendations": ["string"] },
               "Technical Knowledge": { "score": "number", "examples": ["string"], "recommendations": ["string"] }
          }
      }
      The simulation transcript:
      ${JSON.stringify(logs, null, 2)}
    `;
    try {
      const rawAnalysisResponse = await fetchOpenAIResponse(
        { messages: [{ role: 'system', content: analysisPrompt }] },
        '/api/generate'
      );
      const parsedAnalysis = parseAiJson(rawAnalysisResponse);
      if (parsedAnalysis) {
        const sentenceCaseKeys = (obj) => {
          if (typeof obj !== 'object' || obj === null) return obj;
          if (Array.isArray(obj)) return obj.map(sentenceCaseKeys);
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
        setErrorMessage('Failed to analyze simulation. Please try again.');
        return null;
      }
    } catch (error) {
      setErrorMessage('Failed to analyze simulation. Please try again.');
      console.error('Error analyzing simulation:', error);
      return null;
    }
  };

  const finalizeSimulation = async () => {
    const outcomeData = await assessSimulationOutcome();
    const analysisData = await analyzeSimulation();
    const userStrategyEffectiveness = logs.reduce((acc, log) => {
      return log.message.includes('User action') ? acc + 1 : acc;
    }, 0);
    const totalMessages = logs.length;
    const effectivenessScore = (userStrategyEffectiveness / totalMessages) * 100;
    if (analysisData && outcomeData) {
      setDebriefing((prev) => ({
        ...prev,
        strengths:
          analysisData.Tactics &&
          Object.entries(analysisData.Tactics)
            .filter(([, value]) => value.score > 7)
            .map(([key]) => key),
        areasForImprovement:
          analysisData.Tactics &&
          Object.entries(analysisData.Tactics)
            .filter(([, value]) => value.score < 6)
            .map(([key]) => key),
        overallScore: Math.round(effectivenessScore),
        letterGrade: effectivenessScore > 85 ? 'A' : effectivenessScore > 70 ? 'B' : effectivenessScore > 50 ? 'C' : 'D',
        advice:
          outcomeData.outcome === 'Win'
            ? 'Continue refining your cybersecurity strategies.'
            : 'Consider a different approach for improved threat mitigation.',
        transcript: logs,
        outcome: outcomeData.outcome,
        outcomeReason: outcomeData.reason,
        summary: analysisData.Summary,
        tactics: analysisData.Tactics,
      }));
    } else {
      setErrorMessage('Failed to generate a proper summary. Please try again.');
      setDebriefing(null);
    }
    setSimulationComplete(true);
    setActivePhase('debriefing');
  };

  const resetSimulation = () => {
    setScenario(null);
    setEditableScenario(null);
    setAlerts([]);
    setSelectedAlert(null);
    setProgress(0);
    setSimulationComplete(false);
    setDebriefing(null);
    setErrorMessage('');
    setTimeLeft(300);
    setNotifications([]);
    setResponseOptions([]);
    setSimulationStarted(false);
    setSystemStatus({ networkHealth: 100, serverLoad: 0, intrusionAttempts: 0 });
    setMetrics({ securityScore: 100, threatLevel: 0, systemUptime: 100, timeElapsed: 0 });
    setMetricHistory([]);
    setLogs([]);
    setRadarData(null);
    setShowFeedback(false);
    setIsScenarioEditable(false);
    setActivePhase('setup');
    setTimeElapsed(0);
  };

  // ============================================================
  // LAYOUT RENDERING FUNCTIONS
  // ============================================================
  // Row 1: Title Bar
  const renderTitleBar = () => (
    <Grid item xs={12}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" color="primary">
          {metadata.title}
        </Typography>
        <IconButton onClick={() => setDropdownVisible(!dropdownVisible)}>
          <MenuIcon sx={{ color: '#eee' }} />
        </IconButton>
        {dropdownVisible && (
          <Box
            sx={{
              position: 'absolute',
              right: 16,
              top: 56,
              bgcolor: '#333',
              p: 1,
              borderRadius: 1,
            }}
          >
            <Button onClick={onReturn} fullWidth>
              Return to Module Library
            </Button>
            {modules.map((module, index) => (
              <Button key={index} onClick={() => onSelectModule(module.title)} fullWidth>
                {module.title}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </Grid>
  );

  // Row 2: Module Illustration & Setup Options / Scenario Description
  const renderSetupRow = () => (
    <Grid item xs={12}>
      <Grid container spacing={2} alignItems="stretch">
        {/* Left Column (Module Image) */}
        <Grid item xs={12} md={4}>
          {renderModuleIllustrationCard()}
        </Grid>
        {/* Right Column (Scenario Context or Setup Form) */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              {/* Conditionally render either Scenario Overview or Setup Form */}
              {!scenario ? ( // If scenario is null, show setup form
                <Box>
                  <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }}>
                    Setup Your Simulation
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: '#eee' }}>Role</InputLabel>
                    <Select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      sx={{ color: '#eee', bgcolor: '#333' }}
                    >
                      <MenuItem value="">
                        <em>Choose a role</em>
                      </MenuItem>
                      {roles.map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                          {r.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: '#eee' }}>Difficulty Level</InputLabel>
                    <Select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      sx={{ color: '#eee', bgcolor: '#333' }}
                    >
                      <MenuItem value="">
                        <em>Choose difficulty</em>
                      </MenuItem>
                      {difficultyLevels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          {level.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={generateScenario} fullWidth sx={{ mb: 1 }}>
                    {isFetching ? 'Generating Scenario...' : 'Generate Scenario'}
                  </Button>
                </Box>
              ) : ( // If scenario exists, show overview
                <>
                  {/* "CYBERSECURITY CHALLENGE" Title Bar */}
                  <Typography variant="h5" color="primary" sx={{ textAlign: 'right' }}>CYBERSECURITY CHALLENGE</Typography>
                  {/* "SCENARIO OVERVIEW" Sub-heading */}
                  <Typography variant="subtitle1" sx={{ textAlign: 'right' }}>SCENARIO OVERVIEW</Typography>
                  {/* Scenario Text Area */}
                  <Box sx={{ my: 2 }}>
                    <Typography variant="body1" className="scenario-description">
                      {scenario.context}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );

  // Row 2 Left Column - Expanded Scenario Details
  const renderExpandedScenarioDetailsRow = () => (
    <Grid item xs={12} md={6}> {/* md value set to 6 for half width */}
      <Card sx={{ height: '100%' }}>
        <CardContent>
          {/* "User Tactics Radar" Title */}
          <Typography variant="subtitle1">User Tactics Radar</Typography>
          {/* Data Visualization (Chart Area) - Metrics Chart moved here */}
          <Box sx={{ my: 2, height: 250 }}>
            {renderMetricsChartCard()} {/* Metrics Chart is now here */}
          </Box>
          {/* System Status Card - Summary in Left Column */}
          {renderSystemStatusCard()} {/* Keep System Status Card here for summary */}
        </CardContent>
      </Card>
    </Grid>
  );

  // Row 3: Detailed System Status Monitoring
  const renderDetailedSystemStatusRow = () => ( // Renamed and adjusted for Row 3
    <Grid item xs={12}>
      <Card>
        <CardContent>
          {/* "SYSTEM STATUS" Title */}
          <Typography variant="h6" color="primary">SYSTEM STATUS</Typography>
          {/* System Icons with Labels Placeholder */}
          <Box sx={{ height: 80, bgcolor: 'grey.100', my: 2 }} /> {/* Placeholder Icons */}
          {/* Detailed Metrics (Bar Graphs) Placeholder */}
          <Box sx={{ height: 60, bgcolor: 'grey.200', my: 2 }} /> {/* Placeholder Metrics */}
          {/* Detailed View Area (Small Screen) Placeholder */}
          <Box sx={{ height: 40, bgcolor: 'grey.300', my: 1 }} /> {/* Placeholder Detailed View */}
        </CardContent>
      </Card>
    </Grid>
  );


  const renderSystemStatusCard = () => (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="System Status" />
      <CardContent>
        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center">
            <Typography>Time Elapsed:</Typography>
            <Typography sx={{ ml: 1 }}>{timeElapsed} sec</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Typography>Network Health:</Typography>
            <Progress value={networkHealth} max={100} sx={{ flexGrow: 1, ml: 1 }} />
          </Box>
          <Box display="flex" alignItems="center">
            <Typography>Server Load:</Typography>
            <Progress value={serverLoad} max={100} sx={{ flexGrow: 1, ml: 1 }} />
          </Box>
          <Box display="flex" alignItems="center">
            <Typography>Intrusions:</Typography>
            <Typography sx={{ ml: 1 }}>{intrusionAttempts}</Typography>
          </Box>
          <Box mt={1}>
            <Progress value={progress} />
            <Typography>{progress}% Complete</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderMetricsChartCard = () => (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Real-time Impact" />
      <CardContent>
        {metricHistory.length === 0 ? (
          <Typography>No metric data available yet.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metricHistory}>
              <defs>
                <linearGradient id="securityScoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007bff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#007bff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="time" stroke="#eee" />
              <YAxis stroke="#eee" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="securityScore" stroke="#007bff" fill="url(#securityScoreGradient)" name="Security Score" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderResponseAndFeedbackCard = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* "FEEDBACK & LOGS" - Moved to be ABOVE Response Options */}
        <Box sx={{ height: 300, mb: 2 }}> {/* Added mb for spacing below Logs */}
          <Typography variant="subtitle1">FEEDBACK & LOGS</Typography>
          {/* Notifications Area */}
          <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="primary">Notifications</Typography>
            {/* ... Notifications List ... */}
            {notifications.length > 0 ? (
              <List dense>
                {notifications.map((note, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemText primary={note.message} secondary={note.timestamp.toLocaleTimeString()} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">No new notifications.</Typography>
            )}
          </Box>
          {/* Feedback & Logs content - Chat History */}
          <CardContent className="chat-history-container" ref={chatHistoryContainerRef} style={{ height: '150px', overflowY: 'auto', padding: 0 }}>
            <div className="chat-history">
              {logs.map((log, index) => ( // Using 'logs' state for chat history
                <div key={index} className={`chat-message opponent`}> {/* Basic 'opponent' style for now */}
                  <div>
                    <strong className="sender-name">System Update:</strong> {/* Adjust sender name */}
                  </div>
                  <div>
                    <strong className="message-timestamp">Time:</strong> {log.timestamp.toLocaleTimeString()}
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(log.message) }} />
                </div>
              ))}
              <div ref={logsEndRef} /> {/* Ref to scroll to end */}
            </div>
            {isSystemMessageLoading && ( // Using isSystemMessageLoading for spinner
              <div className="spinner-container">
                <BeatLoader color="#007bff" size={8} />
              </div>
            )}
          </CardContent>
        </Box>
        {/* "RESPONSE OPTIONS" - Moved BELOW Feedback & Logs */}
        <Box sx={{ mb: 2 }}> {/* Kept mb for spacing */}
          <Typography variant="subtitle1">RESPONSE OPTIONS</Typography>
          {/* Response Options Buttons */}
          <Box sx={{ mt: 2 }}> {/* Kept mt for spacing */}
            {selectedAlert &&
              responseOptions.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleResolution(index)}
                  disabled={isResponseLoading}
                  fullWidth
                  variant="contained"
                  sx={{ my: 1 }}
                >
                  {option.name} - {option.description}
                </Button>
              ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderScenarioOverviewCard = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* "CYBERSECURITY CHALLENGE" Title Bar - Right-justified */}
        <Typography variant="h5" color="primary" sx={{ textAlign: 'right' }}>CYBERSECURITY CHALLENGE</Typography>
        {/* "SCENARIO OVERVIEW" Sub-heading - Right-justified */}
        <Typography variant="subtitle1" sx={{ textAlign: 'right' }}>SCENARIO OVERVIEW</Typography>
        {/* Scenario Text Area */}
        <Box sx={{ my: 2 }}>
          {scenario && (
            <Typography variant="body1" className="scenario-description">
              {scenario.context}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderModuleIllustrationCard = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {/* Flex container for centering */}
        <CardMedia
          component="img"
          image={metadata.imageUrl}
          alt="Module Illustration"
          sx={{ objectFit: 'contain', height: 200, width: 'auto', mb: 1 }} // Adjusted height, width, and margin-bottom
        />
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}> {/* Flexbox for button alignment */}
          <Button variant="contained" onClick={() => setShowInstructions((prev) => !prev)}>
            Show Instructions
          </Button>
        </Box>
        {showInstructions && (
          <Box mt={2} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(metadata.instructions) }} />
        )}
      </CardContent>
    </Card>
  );

  // Main Layout Structure
  return (
    <ThemeProvider theme={moduleTheme}>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {renderTitleBar()}
          {activePhase === 'setup' && renderSetupRow()}
          {activePhase === 'simulation' && (
            <>
              {renderExpandedScenarioDetailsRow()}
              <Grid item xs={12} md={6}>
                {renderResponseAndFeedbackCard()}
              </Grid>
              {renderDetailedSystemStatusRow()}
            </>
          )}
          {activePhase === 'debriefing' && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Debriefing" />
                <CardContent>
                  {debriefing ? (
                    <>
                      <Typography variant="h6">Summary</Typography>
                      <Typography>{debriefing.summary}</Typography>

                      <Typography variant="h6" mt={2}>
                        Tactics
                      </Typography>
                      {debriefing.tactics &&
                        Object.entries(debriefing.tactics).map(([tacticName, tacticDetails]) => (
                          <Box key={tacticName} mt={1}>
                            <Typography variant="subtitle1">{tacticName}</Typography>
                            <Typography>Score: {tacticDetails.score}</Typography>
                            <Typography>Examples:</Typography>
                            <List dense>
                              {tacticDetails.examples.map((example, index) => (
                                <ListItem key={index}>
                                  <ListItemText primary={example} />
                                </ListItem>
                              ))}
                            </List>
                            <Typography>Recommendations:</Typography>
                            <List dense>
                              {tacticDetails.recommendations.map((rec, index) => (
                                <ListItem key={index}>
                                  <ListItemText primary={rec} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        ))}


                      <Typography variant="h6" mt={2}>
                        Strengths
                      </Typography>
                      <List>
                        {debriefing.strengths &&
                          debriefing.strengths.map((strength, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={strength} />
                            </ListItem>
                          ))}
                      </List>

                      <Typography variant="h6" mt={2}>
                        Areas for Improvement
                      </Typography>
                      <List>
                        {debriefing.areasForImprovement &&
                          debriefing.areasForImprovement.map((area, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={area} />
                            </ListItem>
                          ))}
                      </List>

                      <Typography variant="h6" mt={2}>
                        Overall Score: {debriefing.overallScore}
                      </Typography>
                      <Typography variant="h6">Grade: {debriefing.letterGrade}</Typography>
                      <Typography variant="h6">Advice: {debriefing.advice}</Typography>

                      <Typography variant="h6" mt={2}>
                        Transcript
                      </Typography>
                      <Box sx={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', p: 1 }}>
                        {debriefing.transcript && debriefing.transcript.map((log, index) => (
                          <Typography key={index} variant="body2">
                            {log.timestamp.toLocaleTimeString()}: {log.message}
                          </Typography>
                        ))}
                      </Box>


                      <Typography variant="h6" mt={2}>
                        Outcome: {debriefing.outcome}
                      </Typography>
                      <Typography>Reason: {debriefing.outcomeReason}</Typography>
                    </>
                  ) : (
                    <Typography>Loading debriefing...</Typography>
                  )}
                  <Box mt={2}>
                    <Button variant="contained" onClick={resetSimulation} fullWidth>
                      Reset Simulation
                    </Button>
                    <Button onClick={finalizeSimulation} fullWidth disabled={progress < 100} variant="contained" sx={{ mt: 2 }}>
                      {progress < 100 ? `Complete Simulation (${progress}%)` : "View Debrief"}
                    </Button>
                    <Button variant="contained" color="secondary" onClick={startSimulation} fullWidth sx={{ mt: 1 }}>
                      Start Simulation
                    </Button>
                  </Box>

                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <Grid item xs={12}>
              <Typography color="error">{errorMessage}</Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </ThemeProvider>
  );
};  //Closing bracket for CybersecurityModule Component


// Metadata for the module
export const metadata = {
  title: 'Cybersecurity Challenge',
  description:
    'Engage in a realistic cybersecurity incident response simulation. Make critical decisions to defend against threats and protect your organization.',
  imageUrl: '../images/CybersecurityModule.png',
  instructions: `
    <h2>Gameplay Overview</h2>
    <p>Welcome to the Cybersecurity Challenge module. Here, you will step into the role of a cybersecurity professional and navigate a dynamic incident response simulation. Your objective is to effectively manage and mitigate cybersecurity threats to protect your organization's digital assets.</p>
    <h3>Simulation Mechanism</h3>
    <ol>
        <li><strong>Prioritize Alerts:</strong> Review active security alerts and prioritize them based on severity and potential impact.</li>
        <li><strong>Select Responses:</strong> Choose appropriate response options from a range of strategic actions to counter each threat.</li>
        <li><strong>Manage System Status:</strong> Monitor key system metrics such as network health, server load, and intrusion attempts, which are dynamically affected by your decisions and the unfolding scenario.</li>
    </ol>
    <h3>Key Skills Assessed</h3>
    <ul>
        <li><strong>Threat Prioritization:</strong> Evaluate and prioritize security alerts to focus on the most critical issues.</li>
        <li><strong>Incident Response:</strong> Select and implement effective response strategies to mitigate cyber threats.</li>
        <li><strong>Resource Management:</strong> Manage system resources and balance security measures with operational impact.</li>
        <li><strong>Strategic Decision-Making:</strong> Make informed decisions under pressure, considering both immediate and long-term consequences.</li>
        <li><strong>Adaptability and Learning:</strong> Adjust your strategies based on the evolving nature of threats and feedback from the simulation.</li>
    </ul>
    <h3>Outcome and Debriefing</h3>
    <p>Upon completing the simulation, you will receive a comprehensive debriefing that includes a performance summary, identification of strengths and areas for improvement, tactical scorecard, overall score and grade, personalized advice, and a full transcript of your simulation actions.</p>
  `,
  component: CybersecurityModule,
};

export default CybersecurityModule;