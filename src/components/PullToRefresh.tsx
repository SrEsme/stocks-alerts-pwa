import React from 'react';
import './PullToRefresh.css';

interface PullToRefreshProps {
  children: React.ReactNode;
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  pullDistance,
  isRefreshing,
  isPulling,
  containerRef,
  threshold = 80
}) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;
  const opacity = Math.min(progress * 1.5, 1);
  
  return (
    <div className="pull-to-refresh-container" ref={containerRef}>
      <div 
        className={`pull-to-refresh-indicator ${isRefreshing ? 'refreshing' : ''} ${isPulling || isRefreshing ? 'visible' : ''}`}
        style={{ 
          transform: `translateY(${pullDistance - 60}px)`,
          opacity: opacity
        }}
      >
        <div 
          className="refresh-spinner"
          style={{ 
            transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`
          }}
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path 
              d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path 
              d="M21 3V8H16" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="refresh-text">
          {isRefreshing ? 'Refreshing...' : progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
      <div 
        className="pull-to-refresh-content"
        style={{ 
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};
