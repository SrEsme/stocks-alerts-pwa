import React from 'react';
import type { WatchlistItem } from '../types';
import { StockLogo } from './StockLogo';
import './WatchlistCard.css';

interface WatchlistCardProps {
  item: WatchlistItem;
  currentPrice?: number;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

export const WatchlistCard: React.FC<WatchlistCardProps> = ({
  item,
  currentPrice,
  onClick,
  onDragStart,
  onDragOver,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isDragging,
  isDragOver,
}) => {
  const potentialGain = currentPrice
    ? ((item.targetPrice - currentPrice) / currentPrice) * 100
    : ((item.targetPrice - item.entryPrice) / item.entryPrice) * 100;

  const priceVsEntry = currentPrice
    ? ((currentPrice - item.entryPrice) / item.entryPrice) * 100
    : 0;

  const hasImage = !!item.imageUrl;

  return (
    <div
      className={`watchlist-card ${hasImage ? 'has-image' : 'no-image'} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
    >
      {/* Drag handle - top bar */}
      <div className="watchlist-card-drag-handle">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>

      {/* Hero image area - only when image exists */}
      {hasImage && (
        <div className="watchlist-card-hero">
          <img
            src={item.imageUrl}
            alt={`${item.ticker} chart`}
            className="watchlist-card-hero-img"
            loading="lazy"
          />
          {/* Gradient overlay at bottom of image for text legibility */}
          <div className="watchlist-card-hero-overlay" />
          {/* Ticker badge floating on image */}
          <div className="watchlist-card-hero-badge">
            <StockLogo ticker={item.ticker} size={24} />
            <span className="watchlist-hero-ticker">{item.ticker}</span>
          </div>
          {/* Gain badge floating on image */}
          <div className={`watchlist-card-hero-gain ${potentialGain >= 0 ? 'positive' : 'negative'}`}>
            {potentialGain >= 0 ? '+' : ''}{potentialGain.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Card body with stock info */}
      <div className="watchlist-card-body">
        {/* If no image, show logo + ticker inline */}
        {!hasImage && (
          <div className="watchlist-card-logo-row">
            <StockLogo ticker={item.ticker} size={40} />
            <div className="watchlist-card-logo-info">
              <span className="watchlist-ticker">{item.ticker}</span>
              {currentPrice && (
                <span className={`watchlist-current-price ${priceVsEntry >= 0 ? 'up' : 'down'}`}>
                  ${currentPrice.toFixed(2)}
                </span>
              )}
            </div>
            <div className={`watchlist-gain-badge ${potentialGain >= 0 ? 'positive' : 'negative'}`}>
              {potentialGain >= 0 ? '+' : ''}{potentialGain.toFixed(1)}%
            </div>
          </div>
        )}

        {/* Price row */}
        <div className="watchlist-card-prices">
          {hasImage && (
            <div className="watchlist-card-price-current">
              {currentPrice && (
                <span className={`watchlist-current-price ${priceVsEntry >= 0 ? 'up' : 'down'}`}>
                  ${currentPrice.toFixed(2)}
                </span>
              )}
            </div>
          )}
          <div className="watchlist-card-price-range">
            <div className="watchlist-price-item">
              <span className="watchlist-price-label">Entry</span>
              <span className="watchlist-price-value">${item.entryPrice.toFixed(2)}</span>
            </div>
            <div className="watchlist-price-divider" />
            <div className="watchlist-price-item">
              <span className="watchlist-price-label">Target</span>
              <span className="watchlist-price-value target">${item.targetPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Thesis preview */}
        {item.thesis && (
          <p className="watchlist-card-thesis">{item.thesis}</p>
        )}
      </div>

      {/* Chevron */}
      <div className="watchlist-card-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </div>
  );
};
