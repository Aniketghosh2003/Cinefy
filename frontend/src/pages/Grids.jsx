import React, { useEffect, useState } from 'react';
import { Grid as GridIcon, Plus, Heart } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Grids = () => {
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'mine'

  useEffect(() => {
    const fetchGrids = async () => {
      try {
        setLoading(true);
        // We fetch all grids. If we had authentication, 'mine' would fetch user's grids.
        const res = await fetch(`${API_URL}/grids`);
        const json = await res.json();
        setGrids(json);
      } catch (error) {
        console.error("Error fetching grids:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrids();
  }, [activeTab]);

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <GridIcon className="w-8 h-8 text-[var(--color-electric-cyan)]" />
          Community 3x3 Grids
        </h1>

        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-neon-pink)] text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,42,95,0.4)]">
          <Plus className="w-5 h-5" /> Create Grid
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'all' ? 'text-[var(--color-electric-cyan)] border-[var(--color-electric-cyan)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          All Grids
        </button>
        <button 
          onClick={() => setActiveTab('mine')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'mine' ? 'text-[var(--color-electric-cyan)] border-[var(--color-electric-cyan)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          My Grids
        </button>
      </div>

      {/* Content */}
      {activeTab === 'mine' ? (
        <div className="text-center py-20 glass-panel rounded-xl">
          <GridIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">You haven't created any grids yet</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">Log in to create your ultimate 3x3 favorites matrix!</p>
          <button className="px-6 py-2 bg-[var(--color-electric-cyan)] text-black font-bold rounded-lg">Login to Create</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded-2xl"></div>)}
        </div>
      ) : grids.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {grids.map((grid) => (
            <div key={grid._id} className="glass-panel p-4 rounded-2xl group hover:border-[var(--color-electric-cyan)]/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white truncate">{grid.name}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">by {grid.user?.username || 'Anonymous'}</p>
                </div>
                <div className="flex items-center gap-1 text-[var(--color-neon-pink)] bg-white/5 px-2 py-1 rounded text-xs font-bold">
                  <Heart className="w-3 h-3 fill-[var(--color-neon-pink)]" /> {grid.likes?.length || 0}
                </div>
              </div>
              
              {/* Actual 3x3 Grid Display */}
              <div className="grid grid-cols-3 gap-1 aspect-square rounded-xl overflow-hidden bg-black/50">
                {[...Array(9)].map((_, index) => {
                  const item = grid.items?.[index];
                  return (
                    <div key={index} className="w-full h-full bg-white/5 relative group/item">
                      {item && item.poster ? (
                        <>
                          <img src={item.poster} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-bold text-[var(--color-electric-cyan)]">{item.title}</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600">Empty</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          No grids found in the community yet. Be the first to create one!
        </div>
      )}
    </div>
  );
};

export default Grids;
