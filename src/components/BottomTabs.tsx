import React from 'react';
import { triggerHaptic } from '../utils/haptics';
import './BottomTabs.css';

export type TabType = 'overview' | 'alerts' | 'watchlist';

interface BottomTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeCount: number;
  watchlistCount: number;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({
  activeTab,
  onTabChange,
  activeCount,
  watchlistCount,
}) => {
  const handleTabChange = (tab: TabType) => {
    triggerHaptic('light');
    onTabChange(tab);
  };

  return (
    <nav className="bottom-tabs">
      <button className={`bottom-tab-button ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>
        <div className="bottom-tab-icon-wrapper"><svg className="bottom-tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></div>
        <span className="bottom-tab-label">Overview</span>
      </button>
      <button className={`bottom-tab-button ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => handleTabChange('alerts')}>
        <div className="bottom-tab-icon-wrapper">
          <svg className="bottom-tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {activeCount > 0 && (
            <span className="bottom-tab-badge">{activeCount}</span>
          )}
        </div>
        <span className="bottom-tab-label">Alerts</span>
      </button>
      <button
        className={`bottom-tab-button ${activeTab === 'watchlist' ? 'active' : ''}`}
        onClick={() => handleTabChange('watchlist')}
      >
        <div className="bottom-tab-icon-wrapper">
          <svg className="bottom-tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          {watchlistCount > 0 && (
            <span className="bottom-tab-badge watchlist">{watchlistCount}</span>
          )}
        </div>
        <span className="bottom-tab-label">Watchlist</span>
      </button>
    </nav>
  );
};
