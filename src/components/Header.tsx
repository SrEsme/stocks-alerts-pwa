import React, { useState, useRef, useEffect } from 'react';
import type { User } from 'firebase/auth';
import './Header.css';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  theme = 'light',
  onToggleTheme
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);
  
  return (
    <header className="header">
      <div className="header-top">
        <div className="header-brand">
          <div className="header-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M3 13.5L8.5 8L12.5 12L21 3.5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M17 3.5H21V7.5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M3 20.5H21" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="header-title">Stock Alerts</h1>
        </div>
        
        <div className="header-context">Personal market dashboard</div>
        
        <div className="header-actions">
        {onToggleTheme && <button className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀' : '☾'}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>}
        {user && (
          <div className="header-user" ref={menuRef}>
            <button 
              className="user-avatar-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="User menu"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
            </button>
            
            {showMenu && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <span className="user-name">{user.displayName || 'User'}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <div className="user-menu-divider"></div>
                <button 
                  className="user-menu-item logout"
                  onClick={() => {
                    setShowMenu(false);
                    onLogout?.();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      
    </header>
  );
};
