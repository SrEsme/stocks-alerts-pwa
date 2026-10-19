import React, { useState, useEffect } from 'react';
import './CreateAlertModal.css';
import type { Alert } from '../types';

const CRYPTO_TICKERS = ['BTC', 'ETH', 'SOL'] as const;

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticker: string, price: number, type: 'ge' | 'le', note?: string, assetType?: 'stock' | 'crypto') => Promise<void>;
  editingAlert?: Alert | null;
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingAlert
}) => {
  const [assetType, setAssetType] = useState<'stock' | 'crypto'>('stock');
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<'ge' | 'le'>('ge');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingAlert) {
      setAssetType(editingAlert.assetType || 'stock');
      setTicker(editingAlert.ticker);
      setPrice(editingAlert.price.toString());
      setType(editingAlert.typeOfAlert);
      setNote(editingAlert.note || '');
      fetchPrice(editingAlert.ticker, editingAlert.assetType || 'stock');
    } else {
      setAssetType('stock');
      setTicker('');
      setPrice('');
      setType('ge');
      setNote('');
      setCurrentPrice(null);
    }
    setError(null);
  }, [editingAlert, isOpen]);

  const fetchPrice = async (tickerSymbol: string, type: 'stock' | 'crypto' = assetType) => {
    if (!tickerSymbol) return;

    setFetchingPrice(true);
    setError(null);
    try {
      const params = new URLSearchParams({ ticker: tickerSymbol });
      if (type === 'crypto') {
        params.set('assetType', 'crypto');
      }
      const response = await fetch(`https://us-central1-stocks-alert-app-848e5.cloudfunctions.net/getStockPrice?${params}`);
      const data = await response.json();

      if (data.success) {
        setCurrentPrice(data.price);
        if (price) {
          const targetPriceNum = parseFloat(price);
          if (!isNaN(targetPriceNum)) {
            setType(targetPriceNum > data.price ? 'ge' : 'le');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching price:', err);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleTickerBlur = () => {
    if (ticker && !editingAlert && assetType === 'stock') {
      fetchPrice(ticker);
    }
  };

  const handleCryptoSelect = (cryptoTicker: string) => {
    setTicker(cryptoTicker);
    setCurrentPrice(null);
    fetchPrice(cryptoTicker, 'crypto');
  };

  const handleAssetTypeChange = (newType: 'stock' | 'crypto') => {
    setAssetType(newType);
    setTicker('');
    setPrice('');
    setCurrentPrice(null);
    setError(null);
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
    const targetPriceNum = parseFloat(value);
    if (!isNaN(targetPriceNum) && currentPrice !== null) {
      setType(targetPriceNum > currentPrice ? 'ge' : 'le');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ticker.trim()) {
      setError(assetType === 'crypto' ? 'Please select a cryptocurrency' : 'Please enter a ticker symbol');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (currentPrice === null && !editingAlert) {
      setError('Waiting for current price fetch...');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(ticker.trim().toUpperCase(), priceNum, type, note.trim() || undefined, assetType);
      onClose();
    } catch (err) {
      setError(`Failed to ${editingAlert ? 'update' : 'create'} alert. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const determinedTypeLabel = currentPrice !== null && price ? (
    parseFloat(price) > currentPrice ? 'Goes Above' : 'Falls Below'
  ) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingAlert ? 'Edit Alert' : 'Create Alert'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!editingAlert && (
            <div className="asset-type-toggle">
              <button
                type="button"
                className={`toggle-btn ${assetType === 'stock' ? 'active' : ''}`}
                onClick={() => handleAssetTypeChange('stock')}
              >
                Stock
              </button>
              <button
                type="button"
                className={`toggle-btn ${assetType === 'crypto' ? 'active' : ''}`}
                onClick={() => handleAssetTypeChange('crypto')}
              >
                Crypto
              </button>
            </div>
          )}

          {editingAlert && (
            <div className="asset-type-badge">
              {(editingAlert.assetType || 'stock') === 'crypto' ? 'Crypto' : 'Stock'}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="ticker">{assetType === 'crypto' ? 'Cryptocurrency' : 'Ticker Symbol'}</label>
            {assetType === 'crypto' && !editingAlert ? (
              <div className="crypto-selector">
                {CRYPTO_TICKERS.map(ct => (
                  <button
                    key={ct}
                    type="button"
                    className={`crypto-btn ${ticker === ct ? 'active' : ''}`}
                    onClick={() => handleCryptoSelect(ct)}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            ) : (
              <div className="input-with-action">
                <input
                  id="ticker"
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onBlur={handleTickerBlur}
                  placeholder="e.g., AAPL, TSLA, NVDA"
                  className="form-input"
                  autoComplete="off"
                  autoFocus={!editingAlert}
                  disabled={!!editingAlert}
                />
                {!editingAlert && (
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
            )}
            {fetchingPrice && assetType === 'crypto' && (
              <div className="current-price-badge" style={{ opacity: 0.6 }}>
                Fetching price...
              </div>
            )}
            {currentPrice !== null && (
              <div className="current-price-badge">
                Current: ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="price">Target Price ($)</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="note">Note (optional)</label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Take 20% off, Buy more shares"
              className="form-input"
              maxLength={100}
            />
            <span className="form-hint">Shown in Telegram notification when triggered</span>
          </div>

          {determinedTypeLabel && (
            <div className={`type-preview-badge ${type}`}>
              <span className="type-icon">
                {type === 'ge' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                  </svg>
                )}
              </span>
              <span>Trigger when price <strong>{determinedTypeLabel}</strong> ${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || (currentPrice === null && !editingAlert)}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <span>{editingAlert ? 'Update Alert' : 'Create Alert'}</span>
                <span className="btn-icon">
                  {editingAlert ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  )}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
