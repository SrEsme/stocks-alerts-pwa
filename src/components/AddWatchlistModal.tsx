import React, { useState, useEffect, useRef } from 'react';
import type { WatchlistItem } from '../types';
import { useImageUpload } from '../hooks/useImageUpload';
import { functionUrl } from '../config/functions';
import './AddWatchlistModal.css';

interface AddWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    ticker: string;
    entryPrice: number;
    targetPrice: number;
    thesis: string;
    imageUrl?: string;
  }) => Promise<void>;
  editingItem?: WatchlistItem | null;
  userId: string;
}

export const AddWatchlistModal: React.FC<AddWatchlistModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  userId,
}) => {
  const [ticker, setTicker] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [thesis, setThesis] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploading, progress, uploadImage } = useImageUpload({
    userId,
    folder: 'watchlist',
  });

  useEffect(() => {
    if (editingItem) {
      setTicker(editingItem.ticker);
      setEntryPrice(editingItem.entryPrice.toString());
      setTargetPrice(editingItem.targetPrice.toString());
      setThesis(editingItem.thesis);
      setImageUrl(editingItem.imageUrl || '');
      fetchPrice(editingItem.ticker);
    } else {
      setTicker('');
      setEntryPrice('');
      setTargetPrice('');
      setThesis('');
      setImageUrl('');
      setCurrentPrice(null);
    }
    setError(null);
  }, [editingItem, isOpen]);

  const fetchPrice = async (tickerSymbol: string) => {
    if (!tickerSymbol) return;

    setFetchingPrice(true);
    try {
      const response = await fetch(
        `${functionUrl('getStockPrice')}?ticker=${encodeURIComponent(tickerSymbol)}`
      );
      const data = await response.json();

      if (data.success) {
        setCurrentPrice(data.price);
        // Auto-fill entry price if empty
        if (!entryPrice && !editingItem) {
          setEntryPrice(data.price.toFixed(2));
        }
      }
    } catch (err) {
      console.error('Error fetching price:', err);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleTickerBlur = () => {
    if (ticker && !editingItem) {
      fetchPrice(ticker);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ticker.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    const entryNum = parseFloat(entryPrice);
    if (isNaN(entryNum) || entryNum <= 0) {
      setError('Please enter a valid entry price');
      return;
    }

    const targetNum = parseFloat(targetPrice);
    if (isNaN(targetNum) || targetNum <= 0) {
      setError('Please enter a valid target price');
      return;
    }

    if (!thesis.trim()) {
      setError('Please enter your investment thesis');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        entryPrice: entryNum,
        targetPrice: targetNum,
        thesis: thesis.trim(),
        imageUrl: imageUrl || undefined,
      });
      onClose();
    } catch (err) {
      setError(`Failed to ${editingItem ? 'update' : 'add'} item. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const potentialGain = entryPrice && targetPrice
    ? ((parseFloat(targetPrice) - parseFloat(entryPrice)) / parseFloat(entryPrice)) * 100
    : null;

  return (
    <div className="add-watchlist-overlay" onClick={onClose}>
      <div className="add-watchlist-container" onClick={(e) => e.stopPropagation()}>
        <div className="add-watchlist-header">
          <h2>{editingItem ? 'Edit Watchlist Item' : 'Add to Watchlist'}</h2>
          <button className="add-watchlist-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-watchlist-form">
          <div className="form-group">
            <label htmlFor="wl-ticker">Ticker Symbol</label>
            <div className="input-with-action">
              <input
                id="wl-ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onBlur={handleTickerBlur}
                placeholder="e.g., AAPL, TSLA"
                className="form-input"
                autoComplete="off"
                disabled={!!editingItem}
              />
              {!editingItem && (
                <button
                  type="button"
                  className="inline-fetch-btn"
                  onClick={() => fetchPrice(ticker)}
                  disabled={fetchingPrice || !ticker}
                >
                  {fetchingPrice ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  )}
                </button>
              )}
            </div>
            {currentPrice !== null && (
              <div className="current-price-badge">
                Current: ${currentPrice.toFixed(2)}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wl-entry">Entry Price ($)</label>
              <input
                id="wl-entry"
                type="number"
                step="0.01"
                min="0"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="Buy at"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="wl-target">Target Price ($)</label>
              <input
                id="wl-target"
                type="number"
                step="0.01"
                min="0"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Sell at"
                className="form-input"
              />
            </div>
          </div>

          {potentialGain !== null && !isNaN(potentialGain) && (
            <div className={`potential-gain-preview ${potentialGain >= 0 ? 'positive' : 'negative'}`}>
              <span>Potential Return:</span>
              <strong>{potentialGain >= 0 ? '+' : ''}{potentialGain.toFixed(1)}%</strong>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="wl-thesis">Investment Thesis</label>
            <textarea
              id="wl-thesis"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="Why do you want to buy this stock? What's your investment idea?"
              className="form-input form-textarea"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Image (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="file-input-hidden"
              id="wl-image-input"
            />

            {!imageUrl ? (
              <label htmlFor="wl-image-input" className="image-upload-btn">
                {uploading ? (
                  <div className="upload-progress">
                    <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                    <span>Uploading... {progress}%</span>
                  </div>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>Add chart or image</span>
                  </>
                )}
              </label>
            ) : (
              <div className="image-preview-container">
                <img src={imageUrl} alt="Preview" className="image-preview-img" />
                <button
                  type="button"
                  className="image-remove-btn"
                  onClick={handleRemoveImage}
                  aria-label="Remove image"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <label htmlFor="wl-image-input" className="image-change-btn">
                  Change image
                </label>
              </div>
            )}
            <span className="form-hint">Add a chart screenshot or analysis image (max 5MB)</span>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading || uploading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <span>{editingItem ? 'Update' : 'Add to Watchlist'}</span>
                <span className="btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
