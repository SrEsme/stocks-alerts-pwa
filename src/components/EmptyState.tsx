import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  type: 'active' | 'triggered' | 'watchlist';
  onCreateClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onCreateClick }) => {
  const getIcon = () => {
    if (type === 'active') {
      return (
        <svg className="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      );
    }
    if (type === 'watchlist') {
      return (
        <svg className="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      );
    }
    return (
      <svg className="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    );
  };

  const getTitle = () => {
    if (type === 'active') return 'No Active Alerts';
    if (type === 'watchlist') return 'Your Watchlist is Empty';
    return 'No Triggered Alerts';
  };

  const getDescription = () => {
    if (type === 'active') {
      return 'Create your first alert to get notified when a stock hits your target price.';
    }
    if (type === 'watchlist') {
      return 'Add stocks you\'re planning to buy. Track your entry targets and investment thesis.';
    }
    return 'When your alerts are triggered, they will appear here.';
  };

  const getButtonText = () => {
    if (type === 'watchlist') return 'Add to Watchlist';
    return 'Create Alert';
  };

  const showButton = (type === 'active' || type === 'watchlist') && onCreateClick;

  return (
    <div className="empty-state">
      <div className="empty-icon-container">
        {getIcon()}
      </div>
      <h3 className="empty-title">{getTitle()}</h3>
      <p className="empty-description">{getDescription()}</p>
      {showButton && (
        <button className="empty-action" onClick={onCreateClick}>
          <span>{getButtonText()}</span>
          <svg className="empty-action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      )}
    </div>
  );
};
