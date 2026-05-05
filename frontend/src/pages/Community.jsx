import React, { useEffect, useState } from 'react';
import { Library, Plus, Bookmark, Clock, Users } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Community = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'mine', 'watchlater'

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/collections`);
        const json = await res.json();
        setCollections(json);
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, [activeTab]);

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-[var(--color-anime-purple)]" />
          Community Collections
        </h1>

        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-electric-cyan)] text-black font-bold rounded-lg hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.4)]">
          <Plus className="w-5 h-5" /> Create List
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'all' ? 'text-[var(--color-anime-purple)] border-[var(--color-anime-purple)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          All Lists
        </button>
        <button 
          onClick={() => setActiveTab('mine')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'mine' ? 'text-[var(--color-anime-purple)] border-[var(--color-anime-purple)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          My Collections
        </button>
        <button 
          onClick={() => setActiveTab('watchlater')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'watchlater' ? 'text-[var(--color-neon-pink)] border-[var(--color-neon-pink)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <Clock className="w-4 h-4" /> Watch Later (Private)
        </button>
      </div>

      {/* Content */}
      {activeTab === 'mine' || activeTab === 'watchlater' ? (
        <div className="text-center py-20 glass-panel rounded-xl">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Please Login to View</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">Authentication is required to view your personal {activeTab === 'watchlater' ? 'Watch Later' : 'Collections'}.</p>
          <button className="px-6 py-2 bg-[var(--color-electric-cyan)] text-black font-bold rounded-lg">Login</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-2xl"></div>)}
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div key={col._id} className="glass-panel p-5 rounded-2xl group hover:border-[var(--color-anime-purple)]/50 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-black text-white group-hover:text-[var(--color-anime-purple)] transition-colors line-clamp-1">{col.name}</h3>
                <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-[var(--color-text-secondary)] flex items-center gap-1">
                  <Library className="w-3 h-3" /> {col.items?.length || 0}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 h-10">
                {col.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>By {col.user?.username || 'Anonymous'}</span>
                <span className="flex items-center gap-1 text-[var(--color-neon-pink)]">
                   ♥ {col.likes?.length || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          No collections found. Be the first to create a custom list like "Best Horror of 2024"!
        </div>
      )}
    </div>
  );
};

export default Community;
