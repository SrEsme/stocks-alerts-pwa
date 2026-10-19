import { useState, useMemo, useCallback } from 'react';
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
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { triggerHaptic } from './utils/haptics';
import type { Alert, WatchlistItem } from './types';
import './App.css';

function AppContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('active');
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const {
    pullDistance,
    isRefreshing,
    isPulling,
    containerRef
  } = usePullToRefresh({
    onRefresh: refresh
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
      setEditingAlert(null);
      setIsModalOpen(true);
    }
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
    const baseAlerts = activeTab === 'active' ? activeAlerts : triggeredAlerts;

    // Filter by search query
    let filtered = baseAlerts;
    if (searchQuery.trim()) {
      const query = searchQuery.toUpperCase().trim();
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
  }, [activeTab, activeAlerts, triggeredAlerts, searchQuery, sortOption]);

  // Filter watchlist by search
  const displayedWatchlist = useMemo(() => {
    if (!searchQuery.trim()) return watchlistItems;
    const query = searchQuery.toUpperCase().trim();
    return watchlistItems.filter(item => item.ticker.includes(query));
  }, [watchlistItems, searchQuery]);

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
        />
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
          type={activeTab}
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
            onDelete={deleteAlert}
            onEdit={handleEditClick}
            onReactivate={activeTab === 'triggered' ? reactivateAlert : undefined}
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
        />

        {activeTab !== 'watchlist' && (
          <FilterSortBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOption={sortOption}
            onSortChange={setSortOption}
          />
        )}

        {activeTab === 'watchlist' && (
          <div className="watchlist-header-bar">
            <input
              type="text"
              className="watchlist-search"
              placeholder="Search watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <main className="main-content">
          {renderContent()}
        </main>
      </PullToRefresh>

      <FloatingButton onClick={handleCreateClick} />

      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeCount={activeAlerts.length}
        triggeredCount={triggeredAlerts.length}
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
