import React, { useState, useEffect } from 'react';
import { Sparkles, Play, SlidersHorizontal, Search, Tag, MessageSquare, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const POPULAR_GENRES = ['Action', 'Sci-Fi', 'Thriller', 'Comedy', 'Drama', 'Horror', 'Romance', 'Fantasy', 'Animation', 'Mystery'];
const POPULAR_MOODS = ['Mind-Blowing', 'Dark', 'Wholesome', 'Fast-Paced', 'Emotional', 'Epic', 'Cyberpunk', 'Suspenseful'];

const Recommendations = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [filters, setFilters] = useState({
    type: '',
    genre: '',
    mood: '',
    query: '',
    minRating: 6.5
  });

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setHasSearched(true);
      
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.mood) params.append('mood', filters.mood);
      if (filters.query) params.append('query', filters.query);
      if (filters.minRating) params.append('minRating', filters.minRating);

      const res = await fetch(`${API_URL}/content/recommendations?${params.toString()}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Recommendations Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial recommendations on page load
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGenreChipClick = (g) => {
    setFilters(prev => ({ ...prev, genre: prev.genre === g ? '' : g }));
  };

  const handleMoodChipClick = (m) => {
    setFilters(prev => ({ ...prev, mood: prev.mood === m ? '' : m }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecommendations();
  };

  return (
    <div className="pb-10 flex flex-col lg:flex-row gap-8">
      
      {/* Smart Filters Sidebar / Form */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <form onSubmit={handleSearchSubmit} className="glass-panel p-6 rounded-3xl sticky top-24 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2 text-gradient">
              <SlidersHorizontal className="w-5 h-5 text-[var(--color-neon-pink)]" />
              Smart Filters
            </h2>
            { (filters.genre || filters.mood || filters.query || filters.type) && (
              <button
                type="button"
                onClick={() => setFilters({ type: '', genre: '', mood: '', query: '', minRating: 6.5 })}
                className="text-xs text-gray-400 hover:text-white font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          
          {/* Content Type */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content Type</label>
            <select 
              name="type" 
              onChange={handleFilterChange} 
              value={filters.type} 
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[var(--color-electric-cyan)] text-sm font-semibold cursor-pointer"
            >
              <option value="">All Types (Movies, Series, Anime)</option>
              <option value="movie">Movies</option>
              <option value="tv">Web Series / TV</option>
              <option value="anime">Anime</option>
            </select>
          </div>

          {/* Search Query / Review Text */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[var(--color-electric-cyan)]" />
              Keyword or Review Vibe
            </label>
            <input 
              type="text" 
              name="query" 
              onChange={handleFilterChange} 
              value={filters.query} 
              placeholder="e.g. time travel, twist ending..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-electric-cyan)] text-sm font-semibold" 
            />
          </div>

          {/* Genre Chips */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[var(--color-anime-purple)]" />
              Genre
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto hide-scrollbar">
              {POPULAR_GENRES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGenreChipClick(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filters.genre === g 
                      ? 'bg-[var(--color-anime-purple)] text-white border border-[var(--color-anime-purple)]' 
                      : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mood / Vibe Chips */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-neon-pink)]" />
              Grok AI Mood / Vibe
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto hide-scrollbar">
              {POPULAR_MOODS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMoodChipClick(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filters.mood === m 
                      ? 'bg-[var(--color-neon-pink)] text-white border border-[var(--color-neon-pink)]' 
                      : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rating Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Min Rating</label>
              <span className="text-sm font-black text-yellow-400">★ {filters.minRating}</span>
            </div>
            <input 
              type="range" 
              name="minRating" 
              min="0" 
              max="10" 
              step="0.5" 
              onChange={handleFilterChange} 
              value={filters.minRating} 
              className="w-full accent-[var(--color-electric-cyan)] cursor-pointer" 
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold px-1 mt-1">
              <span>Any (0)</span>
              <span>Good (7.0)</span>
              <span>Masterpiece (9.0)</span>
            </div>
          </div>

          {/* Explicit Search Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[var(--color-electric-cyan)] text-white hover:opacity-90 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>GETTING RECOMMENDATIONS...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>FIND RECOMMENDATIONS</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Area */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-[var(--color-electric-cyan)] animate-pulse" />
              Grok AI Recommendations
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {hasSearched ? `Found ${data.length} tailored recommendations for you` : 'Adjust filters and click Find Recommendations'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl"></div>
            ))}
          </div>
        ) : data.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {data.map((item, idx) => (
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

                  {/* Grok Pick / Match Badge */}
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
                      <Star className="w-3.5 h-3.5 fill-yellow-400" /> {item.rating.toFixed(1)}
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
        ) : (
          <div className="text-center py-20 text-gray-500 glass-panel rounded-3xl p-8 border border-white/5">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20 text-[var(--color-electric-cyan)]" />
            <h3 className="text-xl font-bold text-white mb-2">No Recommendations Found</h3>
            <p className="text-sm max-w-md mx-auto mb-6">
              Try broadening your filter criteria (e.g. lowering minimum rating or clearing specific mood/genre chips) and click <strong>Find Recommendations</strong>.
            </p>
            <button
              onClick={() => {
                setFilters({ type: '', genre: '', mood: '', query: '', minRating: 5.0 });
                setTimeout(fetchRecommendations, 100);
              }}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
            >
              Reset Filters & Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
