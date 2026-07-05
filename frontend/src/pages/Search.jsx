import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce logic
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const fetchSearch = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/content/search?q=${encodeURIComponent(debouncedQuery)}`);
        const json = await res.json();
        setResults(Array.isArray(json) ? json : json?.results || []);
      } catch (error) {
        console.error("Search Error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSearch();
  }, [debouncedQuery]);

  return (
    <div className="pb-10 max-w-5xl mx-auto">
      {/* Search Input Area */}
      <div className="relative mb-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full bg-[var(--color-surface)] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-electric-cyan)] focus:ring-1 focus:ring-[var(--color-electric-cyan)] text-lg glass-panel transition-all"
          placeholder="Search for movies, web series, or anime..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="w-5 h-5 border-2 border-[var(--color-electric-cyan)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Results */}
      {query.trim() && !loading && results.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No results found for "{query}".
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {results.map((item) => (
          <Link
            to={`/details/${item.source}/${item.externalId}?type=${item.type}`}
            key={`${item.source}-${item.type}-${item.externalId}`}
            className="group flex flex-col"
          >
            <div className="relative rounded-xl overflow-hidden aspect-[2/3] mb-3 transition-transform duration-300 group-hover:scale-105 shadow-lg group-hover:neon-border">
              {item.poster ? (
                <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center text-xs text-gray-500">No Image</div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-10 h-10 text-white fill-white/80" />
              </div>
            </div>
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">
              {item.title}
            </h3>
            <p className="text-[10px] text-[var(--color-text-secondary)] capitalize mt-0.5 flex items-center justify-between">
              <span>{item.type}</span>
              {item.rating && <span className="text-yellow-400 font-bold">★ {item.rating.toFixed(1)}</span>}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Search;
