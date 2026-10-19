import { useState, useEffect, useCallback, useRef } from 'react';
import { functionUrl } from '../config/functions';
import type { User } from 'firebase/auth';

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

export function useStockPrices(tickers: string[], user: User | null) {
  const [state, setState] = useState<StockQuotesState>({
    quotes: {},
    loading: false,
    error: null,
    lastUpdated: null
  });

  const tickersRef = useRef<string[]>([]);
  const userIdRef = useRef<string | null>(null);

  const fetchQuotes = useCallback(async (tickerList: string[]) => {
    if (tickerList.length === 0) {
      setState({ quotes: {}, loading: false, error: null, lastUpdated: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (!user) throw new Error('Sign in to load market quotes');
      const params = new URLSearchParams({ tickers: tickerList.join(',') });
      const url = `${functionUrl('getStockQuotes')}?${params}`;
      const token = await user.getIdToken();
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      
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
  }, [user]);

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
    const userChanged = userIdRef.current !== (user?.uid || null);
    userIdRef.current = user?.uid || null;

    if (tickersChanged || userChanged) {
      tickersRef.current = uniqueTickers;
      fetchQuotes(uniqueTickers);
    }
  }, [tickers, fetchQuotes, user?.uid]);

  return {
    ...state,
    refresh
  };
}
