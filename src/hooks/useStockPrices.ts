import { useState, useEffect, useCallback, useRef } from 'react';

export interface StockQuote {
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

export interface StockQuotesState {
  quotes: Record<string, StockQuote>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Cloud Function URL - adjust if using emulator
const QUOTES_API_URL = 'https://us-central1-stocks-alert-app-848e5.cloudfunctions.net/getStockQuotes';

export function useStockPrices(tickers: string[]) {
  const [state, setState] = useState<StockQuotesState>({
    quotes: {},
    loading: false,
    error: null,
    lastUpdated: null
  });

  const tickersRef = useRef<string[]>([]);
  const intervalRef = useRef<number | null>(null);

  const fetchQuotes = useCallback(async (tickerList: string[]) => {
    if (tickerList.length === 0) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const url = `${QUOTES_API_URL}?tickers=${tickerList.join(',')}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quotes: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.quotes) {
        setState({
          quotes: data.quotes,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      } else {
        throw new Error(data.error || 'Failed to fetch quotes');
      }
    } catch (err: any) {
      console.error('Error fetching stock prices:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch prices'
      }));
    }
  }, []);

  // Refresh function for manual refresh
  const refresh = useCallback(() => {
    if (tickersRef.current.length > 0) {
      fetchQuotes(tickersRef.current);
    }
  }, [fetchQuotes]);

  // Effect to fetch quotes when tickers change
  useEffect(() => {
    const uniqueTickers = [...new Set(tickers.map(t => t.toUpperCase()))];
    
    // Only re-fetch if tickers actually changed
    const tickersChanged = JSON.stringify(uniqueTickers) !== JSON.stringify(tickersRef.current);
    
    if (tickersChanged) {
      tickersRef.current = uniqueTickers;
      fetchQuotes(uniqueTickers);
    }
  }, [tickers, fetchQuotes]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      if (tickersRef.current.length > 0) {
        console.log('🔄 Auto-refreshing stock prices...');
        fetchQuotes(tickersRef.current);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchQuotes]);

  return {
    ...state,
    refresh
  };
}
