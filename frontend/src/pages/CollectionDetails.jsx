import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { Library, User as UserIcon, Heart, ArrowLeft, Play, Star, Plus } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const CollectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, triggerLogin, showToast } = useOutletContext();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_URL}/collections/${id}`);
        let data = {};
        try {
          data = await res.json();
        } catch (e) {
          // Response is non-JSON or HTML
        }
        if (!res.ok) {
          throw new Error(data.message || `Collection not found (${res.status})`);
        }
        setCollection(data);
        setLikesCount(data.likesCount || 0);
      } catch (err) {
        console.error("Error fetching collection:", err);
        setError(err.message || 'Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  const handleLike = async () => {
    if (!token) {
      triggerLogin();
      return;
    }
    try {
      const res = await fetch(`${API_URL}/collections/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message === "Liked collection") {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          if (showToast) showToast('Liked collection! ❤️', 'success');
        } else {
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          if (showToast) showToast('Unliked collection', 'info');
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  if (loading) {
    return (
      <div className="pb-20 max-w-6xl mx-auto p-6 animate-pulse text-white text-center">
        Loading collection details...
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="pb-20 max-w-4xl mx-auto mt-8 p-10 text-center glass-panel rounded-3xl">
        <Library className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">Collection Not Found</h2>
        <p className="text-gray-400 mb-6">{error || "The collection you're looking for doesn't exist or is private."}</p>
        <button
          onClick={() => navigate('/community')}
          className="px-6 py-2.5 bg-[var(--color-anime-purple)] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 mx-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </button>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-6xl mx-auto">
      {/* Back Link */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white font-semibold text-sm mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Collection Header Banner */}
      <div className="relative glass-panel rounded-3xl p-8 md:p-10 mb-10 overflow-hidden neon-border border-[var(--color-anime-purple)]/40">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-anime-purple)]/20 via-transparent to-[var(--color-electric-cyan)]/10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[var(--color-anime-purple)]/30 border border-[var(--color-anime-purple)]/50 text-[var(--color-anime-purple)] rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" /> Collection
              </span>
              {collection.isPrivate && (
                <span className="px-3 py-1 bg-white/10 text-gray-400 rounded-full text-xs font-bold">Private</span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide text-gradient">
              {collection.title}
            </h1>
            
            <p className="text-gray-300 leading-relaxed text-base">
              {collection.description || "No description provided."}
            </p>

            <div className="flex items-center gap-4 text-sm font-semibold text-gray-400 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 border border-white/10 flex items-center justify-center">
                  {collection.userId?.profilePic ? (
                    <img src={collection.userId.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span>Created by <strong className="text-white">{collection.userId?.username || 'Anonymous'}</strong></span>
              </div>
              <span>•</span>
              <span>{collection.items?.length || 0} Titles</span>
            </div>
          </div>

          {/* Action Button: Like */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={handleLike}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg cursor-pointer ${
                isLiked 
                  ? 'bg-[var(--color-neon-pink)] text-white border border-[var(--color-neon-pink)] shadow-[0_0_20px_rgba(255,42,95,0.4)]' 
                  : 'glass-panel text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
              <span>{likesCount} Likes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collection Items Grid */}
      <div>
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[var(--color-electric-cyan)] rounded-full"></span>
          Titles in this Collection ({collection.items?.length || 0})
        </h2>

        {collection.items && collection.items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {collection.items.map((item, index) => (
              <Link
                key={item._id ? `${item._id}-${index}` : `${item.source}-${item.type}-${item.externalId}-${index}`}
                to={`/details/${item.source}/${item.externalId}?type=${item.type}`}
                className="group flex flex-col"
              >
                <div className="relative rounded-xl overflow-hidden aspect-[2/3] mb-3 transition-transform duration-300 group-hover:scale-105 shadow-lg group-hover:neon-border bg-gray-800">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Poster</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-white fill-white/80" />
                  </div>
                </div>

                <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">
                  {item.title}
                </h3>
                
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mt-1">
                  <span className="uppercase text-[10px] tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {item.type}
                  </span>
                  {item.rating && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" /> {item.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <Library className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-30" />
            <p className="text-gray-400 font-semibold mb-2">This collection is currently empty.</p>
            <p className="text-xs text-gray-500">You can add titles to your collections directly from any movie/anime details page!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetails;
