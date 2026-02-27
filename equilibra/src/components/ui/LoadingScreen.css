import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
  subtext?: string;
  fullscreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading…',
  subtext,
  fullscreen = true,
}) => {
  const containerStyle = fullscreen ? undefined : { minHeight: '100%' };

  return (
    <div className="cmd-loading-screen" style={containerStyle}>
      <div className="cmd-loading-shell">
        <div className="cmd-loading-ring" role="status" aria-label="Loading" />
        <p className="cmd-loading-message">{message}</p>
        {subtext ? <p className="cmd-loading-subtext">{subtext}</p> : null}
      </div>
    </div>
  );
};
