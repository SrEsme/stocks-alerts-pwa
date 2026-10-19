import React from 'react';
import type { Alert } from '../types';
import { StockLogo } from './StockLogo';
import { triggerHaptic } from '../utils/haptics';
import './AlertCard.css';

interface StockQuote {
  price: number;
  change: number;
  changePercent: number;
}

interface AlertCardProps {
  alert: Alert;
  onDelete: (id: string) => void;
  onEdit: (alert: Alert) => void;
  onReactivate?: (id: string) => void;
  quote?: StockQuote;
  lastUpdated?: Date | null;
}

export const AlertCard: React.FC<AlertCardProps> = ({ 
  alert, 
  onDelete, 
  onEdit, 
  onReactivate,
  quote,
  lastUpdated 
}) => {
  const isTriggered = alert.status === 'triggered';
  const isUpward = alert.typeOfAlert === 'ge';
  
  const handleEdit = () => {
    triggerHaptic('light');
    onEdit(alert);
  };

  const handleDelete = () => {
    triggerHaptic('medium');
    onDelete(alert.id);
  };

  const handleReactivate = () => {
    triggerHaptic('light');
    onReactivate?.(alert.id);
  };

  // Format "last updated" time
  const formatLastUpdated = (date: Date | null | undefined) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };
  
  return (
    <div className={`alert-card ${isTriggered ? 'triggered' : ''}`}>
      <div className="alert-card-header">
        <div className="ticker-info">
          <StockLogo ticker={alert.ticker} size={30} />
          <div className="ticker-details">
            <h3 className="ticker-symbol">{alert.ticker}</h3>
            <div className="ticker-meta">
              {alert.assetType === 'crypto' && (
                <span className="crypto-badge">Crypto</span>
              )}
              <span className={`direction-badge ${isUpward ? 'up' : 'down'}`}>
                {isUpward ? '↑ Above' : '↓ Below'}
              </span>
            </div>
          </div>
        </div>
        <div className={`status-badge ${alert.status}`}>
          {isTriggered ? 'Triggered' : 'Active'}
        </div>
      </div>
      
      <div className="alert-card-body">
        <div className="prices-section">
          <div className="price-info">
            <span className="price-label">Target Price</span>
            <span className="price-value">${(alert.price ?? 0).toFixed(2)}</span>
          </div>
          
          {quote && (
            <div className="current-price-info">
              <span className="price-label">Current</span>
              <div className="current-price-row">
                <span className="current-price-value">${quote.price.toFixed(2)}</span>
                <span className={`change-indicator ${quote.change >= 0 ? 'positive' : 'negative'}`}>
                  {quote.change >= 0 ? '▲' : '▼'} {Math.abs(quote.changePercent).toFixed(2)}%
                </span>
              </div>
              {lastUpdated && (
                <span className="last-updated">{formatLastUpdated(lastUpdated)}</span>
              )}
            </div>
          )}
        </div>
        
        {isTriggered && alert.triggeredPrice != null && (
          <div className="triggered-info">
            <span className="triggered-label">Triggered at</span>
            <span className="triggered-price">${alert.triggeredPrice.toFixed(2)}</span>
          </div>
        )}

        <div className="alert-actions">
          {!isTriggered && (
            <button
              className="action-btn edit"
              onClick={handleEdit}
              title="Edit alert"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
          {isTriggered && onReactivate && (
            <button
              className="action-btn reactivate"
              onClick={handleReactivate}
              title="Reactivate alert"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
          )}
          <button
            className="action-btn delete"
            onClick={handleDelete}
            title="Delete alert"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
