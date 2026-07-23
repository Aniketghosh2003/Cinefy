import React, { useState } from 'react';
import { Tag, Sparkles, Play, Star, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const GENRES = [
  { name: 'Action', color: 'from-red-500 to-orange-500', emoji: '⚔️' },
  { name: 'Comedy', color: 'from-yellow-400 to-amber-600', emoji: '😂' },
  { name: 'Drama', color: 'from-blue-500 to-indigo-600', emoji: '🎭' },
  { name: 'Horror', color: 'from-gray-700 to-black', emoji: '👻' },
  { name: 'Sci-Fi', color: 'from-cyan-400 to-blue-600', emoji: '🚀' },
  { name: 'Romance', color: 'from-pink-400 to-rose-600', emoji: '❤️' },
  { name: 'Thriller', color: 'from-emerald-500 to-teal-700', emoji: '🔪' },
  { name: 'Fantasy', color: 'from-purple-500 to-fuchsia-600', emoji: '✨' },
];

const Genres = () => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenreClick = async (genreName) => {
    if (selectedGenre === genreName) return; // Already selected

    setSelectedGenre(genreName);
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const params = new URLSearchParams({
        genre: genreName,
        minRating: '6'
      });
      const res = await fetch(`${API_URL}/content/recommendations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const json = await res.json();
      setResults(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Genre fetch error:', err);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedGenre(null);
    setResults([]);
    setError('');
  };

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-white mb-4 flex items-center justify-center gap-3">
          <Tag className="w-10 h-10 text-[var(--color-anime-purple)]" />
          Explore By Genre
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          {selectedGenre
            ? `Showing the best in ${selectedGenre} — powered by AI mood & reviews`
            : 'Discover content grouped by your favorite categories.'}
        </p>
      </div>

      {/* Genre Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 transition-all duration-500 ${selectedGenre ? 'mb-10' : ''}`}>
        {GENRES.map((genre) => (
          <div
            key={genre.name}
            onClick={() => handleGenreClick(genre.name)}
            className={`cursor-pointer rounded-2xl relative overflow-hidden group transition-all duration-300 shadow-lg ${selectedGenre === genre.name
                ? 'h-32 ring-2 ring-[var(--color-electric-cyan)] ring-offset-2 ring-offset-[var(--color-void)] scale-[1.02]'
                : selectedGenre
                  ? 'h-24 opacity-60 hover:opacity-90'
                  : 'h-40 hover:scale-105'
              }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
              <span className={`mb-1 transition-all duration-300 ${selectedGenre ? 'text-2xl' : 'text-4xl mb-2'}`}>{genre.emoji}</span>
              <h3 className={`font-black tracking-wider text-shadow-sm transition-all duration-300 ${selectedGenre ? 'text-base' : 'text-xl'}`}>{genre.name}</h3>
            </div>
            {/* Selected indicator */}
            {selectedGenre === genre.name && (
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[var(--color-electric-cyan)] shadow-[0_0_10px_rgba(0,229,255,0.8)] animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Results Section */}
      {selectedGenre && (
        <div className="mt-2">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[var(--color-electric-cyan)] animate-pulse" />
                Best in {selectedGenre}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {loading ? 'Finding the best titles...' : `${results.length} recommendations curated by AI`}
              </p>
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold rounded-xl transition-all border border-white/10 cursor-pointer text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Clear Selection
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-white/5 rounded-2xl mb-3"></div>
                  <div className="h-4 bg-white/5 rounded-lg w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/5 rounded-lg w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-16 glass-panel rounded-3xl border border-red-500/20">
              <p className="text-red-400 font-semibold mb-4">{error}</p>
              <button
                onClick={() => handleGenreClick(selectedGenre)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {results.map((item, idx) => (
                <Link
                  to={`/details/${item.source}/${item.externalId}?type=${item.type}`}
                  key={`${item.source}-${item.type}-${item.externalId}-${idx}`}
                  className="group flex flex-col"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[2/3] mb-3 transition-transform duration-300 group-hover:scale-105 shadow-xl group-hover:neon-border bg-gray-800 border border-white/5">
                    {item.poster ? (
                      <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center text-xs text-gray-500">No Image</div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-10 h-10 text-white fill-white/80" />
                    </div>

                    {/* Grok Note Badge */}
                    {item.grokNote && (
                      <div className="absolute top-2 left-2 right-2 z-10">
                        <span className="block px-2 py-1 bg-black/80 backdrop-blur-md border border-[var(--color-electric-cyan)]/50 text-[var(--color-electric-cyan)] text-[9px] font-black rounded-lg truncate shadow-lg">
                          ✨ {item.grokNote}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mt-1">
                    <span className="uppercase text-[10px] tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {item.type}
                    </span>
                    {item.rating && (
                      <span className="flex items-center gap-1 text-yellow-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-yellow-400" /> {Number(item.rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Mood Tags */}
                  {item.mood && item.mood.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {item.mood.slice(0, 2).map(m => (
                        <span key={m} className="text-[9px] px-1.5 py-0.5 bg-[var(--color-anime-purple)]/25 text-[var(--color-anime-purple)] font-bold rounded border border-[var(--color-anime-purple)]/30">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-white/5">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20 text-[var(--color-electric-cyan)]" />
              <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                We couldn't find content matching "{selectedGenre}" right now. Try another genre!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Genres;
