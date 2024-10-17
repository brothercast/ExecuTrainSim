@echo off  
  
setlocal enabledelayedexpansion  
  
REM Function to prompt user input  
set PAUSE_MSG=Press any key to continue...  
set /p "= !PAUSE_MSG!" <nul  
  
REM Get the current directory  
set BASE_DIR=%cd%  
  
REM Log the base directory  
echo Base directory is: %BASE_DIR%  
  
REM Check if Node.js is installed  
echo Checking for Node.js installation...  
node -v >nul 2>&1  
if %errorlevel% neq 0 (  
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/ and try again.  
    set /p "= !PAUSE_MSG!" <nul  
    goto :end  
) else (  
    echo Node.js is installed.  
)  
  
REM Check if .env file exists and prompt for missing values  
set ENV_FILE="%BASE_DIR%\executrainserver\.env"  
echo Checking for .env file at: %ENV_FILE%  
if not exist %ENV_FILE% (  
    echo Creating .env file...  
    (  
        echo AZURE_OPENAI_API_KEY=  
        echo AZURE_OPENAI_ENDPOINT=  
        echo AZURE_DEPLOYMENT_NAME=gpt-4o-mini  
        echo AZURE_MODEL_NAME=gpt-4o-mini  
        echo GPT_PORT=5000  
        echo DALLE_PORT=5001  
    ) > %ENV_FILE%  
    echo .env file created.  
) else (  
    echo .env file already exists.  
)  
  
echo Checking .env file for Azure OpenAI credentials...  
for /f "tokens=1,2 delims==" %%a in (%ENV_FILE%) do (  
    if "%%a"=="AZURE_OPENAI_API_KEY" set AZURE_OPENAI_API_KEY=%%b  
    if "%%a"=="AZURE_OPENAI_ENDPOINT" set AZURE_OPENAI_ENDPOINT=%%b  
)  
  
if "%AZURE_OPENAI_API_KEY%"=="" (  
    set /p AZURE_OPENAI_API_KEY=Enter your Azure OpenAI API Key:   
    echo AZURE_OPENAI_API_KEY=%AZURE_OPENAI_API_KEY% >> %ENV_FILE%  
)  
  
if "%AZURE_OPENAI_ENDPOINT%"=="" (  
    set /p AZURE_OPENAI_ENDPOINT=Enter your Azure OpenAI Endpoint (US East2):   
    echo AZURE_OPENAI_ENDPOINT=%AZURE_OPENAI_ENDPOINT% >> %ENV_FILE%  
)  
  
REM Check and install dependencies for the server  
echo Checking server dependencies...  
cd "%BASE_DIR%\executrainserver" || (echo Failed to navigate to server directory && goto :end)  
if exist package.json (  
    npm install  
    if %errorlevel% neq 0 (  
        echo Failed to install server dependencies. Please check the errors above.  
        set /p "= !PAUSE_MSG!" <nul  
    ) else (  
        echo Server dependencies installed.  
        REM Start the server  
        start "" cmd /k "node server.js"  
    )  
) else (  
    echo No package.json found in server directory. Please ensure the directory is correct.  
    set /p "= !PAUSE_MSG!" <nul  
)  
  
REM Check and install dependencies for the client  
echo Checking client dependencies...  
cd "%BASE_DIR%\executrainsim" || (echo Failed to navigate to client directory && goto :end)  
if exist package.json (  
    npm install  
    if %errorlevel% neq 0 (  
        echo Failed to install client dependencies. Please check the errors above.  
        set /p "= !PAUSE_MSG!" <nul  
    ) else (  
        echo Client dependencies installed.  
        REM Start the client  
        start "" cmd /k "npm start"  
    )  
) else (  
    echo No package.json found in client directory. Please ensure the directory is correct.  
    set /p "= !PAUSE_MSG!" <nul  
)  
  
:end  
echo All processes attempted.  
set /p "= !PAUSE_MSG!" <nul  
exit /b  