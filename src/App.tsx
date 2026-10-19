import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomTabs, type TabType } from './components/BottomTabs';
import { AlertCard } from './components/AlertCard';
import { CreateAlertModal } from './components/CreateAlertModal';
import { FloatingButton } from './components/FloatingButton';
import { EmptyState } from './components/EmptyState';
import { LoginPage } from './components/LoginPage';
import { PullToRefresh } from './components/PullToRefresh';
import { FilterSortBar, type SortOption } from './components/FilterSortBar';
import { WatchlistCard } from './components/WatchlistCard';
import { WatchlistDetailModal } from './components/WatchlistDetailModal';
import { AddWatchlistModal } from './components/AddWatchlistModal';
import { useAlerts } from './hooks/useAlerts';
import { useWatchlist } from './hooks/useWatchlist';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { useStockPrices } from './hooks/useStockPrices';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { triggerHaptic } from './utils/haptics';
import { RefreshCountdown } from './components/RefreshCountdown';
import type { Alert, WatchlistItem } from './types';
import './App.css';

function AppContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('stock-alerts-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [alertStatusView, setAlertStatusView] = useState<'active' | 'triggered'>('active');
  const [initialAlert, setInitialAlert] = useState<{ ticker: string; price?: number } | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  // Watchlist state
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [editingWatchlistItem, setEditingWatchlistItem] = useState<WatchlistItem | null>(null);
  const [selectedWatchlistItem, setSelectedWatchlistItem] = useState<WatchlistItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<WatchlistItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<WatchlistItem | null>(null);

  // Filter & Sort state
  const [alertSearchQuery, setAlertSearchQuery] = useState('');
  const [watchlistSearchQuery, setWatchlistSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  const {
    activeAlerts,
    triggeredAlerts,
    loading,
    error,
    refresh,
    addAlert,
    updateAlert,
    deleteAlert,
    reactivateAlert
  } = useAlerts(user?.uid);

  const {
    items: watchlistItems,
    loading: watchlistLoading,
    addItem: addWatchlistItem,
    updateItem: updateWatchlistItem,
    deleteItem: deleteWatchlistItem,
    reorderItems: reorderWatchlistItems
  } = useWatchlist(user?.uid);

  const quoteTickers = useMemo(() => [...new Set([
    ...watchlistItems.map(item => item.ticker),
    ...activeAlerts.filter(alert => !alert.assetType || alert.assetType === 'stock').map(alert => alert.ticker)
  ])].slice(0, 20), [watchlistItems, activeAlerts]);
  const { quotes, lastUpdated: quotesUpdatedAt, refresh: refreshQuotes } = useStockPrices(quoteTickers, user);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('stock-alerts-theme', nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    if (localStorage.getItem('stock-alerts-theme')) return;
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => setTheme(preference.matches ? 'dark' : 'light');
    preference.addEventListener('change', syncTheme);
    return () => preference.removeEventListener('change', syncTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101813' : '#f3f5f1');
  }, [theme]);

  const {
    pullDistance,
    isRefreshing,
    isPulling,
    containerRef
  } = usePullToRefresh({
    onRefresh: async () => { await refresh(); refreshQuotes(); }
  });

  const handleEditClick = (alert: Alert) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    triggerHaptic('light');
    if (activeTab === 'watchlist') {
      setEditingWatchlistItem(null);
      setIsWatchlistModalOpen(true);
    } else {
      setInitialAlert(undefined);
      setEditingAlert(null);
      setIsModalOpen(true);
    }
  };

  const handleQuickAlert = (item: WatchlistItem) => {
    setEditingAlert(null);
    setInitialAlert({ ticker: item.ticker, price: item.targetPrice });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (ticker: string, price: number, type: 'ge' | 'le', note?: string, assetType?: 'stock' | 'crypto') => {
    if (editingAlert) {
      await updateAlert(editingAlert.id, { ticker, price, typeOfAlert: type, note, assetType });
    } else {
      await addAlert(ticker, price, type, note, assetType);
    }
  };

  const handleWatchlistSubmit = async (data: {
    ticker: string;
    entryPrice: number;
    targetPrice: number;
    thesis: string;
    imageUrl?: string;
  }) => {
    if (editingWatchlistItem) {
      await updateWatchlistItem(editingWatchlistItem.id, data);
    } else {
      await addWatchlistItem(data);
    }
  };

  const handleWatchlistItemClick = (item: WatchlistItem) => {
    setSelectedWatchlistItem(item);
    setIsDetailModalOpen(true);
  };

  const handleWatchlistEdit = () => {
    if (selectedWatchlistItem) {
      setEditingWatchlistItem(selectedWatchlistItem);
      setIsDetailModalOpen(false);
      setIsWatchlistModalOpen(true);
    }
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((item: WatchlistItem) => (e: React.DragEvent) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    triggerHaptic('light');
  }, []);

  const handleDragOver = useCallback((item: WatchlistItem) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== item.id) {
      setDragOverItem(item);
    }
  }, [draggedItem]);

  const handleDragEnd = useCallback(async () => {
    if (draggedItem && dragOverItem && draggedItem.id !== dragOverItem.id) {
      const items = [...watchlistItems];
      const draggedIndex = items.findIndex(i => i.id === draggedItem.id);
      const targetIndex = items.findIndex(i => i.id === dragOverItem.id);

      items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, draggedItem);

      triggerHaptic('medium');
      await reorderWatchlistItems(items);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  }, [draggedItem, dragOverItem, watchlistItems, reorderWatchlistItems]);

  // Touch drag handlers for mobile
  const touchStartY = useState<number | null>(null);
  const [touchDraggedItem, setTouchDraggedItem] = useState<WatchlistItem | null>(null);

  const handleTouchStart = useCallback((item: WatchlistItem) => (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartY[1](touch.clientY);
    setTouchDraggedItem(item);
  }, []);

  const handleTouchMove = useCallback((_item: WatchlistItem) => (_e: React.TouchEvent) => {
    if (!touchDraggedItem) return;
    // Touch move logic is complex - for now we'll rely on desktop drag
  }, [touchDraggedItem]);

  const handleTouchEnd = useCallback(() => {
    setTouchDraggedItem(null);
    touchStartY[1](null);
  }, []);

  // Apply filtering and sorting for alerts
  const displayedAlerts = useMemo(() => {
    const baseAlerts = alertStatusView === 'active' ? activeAlerts : triggeredAlerts;

    // Filter by search query
    let filtered = baseAlerts;
    if (alertSearchQuery.trim()) {
      const query = alertSearchQuery.toUpperCase().trim();
      filtered = baseAlerts.filter(a => a.ticker.includes(query));
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'ticker-asc':
          return a.ticker.localeCompare(b.ticker);
        case 'ticker-desc':
          return b.ticker.localeCompare(a.ticker);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'date-desc':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return sorted;
  }, [alertStatusView, activeAlerts, triggeredAlerts, alertSearchQuery, sortOption]);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(price);

  // Filter watchlist by search
  const displayedWatchlist = useMemo(() => {
    if (!watchlistSearchQuery.trim()) return watchlistItems;
    const query = watchlistSearchQuery.toUpperCase().trim();
    return watchlistItems.filter(item => item.ticker.includes(query));
  }, [watchlistItems, watchlistSearchQuery]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <span className="loading-text">Loading...</span>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  if (loading || watchlistLoading) {
    return (
      <div className="app">
        <Header
          user={user}
          onLogout={logout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <RefreshCountdown />
        <main className="main-content">
          <div className="loading-container">
            <div className="loading-spinner-large"></div>
            <span className="loading-text">Loading...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header
          user={user}
          onLogout={logout}
        />
        <main className="main-content">
          <div className="error-container">
            <span className="error-icon">⚠️</span>
            <p className="error-message">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'overview') {
      const recentAlerts = [...activeAlerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);
      const movers = watchlistItems.slice(0, 5);
      return (
        <div className="overview-page">
          <div className="page-heading"><div><p className="eyebrow">MARKET WATCH</p><h1>Your portfolio radar</h1><p className="page-subtitle">Prices and alerts for the stocks you follow.</p></div><button className="primary-action" onClick={handleCreateClick}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg><span>Create alert</span></button></div>
          <section className="summary-grid" aria-label="Portfolio summary">
            <article className="summary-card"><span>Watching</span><strong>{watchlistItems.length}</strong><small>stocks in your list</small></article>
            <article className="summary-card"><span>Active alerts</span><strong>{activeAlerts.length}</strong><small>price conditions</small></article>
            <article className="summary-card"><span>Triggered</span><strong>{triggeredAlerts.length}</strong><small>alerts in history</small></article>
          </section>
          <section className="dashboard-section">
            <div className="section-heading"><div><h2>Watchlist</h2><p>Latest prices and distance to your target</p></div><button className="text-action" onClick={() => setActiveTab('watchlist')}>View all <span aria-hidden="true">→</span></button></div>
            {movers.length ? <div className="quote-table">{movers.map(item => { const quote = quotes[item.ticker]; const gap = quote ? ((item.targetPrice - quote.price) / quote.price) * 100 : null; return <button className="quote-row" key={item.id} onClick={() => handleWatchlistItemClick(item)}><span className="quote-symbol"><b>{item.ticker}</b><small>{item.thesis || 'Watchlist'}</small></span><span className="quote-current">{quote && <>{formatPrice(quote.price)}<small className={quote.change >= 0 ? 'positive' : 'negative'}>{`${quote.change >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}% today`}</small></>}</span><span className="quote-target">Target {formatPrice(item.targetPrice)}<small>{gap === null ? '—' : `${gap >= 0 ? '+' : ''}${gap.toFixed(1)}% to target`}</small></span><span className="quote-chevron">›</span></button>; })}</div> : <div className="dashboard-empty"><p>Your watchlist is empty.</p><button className="text-action" onClick={() => { setActiveTab('watchlist'); setEditingWatchlistItem(null); setIsWatchlistModalOpen(true); }}>Add a stock</button></div>}
          </section>
          <section className="dashboard-section"><div className="section-heading"><div><h2>Active alerts</h2><p>Conditions you are tracking</p></div><button className="text-action" onClick={() => setActiveTab('alerts')}>Manage alerts <span aria-hidden="true">→</span></button></div>{recentAlerts.length ? <div className="alerts-grid">{recentAlerts.map(alert => <AlertCard key={alert.id} alert={alert} onDelete={deleteAlert} onEdit={handleEditClick} quote={alert.assetType === 'crypto' ? undefined : quotes[alert.ticker]} lastUpdated={quotesUpdatedAt} />)}</div> : <div className="dashboard-empty"><p>No active alerts yet.</p><button className="text-action" onClick={handleCreateClick}>Create your first alert</button></div>}</section>
        </div>
      );
    }

    if (activeTab === 'watchlist') {
      if (displayedWatchlist.length === 0) {
        return (
          <EmptyState
            type="watchlist"
            onCreateClick={handleCreateClick}
          />
        );
      }

      return (
        <div className="watchlist-list">
          {displayedWatchlist.map(item => (
            <WatchlistCard
              key={item.id}
              item={item}
              currentPrice={quotes[item.ticker]?.price}
              onCreateAlert={() => handleQuickAlert(item)}
              onClick={() => handleWatchlistItemClick(item)}
              onDragStart={handleDragStart(item)}
              onDragOver={handleDragOver(item)}
              onDragEnd={handleDragEnd}
              onTouchStart={handleTouchStart(item)}
              onTouchMove={handleTouchMove(item)}
              onTouchEnd={handleTouchEnd}
              isDragging={draggedItem?.id === item.id}
              isDragOver={dragOverItem?.id === item.id}
            />
          ))}
        </div>
      );
    }

    if (displayedAlerts.length === 0) {
      return (
        <EmptyState
          type={alertStatusView}
          onCreateClick={handleCreateClick}
        />
      );
    }

    return (
      <div className="alerts-grid">
        {displayedAlerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            quote={alert.assetType === 'crypto' ? undefined : quotes[alert.ticker]}
            lastUpdated={quotesUpdatedAt}
            onDelete={deleteAlert}
            onEdit={handleEditClick}
            onReactivate={alertStatusView === 'triggered' ? reactivateAlert : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="app">
      <PullToRefresh
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        isPulling={isPulling}
        containerRef={containerRef}
      >
        <Header
          user={user}
          onLogout={logout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <RefreshCountdown />

        {activeTab === 'alerts' && (
          <div className="alerts-controls">
            <div className="alert-view-switch" role="tablist" aria-label="Alert status">
              <button role="tab" aria-selected={alertStatusView === 'active'} className={alertStatusView === 'active' ? 'selected' : ''} onClick={() => setAlertStatusView('active')}>Active <span>{activeAlerts.length}</span></button>
              <button role="tab" aria-selected={alertStatusView === 'triggered'} className={alertStatusView === 'triggered' ? 'selected' : ''} onClick={() => setAlertStatusView('triggered')}>History <span>{triggeredAlerts.length}</span></button>
            </div>
            <FilterSortBar
              searchQuery={alertSearchQuery}
              onSearchChange={setAlertSearchQuery}
              sortOption={sortOption}
              onSortChange={setSortOption}
            />
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="watchlist-header-bar">
            <input
              type="text"
              className="watchlist-search"
              placeholder="Search watchlist..."
              value={watchlistSearchQuery}
              onChange={(e) => setWatchlistSearchQuery(e.target.value)}
            />
          </div>
        )}

        <main className="main-content">
          {renderContent()}
        </main>
      </PullToRefresh>

      {activeTab !== 'overview' && <FloatingButton onClick={handleCreateClick} label={activeTab === 'watchlist' ? 'Add to watchlist' : 'Create alert'} />}

      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeCount={activeAlerts.length}
        watchlistCount={watchlistItems.length}
      />

      <CreateAlertModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAlert(null);
        }}
        onSubmit={handleModalSubmit}
        editingAlert={editingAlert}
        initialTicker={initialAlert?.ticker}
        initialPrice={initialAlert?.price}
      />

      <AddWatchlistModal
        isOpen={isWatchlistModalOpen}
        onClose={() => {
          setIsWatchlistModalOpen(false);
          setEditingWatchlistItem(null);
        }}
        onSubmit={handleWatchlistSubmit}
        editingItem={editingWatchlistItem}
        userId={user?.uid || ''}
      />

      <WatchlistDetailModal
        item={selectedWatchlistItem}
        currentPrice={selectedWatchlistItem ? quotes[selectedWatchlistItem.ticker]?.price : undefined}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedWatchlistItem(null);
        }}
        onEdit={handleWatchlistEdit}
        onDelete={deleteWatchlistItem}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
