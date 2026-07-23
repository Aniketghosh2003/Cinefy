import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Library, Plus, Bookmark, Clock, Users, X } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Community = () => {
  const { token, triggerLogin } = useOutletContext();
  const [collections, setCollections] = useState([]);
  const [watchLaterItems, setWatchLaterItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'mine', 'watchlater'

  // Create Collection Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'all') {
        const res = await fetch(`${API_URL}/collections`);
        const json = await res.json();
        setCollections(json);
      } else if (activeTab === 'mine' && token) {
        const res = await fetch(`${API_URL}/collections/mine`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setCollections(json);
      } else if (activeTab === 'watchlater' && token) {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setWatchLaterItems(json.watchLater || []);
      }
    } catch (error) {
      console.error("Error fetching collections/data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, token]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!token) {
      triggerLogin();
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch(`${API_URL}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          items: [],
          isPrivate: newIsPrivate
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create collection');
      }
      // Reset and close modal
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewIsPrivate(false);
      // Refresh collections
      fetchData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const showLoginPrompt = (activeTab === 'mine' || activeTab === 'watchlater') && !token;

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-[var(--color-anime-purple)]" />
          Community Collections
        </h1>

        {token && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-anime-purple)] text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-[0_0_15px_rgba(138,43,226,0.4)] cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Create List
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === 'all' ? 'text-[var(--color-anime-purple)] border-[var(--color-anime-purple)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          All Lists
        </button>
        <button 
          onClick={() => setActiveTab('mine')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === 'mine' ? 'text-[var(--color-anime-purple)] border-[var(--color-anime-purple)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          My Collections
        </button>
        <button 
          onClick={() => setActiveTab('watchlater')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === 'watchlater' ? 'text-[var(--color-neon-pink)] border-[var(--color-neon-pink)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <Clock className="w-4 h-4" /> Watch Later (Private)
        </button>
      </div>

      {/* Content */}
      {showLoginPrompt ? (
        <div className="text-center py-20 glass-panel rounded-xl">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Please Login to View</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">Authentication is required to view your personal {activeTab === 'watchlater' ? 'Watch Later list' : 'Collections'}.</p>
          <button onClick={triggerLogin} className="px-6 py-2 bg-[var(--color-anime-purple)] text-white font-bold rounded-lg cursor-pointer">Login</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-2xl"></div>)}
        </div>
      ) : activeTab === 'watchlater' ? (
        watchLaterItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {watchLaterItems.map((item, idx) => (
              <Link to={`/details/${item.source}/${item.externalId}`} key={`${item._id || item.externalId}-${idx}`} className="group flex flex-col gap-2">
                <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group-hover:border-[var(--color-electric-cyan)] transition-colors bg-gray-800">
                  {item.poster ? <img src={item.poster} className="w-full h-full object-cover" alt={item.title} /> : <div className="w-full h-full bg-gray-700"></div>}
                </div>
                <h4 className="font-bold text-sm line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">{item.title}</h4>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            Your Watch Later list is empty. Add titles to watch later from their details page!
          </div>
        )
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link 
              key={col._id} 
              to={`/collection/${col._id}`}
              className="glass-panel p-5 rounded-2xl group hover:border-[var(--color-anime-purple)]/55 transition-all hover:scale-[1.02] cursor-pointer block"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-black text-white group-hover:text-[var(--color-anime-purple)] transition-colors line-clamp-1">{col.title}</h3>
                <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-[var(--color-text-secondary)] flex items-center gap-1 shrink-0">
                  <Library className="w-3 h-3" /> {col.items?.length || 0}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 h-10">
                {col.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>By {col.userId?.username || 'Anonymous'}</span>
                <span className="flex items-center gap-1 text-[var(--color-neon-pink)]">
                   ♥ {col.likesCount || 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          No collections found. Be the first to create a custom list like "Best Horror of 2024"!
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl p-8 border border-white/10">
            {/* Close Button */}
            <button 
              onClick={() => { setShowCreateModal(false); setCreateError(''); }}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-wide mb-1 text-gradient">CREATE COLLECTION</h2>
              <p className="text-sm text-[var(--color-text-secondary)] font-semibold">Build your own curated list of favorites</p>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-crimson)]/20 border border-[var(--color-crimson)]/50 text-red-200 text-sm font-semibold text-center">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Collection Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Best Sci-Fi Movies"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea 
                  rows="3"
                  placeholder="Tell others what this list is about..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNewIsPrivate(!newIsPrivate)}
                  className={`w-12 h-7 rounded-full transition-all flex items-center px-1 cursor-pointer ${newIsPrivate ? 'bg-[var(--color-neon-pink)] justify-end' : 'bg-white/10 justify-start'}`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transition-all" />
                </button>
                <span className="text-sm font-semibold text-gray-300">Private Collection</span>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 rounded-xl bg-[var(--color-anime-purple)] text-white hover:bg-[var(--color-anime-purple)]/80 font-black text-md transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(138,43,226,0.3)] disabled:opacity-50 mt-4 cursor-pointer"
              >
                {creating ? 'Creating...' : 'CREATE COLLECTION'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
