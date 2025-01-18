require('dotenv').config();  
const { AzureOpenAI } = require('openai');  
  
console.log('Script started');  
  
// Define your credentials directly here  
const azureApiKey = '81da65068350462baabffa952bf68e7c';  // Replace with your actual API key  
const azureEndpoint = 'https://thinkmastereast.openai.azure.com';  
const azureAssistantAPIVersion = '2024-05-01-preview';  
  
// Check if all required environment variables are set  
if (!azureApiKey || !azureEndpoint || !azureAssistantAPIVersion) {  
  console.error('Missing required environment variables or credentials.');  
  process.exit(1);  
}  
  
console.log('All required environment variables are set.');  
  
const getClient = () => {  
  console.log('Initializing Azure OpenAI Client');  
  return new AzureOpenAI({  
    endpoint: azureEndpoint,  
    apiVersion: azureAssistantAPIVersion,  
    apiKey: azureApiKey,  
  });  
};  
  
const assistantsClient = getClient();  
  
const runAssistant = async () => {  
  try {  
    const assistantId = 'asst_cOZnqlx9UdiZWXtmnPtib5EO';  
  
    console.log('Creating a new thread');  
    const assistantThread = await assistantsClient.beta.threads.create({});  
    console.log(`Thread created with ID: ${assistantThread.id}`);  
  
    const role = 'user';  
    const message = 'Can you help me with my negotiation strategy?';  
    console.log(`Adding message to thread: ${message}`);  
    const threadResponse = await assistantsClient.beta.threads.messages.create(  
      assistantThread.id,  
      {  
        role,  
        content: message,  
      }  
    );  
    console.log(`Message added to thread: ${JSON.stringify(threadResponse)}`);  
  
    console.log('Starting the assistant run');  
    const runResponse = await assistantsClient.beta.threads.runs.create(  
      assistantThread.id,  
      { assistant_id: assistantId }  
    );  
    console.log(`Run started with ID: ${runResponse.id}`);  
  
    let runStatus = runResponse.status;  
    console.log(`Initial run status: ${runStatus}`);  
    while (runStatus === 'queued' || runStatus === 'in_progress') {  
      console.log('Polling for run status...');  
      await new Promise(resolve => setTimeout(resolve, 1000));  
      const runStatusResponse = await assistantsClient.beta.threads.runs.retrieve(  
        assistantThread.id,  
        runResponse.id  
      );  
      runStatus = runStatusResponse.status;  
      console.log(`Current run status: ${runStatus}`);  
    }  
  
    if (runStatus === 'completed') {  
      console.log('Run completed, fetching messages');  
      const messagesResponse = await assistantsClient.beta.threads.messages.list(  
        assistantThread.id  
      );  
      console.log(`Messages in the thread: ${JSON.stringify(messagesResponse)}`);  
    } else {  
      console.log(`Run status is ${runStatus}, unable to fetch messages.`);  
    }  
  } catch (error) {  
    console.error(`Error running the assistant: ${error.message}`);  
    if (error.response) {  
      console.error('Response data:', error.response.data);  
    }  
  }  
};  
  
runAssistant().then(() => console.log('Script finished')).catch(err => console.error('Script error:', err));  