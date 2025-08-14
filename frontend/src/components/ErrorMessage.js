import React from 'react';
import '../styles/ErrorMessage.css';

function ErrorMessage({ message }) {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h3 className="error-title">Error</h3>
        <p className="error-message">{message}</p>
      </div>
    </div>
  );
}

export default ErrorMessage;
