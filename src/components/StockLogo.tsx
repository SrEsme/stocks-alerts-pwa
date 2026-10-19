import React, { useState } from 'react';
import './StockLogo.css';

interface StockLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

// Free stock logo sources
// 1. Clearbit Logo API - works with domain names
// 2. Logo.dev - free tier available
// 3. Twelve Data - has stock logos

const LOGO_PROVIDERS = {
  // Use a combination of approaches
  logodev: (ticker: string) => 
    `https://img.logo.dev/ticker/${ticker}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`,
  clearbit: (domain: string) => 
    `https://logo.clearbit.com/${domain}`,
};

// Mapping of common stock tickers to their company domains
const TICKER_TO_DOMAIN: Record<string, string> = {
  'AAPL': 'apple.com',
  'GOOGL': 'google.com',
  'GOOG': 'google.com',
  'MSFT': 'microsoft.com',
  'AMZN': 'amazon.com',
  'META': 'meta.com',
  'TSLA': 'tesla.com',
  'NVDA': 'nvidia.com',
  'AMD': 'amd.com',
  'INTC': 'intel.com',
  'NFLX': 'netflix.com',
  'DIS': 'disney.com',
  'PYPL': 'paypal.com',
  'UBER': 'uber.com',
  'LYFT': 'lyft.com',
  'SPOT': 'spotify.com',
  'SNAP': 'snap.com',
  'TWTR': 'twitter.com',
  'CRM': 'salesforce.com',
  'ORCL': 'oracle.com',
  'IBM': 'ibm.com',
  'CSCO': 'cisco.com',
  'ADBE': 'adobe.com',
  'SHOP': 'shopify.com',
  'SQ': 'squareup.com',
  'COIN': 'coinbase.com',
  'HOOD': 'robinhood.com',
  'ZM': 'zoom.us',
  'DOCU': 'docusign.com',
  'ABNB': 'airbnb.com',
  'BA': 'boeing.com',
  'WMT': 'walmart.com',
  'TGT': 'target.com',
  'COST': 'costco.com',
  'HD': 'homedepot.com',
  'NKE': 'nike.com',
  'SBUX': 'starbucks.com',
  'MCD': 'mcdonalds.com',
  'KO': 'coca-cola.com',
  'PEP': 'pepsi.com',
  'JNJ': 'jnj.com',
  'PFE': 'pfizer.com',
  'MRNA': 'modernatx.com',
  'V': 'visa.com',
  'MA': 'mastercard.com',
  'JPM': 'jpmorganchase.com',
  'BAC': 'bankofamerica.com',
  'GS': 'goldmansachs.com',
  'MS': 'morganstanley.com',
  'C': 'citi.com',
  'WFC': 'wellsfargo.com',
  'BRK.A': 'berkshirehathaway.com',
  'BRK.B': 'berkshirehathaway.com',
  'BTC': 'bitcoin.org',
  'ETH': 'ethereum.org',
  'SOL': 'solana.com',
};

export const StockLogo: React.FC<StockLogoProps> = ({ 
  ticker, 
  size = 40,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(0);
  
  const upperTicker = ticker.toUpperCase();
  const domain = TICKER_TO_DOMAIN[upperTicker];
  
  const getLogoUrl = (): string | null => {
    if (currentProvider === 0) {
      // Try logo.dev first
      return LOGO_PROVIDERS.logodev(upperTicker.toLowerCase());
    } else if (currentProvider === 1 && domain) {
      // Fallback to Clearbit if we have a domain
      return LOGO_PROVIDERS.clearbit(domain);
    }
    return null;
  };
  
  const logoUrl = getLogoUrl();
  
  const handleError = () => {
    if (currentProvider === 0 && domain) {
      // Try next provider
      setCurrentProvider(1);
    } else {
      setImageError(true);
    }
  };
  
  if (imageError || !logoUrl) {
    // Fallback to styled initials
    const initial = upperTicker.charAt(0);
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
      '#f97316', '#eab308', '#22c55e', '#14b8a6',
      '#06b6d4', '#3b82f6'
    ];
    const colorIndex = upperTicker.charCodeAt(0) % colors.length;
    
    return (
      <div 
        className={`stock-logo-fallback ${className}`}
        style={{ 
          width: size, 
          height: size,
          backgroundColor: colors[colorIndex],
          fontSize: size * 0.45
        }}
      >
        {initial}
      </div>
    );
  }
  
  return (
    <img 
      src={logoUrl}
      alt={`${ticker} logo`}
      className={`stock-logo ${className}`}
      style={{ width: size, height: size }}
      onError={handleError}
      loading="lazy"
    />
  );
};
