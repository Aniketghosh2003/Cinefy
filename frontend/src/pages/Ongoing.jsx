import React, { useEffect, useState } from 'react';
import { Calendar, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const OngoingLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-xl">
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-[rgba(15,17,21,0.72)] px-8 py-10 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(0,229,255,0.35),rgba(212,165,116,0.28))] blur-2xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
          <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-cyan-400 border-r-amber-400 animate-spin" />
          <div className="absolute inset-3 rounded-full border-2 border-dashed border-white/20 animate-[spin_6s_linear_infinite_reverse]" />
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(0,229,255,0.9)]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-300">Loading Cinefy</p>
        <h2 className="mt-2 text-2xl font-black text-white">Fetching today's releases</h2>
        <p className="mt-2 max-w-md text-sm text-gray-300">
          We&apos;re pulling every title releasing today across all categories.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.2s]" />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.1s]" />
          <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
        </div>
      </div>
    </div>
  </div>
);

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
        
        if (Array.isArray(json)) {
          setData(json);
        } else {
          console.error("Ongoing API Error:", json);
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching ongoing:", error);
        setData([]);
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
          Today&apos;s Menu
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
        <OngoingLoader />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {data.map((item) => (
            <Link to={`/details/${item.source}/${item.externalId}`} key={item.externalId} className="group flex flex-col">
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
            </Link>
          ))}
        </div>
      )}
      
      {!loading && data.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No content found for today&apos;s category.
        </div>
      )}
    </div>
  );
};

export default Ongoing;
