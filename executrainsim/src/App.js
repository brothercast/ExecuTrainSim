import React, { useState } from 'react';
import './styles/AppStyles.css';
import './styles/ModuleCards.css'; // Import the new module card styles
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
    // Wrap the component creation in a function to ensure it's a valid component
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
      <header className="app-header">
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
                  <div key={index} className="module-card-wrap">
                    <ModuleCard
                      title={module.title}
                      description={module.description}
                      imageUrl={module.imageUrl}
                      onClick={() => handleCardClick(module)}
                    />
                  </div>
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