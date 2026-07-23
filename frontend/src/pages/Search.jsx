import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Play, AlertCircle, Film } from 'lucide-react';
import { Link } from 'react-router-dom';

import API_URL from '../api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError('');
      return;
    }

    const fetchSearch = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_URL}/content/search?q=${encodeURIComponent(debouncedQuery)}`);

        if (!res.ok) {
          throw new Error(`Search request failed (${res.status})`);
        }

        const json = await res.json();
        const parsed = Array.isArray(json) ? json : json?.results || [];
        setResults(parsed);

        if (parsed.length === 0) {
          setError('');
        }
      } catch (err) {
        console.error("Search Error:", err);
        setError('Something went wrong while searching. Please try again.');
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
          autoFocus
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="w-5 h-5 border-2 border-[var(--color-electric-cyan)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12 glass-panel rounded-2xl border border-red-500/20 mb-8">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-red-300 font-semibold mb-4">{error}</p>
          <button
            onClick={() => { setDebouncedQuery(''); setTimeout(() => setDebouncedQuery(query), 50); }}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* Empty State — no query */}
      {!query.trim() && !loading && results.length === 0 && !error && (
        <div className="text-center py-20">
          <Film className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <h2 className="text-xl font-bold text-white mb-2">Search Cinefy</h2>
          <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">
            Type a movie, anime, or web series name above to find it instantly across TMDB and MyAnimeList.
          </p>
        </div>
      )}

      {/* Empty State — has query but no results */}
      {query.trim() && !loading && results.length === 0 && !error && (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/5">
          <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-bold text-white mb-2">No results found for "{query}"</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Try a different spelling, or search for the original title. We search across TMDB (movies/shows) and MyAnimeList (anime).
          </p>
        </div>
      )}

      {/* Results */}
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
              {item.rating && <span className="text-yellow-400 font-bold">★ {Number(item.rating).toFixed(1)}</span>}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Search;
