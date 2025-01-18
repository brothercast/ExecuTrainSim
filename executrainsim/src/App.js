// App.js
import React, { useState } from 'react';
import './styles/AppStyles.css';
import ModuleCard from './components/ModuleCard';

// Dynamically import all module files from the modules directory
const moduleContext = require.context('./components/modules', false, /\.js$/);

// Extract metadata from each module with error handling
const modulesMetadata = moduleContext
    .keys()
    .map((modulePath) => {
        try {
            const module = moduleContext(modulePath);
            return module.metadata;
        } catch (error) {
            console.error(`Failed to load metadata from ${modulePath}:`, error);
            return null;
        }
    })
    .filter(Boolean); // Remove invalid entries

const App = () => {
    const [selectedModule, setSelectedModule] = useState(null);

    const handleCardClick = (module) => {
        setSelectedModule(() => () =>
            React.createElement(module.component, {
                onReturn: handleReturnToLibrary,
                role: 'defaultRole', // Ensure a role is always passed
                // Add any other required props here
            })
        );
    };

    const handleReturnToLibrary = () => {
        setSelectedModule(null);
    };

    return (
        <div className="app-container">
            <header className="app-header"
              style={
                  selectedModule
                  ?
                      {background: `linear-gradient(to right, var(--header-color), rgba(255,255,255,0.4))` }
                    :
                        {background: `linear-gradient(to right, #f0a202, #ea3f07)`}
                 }
          >
                <div className="header-box">
                    <span className="header-title">
                        {selectedModule ? "Simulation" : "Simulation Library"}
                    </span>
                </div>
            </header>
            <div className="container">
                {selectedModule ? (
                    React.createElement(selectedModule)
                ) : (
                    <>
                        <h1 className="title">Simulation Library</h1>
                        <div className="module-cards-container">
                            {modulesMetadata.length > 0 ? (
                                modulesMetadata.map((module, index) => (
                                    <ModuleCard
                                        key={index}
                                        title={module.title}
                                        description={module.description}
                                        onClick={() => handleCardClick(module)}
                                         colorIndex={index} // Add this line
                                    />
                                ))
                            ) : (
                                <p>No simulations available at the moment.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;