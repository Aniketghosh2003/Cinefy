import React, { useState, useEffect } from 'react';
import { Sparkles, Play, SlidersHorizontal } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Recommendations = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    genre: '',
    mood: '',
    minRating: 7
  });

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      // Build query string
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.mood) params.append('mood', filters.mood);
      if (filters.minRating) params.append('minRating', filters.minRating);

      const res = await fetch(`${API_URL}/content/recommendations?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Recommendations Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initially and when filters change
  useEffect(() => {
    fetchRecommendations();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="pb-10 flex flex-col md:flex-row gap-8">
      
      {/* Smart Filters Sidebar */}
      <div className="w-full md:w-72 flex-shrink-0">
        <div className="glass-panel p-6 rounded-2xl sticky top-24">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gradient">
            <SlidersHorizontal className="w-5 h-5 text-[var(--color-neon-pink)]" />
            Smart Filters
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Content Type</label>
              <select name="type" onChange={handleFilterChange} value={filters.type} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-electric-cyan)]">
                <option value="">All Types</option>
                <option value="movie">Movies</option>
                <option value="tv">Web Series</option>
                <option value="anime">Anime</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Genre (e.g. Sci-Fi, Action)</label>
              <input type="text" name="genre" onChange={handleFilterChange} value={filters.genre} placeholder="Comma separated..." className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-electric-cyan)]" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Grok AI Mood (e.g. Dark, Mind-Blowing)</label>
              <input type="text" name="mood" onChange={handleFilterChange} value={filters.mood} placeholder="Search mood..." className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-electric-cyan)]" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Minimum Rating: {filters.minRating}</label>
              <input type="range" name="minRating" min="0" max="10" step="0.5" onChange={handleFilterChange} value={filters.minRating} className="w-full accent-[var(--color-neon-pink)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-[var(--color-electric-cyan)]" />
          Your Recommendations
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-pulse">
            {[...Array(10)].map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl"></div>)}
          </div>
        ) : data.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {data.map((item) => (
              <div key={item.externalId} className="group cursor-pointer flex flex-col">
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
                {/* Display Mood Tags if available from DB */}
                {item.mood && item.mood.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.mood.map(m => (
                      <span key={m} className="text-[8px] px-1.5 py-0.5 bg-[var(--color-anime-purple)]/30 rounded text-[var(--color-anime-purple)] font-bold">{m}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 glass-panel rounded-2xl">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No titles found matching those specific filters in your database cache.</p>
            <p className="text-sm mt-2">Try viewing details of more movies to populate your Smart Recommendations!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
