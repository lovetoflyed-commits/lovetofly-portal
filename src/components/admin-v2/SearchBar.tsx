'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader } from 'lucide-react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'user' | 'hangar' | 'booking' | 'listing' | 'owner';
  url?: string;
}

export interface SearchBarProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultSelect: (result: SearchResult) => void;
  placeholder?: string;
  minChars?: number;
  debounceMs?: number;
  className?: string;
}

const typeColors = {
  user: 'bg-blue-100 text-blue-800',
  hangar: 'bg-green-100 text-green-800',
  booking: 'bg-purple-100 text-purple-800',
  listing: 'bg-orange-100 text-orange-800',
  owner: 'bg-pink-100 text-pink-800',
};

/**
 * SearchBar Component
 * 
 * Global search with async results and debouncing
 * 
 * @example
 * ```tsx
 * <SearchBar
 *   onSearch={async (q) => await api.search(q)}
 *   onResultSelect={(r) => navigate(r.url)}
 *   placeholder="Search users, hangars, bookings..."
 * />
 * ```
 */
export function SearchBar({
  onSearch,
  onResultSelect,
  placeholder = 'Search...',
  minChars = 2,
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const debounceTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.length < minChars) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      onSearch(searchQuery)
        .then((searchResults) => {
          setResults(searchResults);
          setSelectedIndex(-1);
        })
        .catch((error) => {
          console.error('Search error:', error);
          setResults([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [onSearch, minChars]
  );

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, performSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!results.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onResultSelect(result);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader size={20} className="text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= minChars || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Loader size={20} className="mx-auto mb-2 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {/* Group results by type */}
              {Array.from(new Set(results.map((r) => r.type))).map((type) => {
                const typeResults = results.filter((r) => r.type === type);
                return (
                  <div key={type}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-t border-gray-200 first:border-t-0">
                      {type}
                    </div>
                    {typeResults.map((result, idx) => {
                      const resultIndex = results.indexOf(result);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          onMouseEnter={() => setSelectedIndex(resultIndex)}
                          className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                            selectedIndex === resultIndex ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[result.type]}`}>
                              {result.type}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                              {result.description && (
                                <p className="text-xs text-gray-500 truncate">{result.description}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
