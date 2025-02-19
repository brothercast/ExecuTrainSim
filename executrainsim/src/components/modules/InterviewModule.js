// src/components/modules/InterviewModule.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import Select, { SelectItem } from '../ui/Select';
import { BarLoader } from 'react-spinners';
import { User, Briefcase, Mic, StopCircle, CheckSquare, Square } from 'lucide-react';
import '../../styles/AppStyles.css';
import '../../styles/InterviewModule.css';
import DOMPurify from 'dompurify';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');
const constructEndpoint = (baseURL, path) => `${baseURL}${path}`;

const parseAiJson = (apiResponse) => {
    if (!apiResponse) {
        console.error('parseAiJson: No response data to parse.');
        return null;
    }
    if (typeof apiResponse === 'string') {
        const cleaned = apiResponse.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
        try {
            return JSON.parse(cleaned);
        } catch (parseError) {
            console.error('parseAiJson: Failed to parse cleaned string as JSON:', parseError);
            console.log('parseAiJson: Raw cleaned content:', cleaned);
            return cleaned;
        }
    }
    if (apiResponse.choices && Array.isArray(apiResponse.choices) && apiResponse.choices.length > 0 && apiResponse.choices[0].message && apiResponse.choices[0].message.content) {
        const messageContent = apiResponse.choices[0].message.content;
        if (typeof messageContent === 'string') {
            const cleaned = messageContent.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
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

const InterviewModule = ({ onReturn }) => {
    const [resume, setResume] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [jobCategory, setJobCategory] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [customJobDescription, setCustomJobDescription] = useState('');
    const [isCustomJobDescription, setIsCustomJobDescription] = useState(false);
    const [useResume, setUseResume] = useState(true);
    const [interviewer, setInterviewer] = useState(null);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [chatLog, setChatLog] = useState([]);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAITurn, setIsAITurn] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
    const [interviewComplete, setInterviewComplete] = useState(false);
    const [debriefing, setDebriefing] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState('alloy');

    const chatLogEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const jobCategories = [
        { value: 'software_engineering', label: 'Software Engineering' },
        { value: 'product_management', label: 'Product Management' },
        { value: 'data_science', label: 'Data Science' },
        { value: 'sales', label: 'Sales' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'custom', label: 'Custom' },
    ];

    const jobTitles = {
        software_engineering: ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer'],
        product_management: ['Product Manager', 'Associate Product Manager', 'Technical Product Manager'],
        data_science: ['Data Scientist', 'Machine Learning Engineer', 'Data Analyst'],
        sales: ['Account Executive', 'Sales Development Representative', 'Sales Manager'],
        marketing: ['Marketing Manager', 'Digital Marketing Specialist', 'Content Marketing Specialist'],
    };

    const scrollToBottom = () => {
        chatLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

   const addLog = (message, sender, expression = 'neutral') => {
      const sanitizedMessage = DOMPurify.sanitize(message);
      setChatLog(prev => [...prev, { message: sanitizedMessage, timestamp: new Date(), sender, expression }]);
    };

    const fetchOpenAIResponse = async (payload, endpointPath) => {
        setIsFetching(true);
        try {
            const endpoint = constructEndpoint(API_BASE_URL, endpointPath);
            console.log('Requesting:', endpoint, 'with payload:', JSON.stringify(payload));
            const response = await axios.post(endpoint, payload, {
                headers: { 'Content-Type': 'application/json' },
            });
            console.log('Response received:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching from OpenAI:', error.message);
            if (error.response) {
                console.error('API Error Details:', error.response.data);
            }
            setErrorMessage('Failed to communicate with the server.');
            return null;
        } finally {
            setIsFetching(false);
        }
    };

    const generateInterviewerImage = async (name, title) => {
        const prompt = `A single, wide image divided into nine equal square sections, arranged in a 3x3 grid. Each section contains a close-up portrait of the SAME professional woman, from the shoulders up, against a plain light gray background. She is wearing a blue business suit and a white shirt. She has dark, shoulder-length, straight hair and brown eyes.  Each section shows a DIFFERENT FACIAL EXPRESSION:

        Top Row (Left to Right):
          1. Neutral expression (relaxed, professional)
          2. Slightly smiling (friendly, approachable)
          3.  Open-mouthed surprised expression (eyes wide, eyebrows raised)

        Middle Row (Left to Right):
          4. Thoughtful expression (looking slightly upward, furrowed brow)
          5. Concerned expression (eyebrows drawn together, slight frown)
          6. Skeptical expression (one eyebrow raised, slight smirk)

        Bottom Row (Left to Right):
          7. Slightly angry expression (furrowed brow, narrowed eyes, lips pressed together – but NOT overly dramatic; maintain professionalism)
          8. Approving expression (nodding slightly, small smile, raised eyebrows)
          9. Listening intently expression (head tilted slightly, eyes focused, slight smile)

        Style:  Photorealistic, like a professional headshot.  High quality lighting.  No text or labels within the image.  The woman should look like the same person in all nine sections, only the expression changes.`;

        try {
            const endpoint = constructEndpoint(API_BASE_URL, '/api/dalle/image');
            const response = await axios.post(endpoint, { prompt });

            if (response.data && response.data.imagePath) {
                setInterviewer(prev => ({ ...prev, image: response.data.imagePath }));
            } else {
                setErrorMessage('Failed to generate interviewer image.');
            }
        } catch (error) {
            console.error('Error generating interviewer image:', error);
            setErrorMessage('An error occurred while generating the interviewer image.');
        }
    };

const generateInterviewer = async () => {
        setIsGeneratingScenario(true);
        setErrorMessage('');

        let finalJobDescription = '';

        if (isCustomJobDescription) {
            if (!customJobDescription.trim()) {
                setErrorMessage('Please provide a custom job description.');
                setIsGeneratingScenario(false);
                return;
            }
            finalJobDescription = customJobDescription;
        } else {
            if (!jobCategory || !jobTitle) {
              setErrorMessage('Please select a job category and title.');
              setIsGeneratingScenario(false);
              return;
            }
            try {
                const jdPrompt = `Generate a detailed job description for the position of ${jobTitle} in the field of ${jobCategories.find(c => c.value === jobCategory)?.label}. Include responsibilities, required skills, and preferred qualifications. Return as plain text.`;
                const jdResponse = await fetchOpenAIResponse({ messages: [{ role: 'system', content: jdPrompt }] }, '/api/generate');

                finalJobDescription = parseAiJson(jdResponse);
                if (!finalJobDescription || typeof finalJobDescription !== 'string')
                {
                    throw new Error("Failed to Generate a valid Job Description");
                }
                setJobDescription(finalJobDescription);
            } catch (error) {
                setErrorMessage('Failed to generate job description.');
                setIsGeneratingScenario(false);
                return;
            }
        }

      const resumeText = useResume ? resume : 'No resume provided.';

      const prompt = `
          Create a virtual interviewer persona for a job interview.  The job description is:

          ${finalJobDescription}

          ${useResume ? `The candidate's resume is:\n${resumeText}` : ''}

          Generate an interviewer with:
          - A realistic name.
          - A job title relevant to the position.
          - A brief personality description.

          Return in JSON format:
          {
              "interviewer": {
                  "name": "string",
                  "title": "string",
                  "personality": "string",
                  "introduction": "string"
              }
          }
      `;

        try {
            const rawResponse = await fetchOpenAIResponse({ messages: [{ role: 'system', content: prompt }] }, '/api/generate');
            const parsedResponse = parseAiJson(rawResponse);

            if (parsedResponse?.interviewer) {
                setInterviewer(parsedResponse.interviewer);
                addLog(parsedResponse.interviewer.introduction, parsedResponse.interviewer.name);
                await generateInterviewerImage(parsedResponse.interviewer.name, parsedResponse.interviewer.title);
            } else {
                setErrorMessage('Failed to generate interviewer.');
            }
        } catch (error) {
            setErrorMessage('An error occurred while generating the interviewer.');
        } finally {
            setIsGeneratingScenario(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    sendAudioChunk();
                }
            };

            mediaRecorderRef.current.onstop = async () => {
              setIsUserSpeaking(false);
              const stream = mediaRecorderRef.current.stream
              if(stream)
              {
                stream.getTracks().forEach(track => track.stop());
              }
                mediaRecorderRef.current = null;
            };

            mediaRecorderRef.current.start(2000);
            setIsUserSpeaking(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            setErrorMessage('Failed to start recording.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const sendAudioChunk = async () => {
        if (audioChunksRef.current.length === 0) {
            return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64Audio = await blobToBase64(audioBlob);
        audioChunksRef.current = [];

        try {
            const conversationItemCreate = {
                type: "conversation.item.create",
                item: {
                    type: "message",
                    role: "user",
                    content: [
                        {
                            type: "input_audio",
                            audio: base64Audio,
                        },
                    ],
                },
            };
            await fetchOpenAIResponse(conversationItemCreate, "/api/realtime");

        } catch (error) {
            console.error("Error sending audio chunk:", error);
            setErrorMessage("Failed to send audio chunk.");
        }
    };

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const generateAIResponse = async () => {
      if (!interviewer) {
        console.error('Interviewer not generated.');
        return;
      }

      const prompt = `
          You are ${interviewer.name}, ${interviewer.title}, conducting a job interview. Your personality is: ${interviewer.personality}.

          The job description is:
          ${jobDescription}

          ${useResume ? `The candidate's resume is:\n${resume}` : ''}

          Respond naturally, as in a real interview. Ask follow-up questions and assess the candidate's suitability.
      `;

      const responseCreate = {
        type: 'response.create',
        response: {
          modalities: ['audio', 'text'],
          instructions: prompt,
          voice: selectedVoice,
        },
      };

      try {
        const aiResponse = await fetchOpenAIResponse(responseCreate, '/api/realtime');
        if (aiResponse && aiResponse.messages) {
          for (const message of aiResponse.messages) {
            if (message.type === 'response.text.delta') {
              addLog(message.delta, interviewer.name, message.expression || 'neutral');
            } else if (message.type === 'response.audio.delta') {
              console.log('Received audio chunk:', message.delta.length, 'bytes');
            } else if (message.type === 'response.audio_transcript.delta') {
              console.log('AI Audio Transcript Delta:', message.delta);
            }
            else if(message.type === "response.done")
            {
              const finalAIMessage = aiResponse.messages.find(msg => msg.type === "response.text.done");
                if(finalAIMessage)
                {
                    console.log("AI Final Text Message:", finalAIMessage.text);
                }
            }
          }
        } else {
          setErrorMessage('Failed to get a valid AI response.');
        }
      } catch (error) {
        console.error('Error during real-time interaction:', error);
        setErrorMessage('Real-time interaction failed.');
      } finally {
        setIsAITurn(false);
      }
    };

    const startInterview = async () => {
        setInterviewStarted(true);
    };

    const resetInterview = () => {
        setResume('');
        setJobDescription('');
        setInterviewer(null);
        setInterviewStarted(false);
        setChatLog([]);
        setIsUserSpeaking(false);
        setIsAITurn(false);
        setErrorMessage('');
        setIsFetching(false);
        setInterviewComplete(false);
        setDebriefing(null);
        setSelectedVoice('alloy');
        setJobCategory('');
        setJobTitle('');
        setCustomJobDescription('');
        setIsCustomJobDescription(false);
        setUseResume(true);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const renderLeftColumn = () => (
        <Card className="details-card">
            <CardContent>
                {!interviewStarted ? (
                    <>
                        <img
                            src="../images/InterviewModule.png"
                            alt="Interview Module Illustration"
                            className="scenario-image"
                        />
                        <div className="module-description">
                            <h2>Interview Simulator</h2>
                            <p>
                                Practice your interview skills.
                            </p>
                        </div>
                    </>
                ) : (
                    interviewer && (
                        <div>
                            <h3>Interviewer:</h3>
                            <p><strong>Name:</strong> {interviewer.name}</p>
                            <p><strong>Title:</strong> {interviewer.title}</p>
                            <p><strong>Personality:</strong> {interviewer.personality}</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );

    const renderSetupForm = () => (
      <Card className='setup-card'>
        <CardHeader>
          <CardTitle>Set Up Your Interview</CardTitle>
          <div className="spinner-container">
            {isGeneratingScenario && <BarLoader color="#0073e6" width="100%" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="form-group">
            <label>Select Job Category:</label>
            <Select
              onValueChange={(value) => {
                setJobCategory(value);
                setJobTitle('');
                setIsCustomJobDescription(value === 'custom');
              }}
              value={jobCategory}
            >
              <SelectItem value="">Choose a category</SelectItem>
              {jobCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {!isCustomJobDescription && jobCategory && (
            <div className="form-group">
              <label>Select Job Title:</label>
              <Select
                onValueChange={setJobTitle}
                value={jobTitle}
                disabled={!jobCategory}
              >
                <SelectItem value="">Choose a title</SelectItem>
                {jobTitles[jobCategory]?.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}

          {isCustomJobDescription && (
            <div className="form-group">
              <label htmlFor="customJobDescription">Custom Job Description:</label>
              <TextArea
                id="customJobDescription"
                value={customJobDescription}
                onValueChange={setCustomJobDescription}
                placeholder="Paste a custom job description here..."
                className='custom-scenario-input'
              />
            </div>
          )}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useResume}
                  onChange={() => setUseResume(!useResume)}
                />
                Include Resume
              </label>
            </div>
          {useResume && (
            <div className="form-group">
              <label htmlFor="resume">Your Resume/CV:</label>
              <TextArea
                id="resume"
                value={resume}
                onValueChange={setResume}
                placeholder="Paste your resume here..."
                className='custom-scenario-input'
              />
            </div>
          )}

          <div className="form-group">
            <label>Select Interviewer Voice:</label>
            <Select onValueChange={setSelectedVoice} value={selectedVoice}>
              <SelectItem value="alloy">Alloy</SelectItem>
              <SelectItem value="ash">Ash</SelectItem>
              <SelectItem value="ballad">Ballad</SelectItem>
              <SelectItem value="coral">Coral</SelectItem>
              <SelectItem value="echo">Echo</SelectItem>
              <SelectItem value="sage">Sage</SelectItem>
              <SelectItem value="shimmer">Shimmer</SelectItem>
              <SelectItem value="verse">Verse</SelectItem>
            </Select>
          </div>
          <Button onClick={generateInterviewer} disabled={isGeneratingScenario}>
            {isGeneratingScenario ? 'Generating Interviewer...' : 'Generate Interviewer'}
          </Button>
          {interviewer && (
            <Button onClick={startInterview} disabled={isFetching}>
              {isFetching ? 'Starting...' : 'Start Interview'}
            </Button>
          )}
        </CardContent>
      </Card>
    );

    const renderChatArea = () => (
        <Card className="chat-card">
            <CardHeader>
                <CardTitle>Interview Chat</CardTitle>
            </CardHeader>
            <CardContent className="chat-history-container">
                <div className="chat-history">
                    {chatLog.map((entry, index) => (
                        <div
                            key={index}
                            className={`chat-message ${entry.sender === 'user' ? 'user' : 'interviewer'}`}
                        >
                            {entry.sender !== 'user' && interviewer?.image && (
                                <div className="interviewer-expression-image-container">
                                    <img
                                        src={interviewer.image}
                                        alt={`Interviewer Expression: ${entry.expression}`}
                                        className={`interviewer-expression-image expression-${entry.expression}`}
                                    />
                                </div>
                            )}
                            <strong>
                                {entry.sender === 'user' ? 'You' : entry.sender}:
                            </strong>
                            <div dangerouslySetInnerHTML={{ __html: entry.message }} />
                            <span className="message-timestamp">
                                {entry.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    <div ref={chatLogEndRef} />
                </div>
                <div className="user-input-container">
                    <Button
                        onClick={isUserSpeaking ? stopRecording : startRecording}
                        className={`microphone-button ${isUserSpeaking ? 'recording' : ''}`}
                        disabled={!interviewStarted || isAITurn}
                    >
                        {isUserSpeaking ? <StopCircle color="red" size={24} /> : <Mic size={24} />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderMainContent = () => {
        if (!interviewStarted) {
            return renderSetupForm();
        } else if (interviewComplete) {
            return renderDebriefing();
        } else {
            return (
                <>
                    <div className="interviewer-container">
                        {interviewer && interviewer.image && (
                            <div className="interviewer-expression-image-container">
                                <img
                                    src={interviewer.image}
                                    alt={`Interviewer: ${interviewer.name}`}
                                    className={`interviewer-expression-image expression-neutral`}
                                />
                            </div>
                        )}
                    </div>
                    {renderChatArea()}
                </>
            );
        }
    };

    const renderDebriefing = () => {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Interview Debriefing</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Debriefing content goes here.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-box">
                    <span className="header-title">{metadata.title}</span>
                </div>
            </header>
            <main className="content-grid">
                <aside className="left-column">{renderLeftColumn()}</aside>
                <section className="main-content">
                    <div className="main-content-flex">
                        {errorMessage && (
                            <div className="error-box">
                                <h4 className='error-title'>Error</h4>
                                <p>{errorMessage}</p>
                            </div>
                        )}
                        {renderMainContent()}
                    </div>
                </section>
            </main>
        </div>
    );
};

export const metadata = {
    title: 'Interview Simulator',
    description: 'Practice your interview skills with a virtual interviewer.',
    imageUrl: '../images/InterviewModule.png',
    component: InterviewModule,
    instructions: `
        <h2>Interview Simulator Instructions</h2>

        <p>Welcome to the Interview Simulator! This module provides a realistic, voice-activated interview experience.</p>

        <h3>Getting Started</h3>

        <ol>
            <li><strong>Provide Job Information:</strong>
                <ul>
                    <li>Select a <strong>Job Category</strong>.</li>
                    <li>Select a <strong>Job Title</strong>.</li>
                    <li><strong>Alternatively:</strong> Select "Custom" and paste a <strong>Custom Job Description</strong>.</li>
                </ul>
            </li>
            <li><strong>Resume (Optional):</strong>
                <ul>
                    <li>Uncheck "Include Resume" if you prefer not to use it.</li>
                    <li>If using, paste it into the "Your Resume/CV" area.</li>
                </ul>
            </li>
            <li><strong>Select Interviewer Voice (Optional):</strong>
                <ul>
                    <li>Choose a voice for the interviewer.</li>
                </ul>
            </li>
            <li><strong>Generate Interviewer:</strong> Click "Generate Interviewer".</li>
            <li><strong>Start Interview:</strong> Click "Start Interview".</li>
        </ol>

        <h3>During the Interview</h3>
        <ol>
            <li><strong>Speak Clearly:</strong> Click the microphone to start/stop recording.</li>
            <li><strong>Listen to the Interviewer:</strong> Responses are displayed in the chat log and spoken.</li>
            <li><strong>Real-time Interaction:</strong> The AI responds dynamically. Interaction is voice-based.</li>
        </ol>

        <h3>Ending the Interview</h3>
        <p>The interview continues until reset. A debriefing section will be added.</p>
        <h3>Tips for Success</h3>
        <ul>
            <li>Prepare as for a real interview.</li>
            <li>Think about common interview questions.</li>
            <li>Speak clearly and concisely.</li>
        </ul>
        <h3>Important Notes</h3>
        <ul>
            <li>Uses a real-time API (preview).</li>
            <li>Requires microphone access.</li>
            <li>For use in a trusted environment.</li>
            <li>Audio output depends on your system and configuration.</li>
        </ul>
    `,
};

export default InterviewModule;