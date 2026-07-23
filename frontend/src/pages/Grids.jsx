import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Grid as GridIcon, Plus, Heart, X, Search, Trash2 } from 'lucide-react';

import API_URL from '../api';

const Grids = () => {
  const { token, triggerLogin, showToast } = useOutletContext();
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'mine'
  const [likedGridIds, setLikedGridIds] = useState(new Set());

  // Create Grid Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gridTitle, setGridTitle] = useState('');
  const [selectedItems, setSelectedItems] = useState(Array(9).fill(null));
  const [activeSlot, setActiveSlot] = useState(null); // which slot (0-8) is being filled
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchGrids = async () => {
    try {
      setLoading(true);
      if (activeTab === 'all') {
        const res = await fetch(`${API_URL}/grids`);
        const json = await res.json();
        setGrids(json);
      } else if (activeTab === 'mine' && token) {
        const res = await fetch(`${API_URL}/grids/mine`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setGrids(json);
      }
    } catch (error) {
      console.error("Error fetching grids:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's liked grids
  const fetchUserLikes = async () => {
    if (!token) {
      setLikedGridIds(new Set());
      return;
    }
    try {
      const res = await fetch(`${API_URL}/grids/my-likes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const ids = await res.json();
        setLikedGridIds(new Set(ids));
      }
    } catch (error) {
      console.error("Error fetching liked grids:", error);
    }
  };

  useEffect(() => {
    fetchGrids();
  }, [activeTab, token]);

  useEffect(() => {
    fetchUserLikes();
  }, [token]);

  // Toggle like on a grid with optimistic UI
  const handleToggleLike = async (gridId) => {
    if (!token) {
      triggerLogin();
      return;
    }

    const isLiked = likedGridIds.has(gridId);

    // Optimistic update
    setLikedGridIds(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(gridId);
      } else {
        next.add(gridId);
      }
      return next;
    });

    setGrids(prev => prev.map(g => {
      if (g._id === gridId) {
        return { ...g, likesCount: (g.likesCount || 0) + (isLiked ? -1 : 1) };
      }
      return g;
    }));

    try {
      const res = await fetch(`${API_URL}/grids/${gridId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Like toggle failed');
      }
      if (showToast) {
        showToast(isLiked ? 'Removed like' : 'Liked! ❤️', isLiked ? 'info' : 'success');
      }
    } catch (error) {
      console.error("Like toggle error:", error);
      // Revert optimistic update on failure
      setLikedGridIds(prev => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(gridId);
        } else {
          next.delete(gridId);
        }
        return next;
      });
      setGrids(prev => prev.map(g => {
        if (g._id === gridId) {
          return { ...g, likesCount: (g.likesCount || 0) + (isLiked ? 1 : -1) };
        }
        return g;
      }));
    }
  };

  // Search for content to add to grid
  const handleSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/content/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.slice(0, 12));
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (activeSlot === null) return;
    const timeout = setTimeout(() => handleSearch(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, activeSlot]);

  const handleSelectItem = (item) => {
    if (activeSlot === null) return;
    const newItems = [...selectedItems];
    newItems[activeSlot] = item;
    setSelectedItems(newItems);
    setActiveSlot(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems[index] = null;
    setSelectedItems(newItems);
  };

  const handleCreateGrid = async (e) => {
    e.preventDefault();
    if (!token) {
      triggerLogin();
      return;
    }
    
    const filledItems = selectedItems.filter(Boolean);
    if (filledItems.length !== 9) {
      setCreateError(`Please fill all 9 slots. You have ${filledItems.length}/9 selected.`);
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      // First, ensure all items are cached in DB by fetching their details
      // This gives us the MongoDB _id for each item
      const itemIds = await Promise.all(
        selectedItems.map(async (item) => {
          if (item._id) return item._id; // Already has a DB id
          // Fetch details to trigger lazy caching
          const typeParam = item.type ? `?type=${encodeURIComponent(item.type)}` : '';
          const detailRes = await fetch(`${API_URL}/content/details/${item.source}/${item.externalId}${typeParam}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            return detailData._id;
          }
          throw new Error(`Failed to cache item: ${item.title}`);
        })
      );

      const res = await fetch(`${API_URL}/grids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: gridTitle,
          items: itemIds
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create grid');
      }
      // Reset and close modal
      setShowCreateModal(false);
      setGridTitle('');
      setSelectedItems(Array(9).fill(null));
      setActiveSlot(null);
      setSearchQuery('');
      setSearchResults([]);
      // Refresh grids
      fetchGrids();
      if (showToast) showToast('Grid published! 🎬', 'success');
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setGridTitle('');
    setSelectedItems(Array(9).fill(null));
    setActiveSlot(null);
    setSearchQuery('');
    setSearchResults([]);
    setCreateError('');
  };

  const showLoginPrompt = activeTab === 'mine' && !token;

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <GridIcon className="w-8 h-8 text-[var(--color-electric-cyan)]" />
          Community 3x3 Grids
        </h1>

        {token && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-neon-pink)] text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,42,95,0.4)] cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Create Grid
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === 'all' ? 'text-[var(--color-electric-cyan)] border-[var(--color-electric-cyan)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          All Grids
        </button>
        <button 
          onClick={() => setActiveTab('mine')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === 'mine' ? 'text-[var(--color-electric-cyan)] border-[var(--color-electric-cyan)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          My Grids
        </button>
      </div>

      {/* Content */}
      {showLoginPrompt ? (
        <div className="text-center py-20 glass-panel rounded-xl">
          <GridIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Please Login to View</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">Authentication is required to view or create your ultimate 3x3 favorites matrix!</p>
          <button onClick={triggerLogin} className="px-6 py-2 bg-[var(--color-neon-pink)] text-white font-bold rounded-lg cursor-pointer">Login</button>
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
                  <h3 className="font-bold text-white truncate">{grid.title || grid.name}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">by {grid.userId?.username || grid.user?.username || 'Anonymous'}</p>
                </div>
                {/* Interactive Like Button */}
                <button
                  onClick={() => handleToggleLike(grid._id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer border ${
                    likedGridIds.has(grid._id)
                      ? 'bg-[var(--color-neon-pink)]/20 text-[var(--color-neon-pink)] border-[var(--color-neon-pink)]/40 shadow-[0_0_12px_rgba(255,42,95,0.25)]'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-[var(--color-neon-pink)] hover:border-[var(--color-neon-pink)]/30 hover:bg-[var(--color-neon-pink)]/10'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 transition-all duration-300 ${likedGridIds.has(grid._id) ? 'fill-[var(--color-neon-pink)] scale-110' : ''}`} />
                  <span>{grid.likesCount || 0}</span>
                </button>
              </div>
              
              {/* 3x3 Grid Layout */}
              <div className="grid grid-cols-3 gap-1 aspect-square rounded-xl overflow-hidden border border-white/5 bg-black/20">
                {(grid.items || []).map((item, index) => (
                  <div key={index} className="aspect-square bg-gray-800 border border-white/5 relative overflow-hidden group/item">
                    {item ? (
                      <img src={item.poster} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform" alt={item.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">-</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          No grids found. {activeTab === 'mine' ? "You haven't created a grid yet!" : "Be the first to share your 3x3 grid favorites matrix!"}
        </div>
      )}

      {/* Create Grid Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl overflow-hidden shadow-2xl p-8 border border-white/10 max-h-[90vh] overflow-y-auto hide-scrollbar">
            {/* Close Button */}
            <button 
              onClick={resetModal}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-wide mb-1 text-gradient">CREATE 3×3 GRID</h2>
              <p className="text-sm text-[var(--color-text-secondary)] font-semibold">Pick your 9 favorites to share with the community</p>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-crimson)]/20 border border-[var(--color-crimson)]/50 text-red-200 text-sm font-semibold text-center">
                {createError}
              </div>
            )}

            {/* Grid Title */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Grid Title</label>
              <input 
                type="text"
                required
                placeholder="e.g. My Top 9 Anime of All Time"
                value={gridTitle}
                onChange={(e) => setGridTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold"
              />
            </div>

            {/* 3x3 Grid Slots */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Select 9 Items ({selectedItems.filter(Boolean).length}/9)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {selectedItems.map((item, index) => (
                  <div 
                    key={index}
                    onClick={() => { 
                      if (!item) {
                        setActiveSlot(index);
                        setSearchQuery('');
                        setSearchResults([]);
                      }
                    }}
                    className={`aspect-square rounded-xl border-2 border-dashed overflow-hidden relative cursor-pointer transition-all group/slot ${
                      activeSlot === index 
                        ? 'border-[var(--color-electric-cyan)] bg-[var(--color-electric-cyan)]/10' 
                        : item 
                          ? 'border-white/10 bg-gray-800' 
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    {item ? (
                      <>
                        <img src={item.poster} className="w-full h-full object-cover" alt={item.title} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveItem(index); }}
                            className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                          <p className="text-[10px] font-bold text-white truncate">{item.title}</p>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                        <Plus className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Slot {index + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Search Panel (shown when a slot is active) */}
            {activeSlot !== null && (
              <div className="mb-6 p-4 glass-panel rounded-2xl border border-[var(--color-electric-cyan)]/30">
                <p className="text-xs font-bold text-[var(--color-electric-cyan)] uppercase tracking-wider mb-3">
                  Search for Slot {activeSlot + 1}
                </p>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Search movies, anime, shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-electric-cyan)] transition-all font-semibold text-sm"
                  />
                </div>
                {searching && <p className="text-xs text-gray-500 animate-pulse mb-2">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto hide-scrollbar">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.source}-${result.externalId}`}
                        onClick={() => handleSelectItem(result)}
                        className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group/result"
                      >
                        <div className="aspect-[2/3] w-full rounded-lg overflow-hidden border border-white/10 group-hover/result:border-[var(--color-electric-cyan)] transition-colors bg-gray-800">
                          {result.poster ? (
                            <img src={result.poster} className="w-full h-full object-cover" alt={result.title} />
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 text-[8px]">No img</div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-300 line-clamp-1 text-center w-full">{result.title}</p>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { setActiveSlot(null); setSearchQuery(''); setSearchResults([]); }}
                  className="mt-3 text-xs text-gray-500 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleCreateGrid}
              disabled={creating || selectedItems.filter(Boolean).length !== 9 || !gridTitle.trim()}
              className="w-full py-3.5 rounded-xl bg-[var(--color-neon-pink)] text-white hover:bg-[var(--color-neon-pink)]/80 font-black text-md transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,42,95,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {creating ? 'Creating...' : 'PUBLISH GRID'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grids;
