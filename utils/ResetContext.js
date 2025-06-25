import React, { createContext, useContext, useState } from 'react';

const ResetContext = createContext();

export const ResetProvider = ({ children }) => {
  const [needsHomeReset, setNeedsHomeReset] = useState(false);

  const triggerHomeReset = () => {
    setNeedsHomeReset(true);
  };

  const clearHomeReset = () => {
    setNeedsHomeReset(false);
  };

  return (
    <ResetContext.Provider value={{ needsHomeReset, triggerHomeReset, clearHomeReset }}>
      {children}
    </ResetContext.Provider>
  );
};

export const useReset = () => {
  const context = useContext(ResetContext);
  if (!context) {
    throw new Error('useReset must be used within a ResetProvider');
  }
  return context;
}; 