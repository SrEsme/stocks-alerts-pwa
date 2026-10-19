import React, { useEffect, useState } from 'react';
import type { WatchlistItem } from '../types';
import { StockLogo } from './StockLogo';
import { triggerHaptic } from '../utils/haptics';
import './WatchlistDetailModal.css';

interface WatchlistDetailModalProps {
  item: WatchlistItem | null;
  currentPrice?: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const WatchlistDetailModal: React.FC<WatchlistDetailModalProps> = ({
  item,
  currentPrice,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) setIsImageExpanded(false);
  }, [isOpen, item?.id]);

  useEffect(() => {
    if (!isImageExpanded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImageExpanded(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isImageExpanded]);

  if (!isOpen || !item) return null;

  const potentialGain = currentPrice != null && currentPrice > 0
    ? ((item.targetPrice - currentPrice) / currentPrice) * 100
    : ((item.targetPrice - item.entryPrice) / item.entryPrice) * 100;

  const priceVsEntry = currentPrice != null
    ? ((currentPrice - item.entryPrice) / item.entryPrice) * 100
    : 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    triggerHaptic('medium');
    try {
      await onDelete(item.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    triggerHaptic('light');
    onEdit();
  };

  return (
    <div className="watchlist-detail-overlay" onClick={onClose}>
      <div className="watchlist-detail-container" onClick={(e) => e.stopPropagation()}>
        {/* Hero image at top of modal if available */}
        {item.imageUrl && (
          <div className="watchlist-detail-hero">
            <button type="button" className="watchlist-detail-image-button" onClick={() => setIsImageExpanded(true)} aria-label={`View ${item.ticker} image full screen`}>
              <img
                src={item.imageUrl}
                alt={`${item.ticker} chart`}
                className="watchlist-detail-hero-img"
              />
            </button>
            <span className="watchlist-detail-zoom-hint" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
            </span>
            <div className="watchlist-detail-hero-overlay" />
          </div>
        )}

        <div className="watchlist-detail-header">
          <div className="watchlist-detail-title-row">
            <div className="watchlist-detail-logo">
              <StockLogo ticker={item.ticker} size={56} />
            </div>
            <div className="watchlist-detail-title">
              <h2>{item.ticker}</h2>
              {currentPrice != null && (
                <span className={`watchlist-detail-current ${priceVsEntry >= 0 ? 'up' : 'down'}`}>
                  ${currentPrice.toFixed(2)}
                  <span className="watchlist-detail-change">
                    ({priceVsEntry >= 0 ? '+' : ''}{priceVsEntry.toFixed(2)}%)
                  </span>
                </span>
              )}
            </div>
          </div>
          <button className="watchlist-detail-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="watchlist-detail-content">
          <div className="watchlist-detail-prices">
            <div className="watchlist-price-box entry">
              <span className="watchlist-price-box-label">Entry Price</span>
              <span className="watchlist-price-box-value">${item.entryPrice.toFixed(2)}</span>
            </div>
            <div className="watchlist-price-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
            <div className="watchlist-price-box target">
              <span className="watchlist-price-box-label">Target Price</span>
              <span className="watchlist-price-box-value">${item.targetPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className={`watchlist-detail-potential ${potentialGain >= 0 ? 'positive' : 'negative'}`}>
            <span className="potential-label">Potential Return</span>
            <span className="potential-value">{potentialGain >= 0 ? '+' : ''}{potentialGain.toFixed(1)}%</span>
          </div>

          <div className="watchlist-detail-thesis">
            <h3>Investment Thesis</h3>
            <p>{item.thesis || 'No thesis provided.'}</p>
          </div>

          <div className="watchlist-detail-meta">
            <span>Added {item.createdAt.toLocaleDateString()}</span>
            {item.updatedAt > item.createdAt && (
              <span>Updated {item.updatedAt.toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="watchlist-detail-actions">
          {showDeleteConfirm ? (
            <div className="watchlist-delete-confirm">
              <span>Delete this item?</span>
              <div className="watchlist-delete-buttons">
                <button
                  className="watchlist-btn-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="watchlist-btn-delete-confirm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button className="watchlist-btn-edit" onClick={handleEdit}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button
                className="watchlist-btn-delete"
                onClick={() => {
                  triggerHaptic('light');
                  setShowDeleteConfirm(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      {isImageExpanded && item.imageUrl && (
        <div className="watchlist-image-lightbox" role="dialog" aria-modal="true" aria-label={`${item.ticker} image`} onClick={(event) => { event.stopPropagation(); setIsImageExpanded(false); }}>
          <button type="button" className="watchlist-image-lightbox-close" aria-label="Close enlarged image" onClick={(event) => { event.stopPropagation(); setIsImageExpanded(false); }}>×</button>
          <img src={item.imageUrl} alt={`${item.ticker} enlarged chart`} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
