import React from 'react';
import { triggerHaptic } from '../utils/haptics';
import './FilterSortBar.css';

export type SortOption = 'ticker-asc' | 'ticker-desc' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';

interface FilterSortBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export const FilterSortBar: React.FC<FilterSortBarProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange
}) => {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    triggerHaptic('light');
    onSortChange(e.target.value as SortOption);
  };

  return (
    <div className="filter-sort-bar">
      <div className="search-container">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search ticker..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => {
              triggerHaptic('light');
              onSearchChange('');
            }}
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      <div className="sort-container">
        <select 
          className="sort-select"
          value={sortOption}
          onChange={handleSortChange}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="ticker-asc">Ticker A-Z</option>
          <option value="ticker-desc">Ticker Z-A</option>
          <option value="price-asc">Price: Low-High</option>
          <option value="price-desc">Price: High-Low</option>
        </select>
      </div>
    </div>
  );
};
