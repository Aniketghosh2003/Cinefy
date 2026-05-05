import React, { useEffect, useState } from 'react';
import { Calendar, Play } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Ongoing = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, movie, tv, anime

  useEffect(() => {
    const fetchOngoing = async () => {
      try {
        setLoading(true);
        const url = filter === 'all' 
          ? `${API_URL}/content/ongoing` 
          : `${API_URL}/content/ongoing?type=${filter}`;
          
        const res = await fetch(url);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching ongoing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOngoing();
  }, [filter]);

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-[var(--color-neon-pink)]" />
          Releasing Today
        </h1>

        {/* Filters */}
        <div className="flex bg-[var(--color-surface)] rounded-lg p-1 glass-panel">
          {['all', 'movie', 'tv', 'anime'].map(type => (
            <button 
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-colors ${
                filter === type ? 'bg-[var(--color-electric-cyan)] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-pulse">
          {[...Array(12)].map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {data.map((item) => (
            <div key={item.externalId} className="group cursor-pointer flex flex-col">
              <div className="relative rounded-xl overflow-hidden aspect-[2/3] mb-3 transition-transform duration-300 group-hover:scale-105 shadow-lg group-hover:neon-border">
                {item.poster ? (
                  <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center text-xs text-gray-500">No Image</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white fill-white/80" />
                </div>
              </div>
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">
                {item.title}
              </h3>
              <p className="text-[10px] text-[var(--color-text-secondary)] capitalize mt-0.5 flex items-center justify-between">
                <span>{item.type}</span>
                {item.rating && <span className="text-yellow-400 font-bold">★ {item.rating.toFixed(1)}</span>}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {!loading && data.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No content found releasing today for this category.
        </div>
      )}
    </div>
  );
};

export default Ongoing;
