import React from 'react';
import './FloatingButton.css';

interface FloatingButtonProps {
  onClick: () => void;
  label: string;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick, label }) => {
  return (
    <button className="floating-btn" onClick={onClick} aria-label={label} title={label}>
      <span className="floating-btn-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </span>
      <span className="floating-btn-pulse"></span>
    </button>
  );
};
