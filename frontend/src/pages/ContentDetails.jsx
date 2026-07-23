import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useOutletContext } from 'react-router-dom';
import { Play, CheckCircle, Bookmark, Plus, Star, Tv, MessageSquare, X, Pause, Library } from 'lucide-react';

import API_URL from '../api';

const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const ContentDetails = () => {
  const { source, id } = useParams();
  const location = useLocation();
  const contentType = new URLSearchParams(location.search).get('type');

  const { token, user, triggerLogin, showToast } = useOutletContext();

  const [content, setContent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [isPlayingBackground, setIsPlayingBackground] = useState(true);
  const [player, setPlayer] = useState(null);
  const [isModalVideoPlaying, setIsModalVideoPlaying] = useState(true);

  // Lists and reviews status
  const [isWatched, setIsWatched] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [worthScore, setWorthScore] = useState(5);
  const [cenifyMeter, setCenifyMeter] = useState('Worth it');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Collections states
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [userCollections, setUserCollections] = useState([]);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [addingToColLoading, setAddingToColLoading] = useState(false);
  const [collectionError, setCollectionError] = useState('');

  const videoId = content ? getYoutubeId(content.trailer) : null;

  // Dynamic loading of YouTube IFrame API script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    const fetchDetailsAndReviews = async () => {
      try {
        setLoading(true);
        // 1. Fetch content details (this triggers the backend Lazy Caching + Grok AI)
        const detailUrl = contentType
          ? `${API_URL}/content/details/${source}/${id}?type=${encodeURIComponent(contentType)}`
          : `${API_URL}/content/details/${source}/${id}`;

        const contentRes = await fetch(detailUrl);
        const contentData = await contentRes.json();
        setContent(contentData);

        // 2. Fetch reviews if content is cached and has a local MongoDB _id
        if (contentData._id) {
          const reviewRes = await fetch(`${API_URL}/reviews/content/${contentData._id}`);
          if (reviewRes.ok) {
            const reviewData = await reviewRes.json();
            setReviews(reviewData);
          }
        }
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetailsAndReviews();
  }, [source, id, contentType]);

  useEffect(() => {
    let newPlayer = null;
    if (showTrailerModal && videoId) {
      const initPlayer = () => {
        newPlayer = new window.YT.Player('modal-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onStateChange: (event) => {
              // 1 = playing, 2 = paused, 0 = ended
              if (event.data === 1) {
                setIsModalVideoPlaying(true);
              } else if (event.data === 2 || event.data === 0) {
                setIsModalVideoPlaying(false);
              }
            }
          }
        });
        setPlayer(newPlayer);
      };

      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        window.onYouTubeIframeAPIReady = () => {
          initPlayer();
        };
      }
    }

    return () => {
      if (newPlayer && newPlayer.destroy) {
        newPlayer.destroy();
      }
      setPlayer(null);
      setIsModalVideoPlaying(true);
    };
  }, [showTrailerModal, videoId]);

  // Sync isWatched and isWatchLater status
  useEffect(() => {
    if (token && content) {
      const checkUserLists = async () => {
        try {
          const res = await fetch(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const profile = await res.json();
            const hasWatched = (profile.watched || []).some(w => w._id === content._id);
            const hasWatchLater = (profile.watchLater || []).some(w => w._id === content._id);
            setIsWatched(hasWatched);
            setIsWatchLater(hasWatchLater);
          }
        } catch (error) {
          console.error("Error checking user lists:", error);
        }
      };
      checkUserLists();
    } else {
      setIsWatched(false);
      setIsWatchLater(false);
    }
  }, [token, content]);

  const handleToggleWatched = async () => {
    if (!token) {
      triggerLogin();
      return;
    }
    if (!content._id) {
      alert('This content is still loading into our database. Please wait a moment and try again.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/watched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contentId: content._id })
      });
      if (res.ok) {
        // Re-fetch profile to get accurate populated state
        const profileRes = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const hasWatched = (profile.watched || []).some(w => (w._id || w) === content._id);
          const hasWatchLater = (profile.watchLater || []).some(w => (w._id || w) === content._id);
          setIsWatched(hasWatched);
          setIsWatchLater(hasWatchLater);
          if (showToast) {
            showToast(hasWatched ? 'Marked as Watched! 🍿' : 'Removed from Watched', hasWatched ? 'success' : 'info');
          }
        }
      } else {
        const errData = await res.json();
        console.error('Toggle watched failed:', errData.message);
      }
    } catch (error) {
      console.error("Error toggling watched:", error);
    }
  };

  const handleToggleWatchLater = async () => {
    if (!token) {
      triggerLogin();
      return;
    }
    if (!content._id) {
      alert('This content is still loading into our database. Please wait a moment and try again.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/watch-later`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contentId: content._id })
      });
      if (res.ok) {
        // Re-fetch profile to get accurate populated state
        const profileRes = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const hasWatched = (profile.watched || []).some(w => (w._id || w) === content._id);
          const hasWatchLater = (profile.watchLater || []).some(w => (w._id || w) === content._id);
          setIsWatched(hasWatched);
          setIsWatchLater(hasWatchLater);
          if (showToast) {
            showToast(hasWatchLater ? 'Added to Watch Later! 📌' : 'Removed from Watch Later', hasWatchLater ? 'success' : 'info');
          }
        }
      } else {
        const errData = await res.json();
        console.error('Toggle watch later failed:', errData.message);
      }
    } catch (error) {
      console.error("Error toggling watch later:", error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      triggerLogin();
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contentId: content._id,
          worthScore,
          cenifyMeter,
          comment
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit review');
      }

      // Re-fetch reviews to show updated list
      const reviewRes = await fetch(`${API_URL}/reviews/content/${content._id}`);
      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        setReviews(reviewData);
      }

      setShowReviewModal(false);
      setComment('');
      setWorthScore(5);
      setCenifyMeter('Worth it');
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Load user collections when collections modal opens
  useEffect(() => {
    if (showCollectionModal && token) {
      const fetchCollections = async () => {
        try {
          const res = await fetch(`${API_URL}/collections/mine`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserCollections(data);
          }
        } catch (error) {
          console.error("Error loading user collections:", error);
        }
      };
      fetchCollections();
    }
  }, [showCollectionModal, token]);

  const handleAddToCollection = async (collectionId) => {
    setAddingToColLoading(true);
    setCollectionError('');
    try {
      const res = await fetch(`${API_URL}/collections/add-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ collectionId, contentId: content._id })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add item to collection');
      }
      setShowCollectionModal(false);
      alert(`Added to "${data.title}" collection successfully!`);
    } catch (error) {
      setCollectionError(error.message);
    } finally {
      setAddingToColLoading(false);
    }
  };

  const handleCreateCollectionAndAdd = async (e) => {
    e.preventDefault();
    setAddingToColLoading(true);
    setCollectionError('');
    try {
      const res = await fetch(`${API_URL}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newCollectionTitle,
          description: newCollectionDesc,
          items: [content._id],
          isPrivate: false
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create collection');
      }
      setShowCollectionModal(false);
      setNewCollectionTitle('');
      setNewCollectionDesc('');
      alert(`Collection "${data.title}" created and item added!`);
    } catch (error) {
      setCollectionError(error.message);
    } finally {
      setAddingToColLoading(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-white">Loading incredible content...</div>;
  }

  if (!content) return <div className="p-20 text-center text-white">Content not found.</div>;

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`
    : content.trailer;

  return (
    <div className="pb-20">
      {/* 1. TOP SECTION: Trailer & Poster */}
      <div className="relative w-full h-[420px] md:h-[500px] rounded-3xl overflow-hidden mb-10 glass-panel neon-border">
        {content.trailer && isPlayingBackground ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full object-cover opacity-40 z-0 pointer-events-none"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : content.backdrop ? (
          <img src={content.backdrop} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-void)] to-[var(--color-anime-purple)]/20" />
        )}

        {content.trailer && (
          <button
            onClick={() => setIsPlayingBackground(!isPlayingBackground)}
            className="absolute top-6 right-6 z-30 p-3 rounded-full bg-black/60 hover:bg-white hover:text-black text-white transition-all pointer-events-auto border border-white/10 flex items-center justify-center shadow-lg"
            title={isPlayingBackground ? "Pause Background Preview" : "Play Background Preview"}
          >
            {isPlayingBackground ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-void)] via-[var(--color-void)]/60 to-transparent z-10 pointer-events-none" />

        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8 md:p-12 z-20 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-end pointer-events-none">
          {/* Poster - Hidden on mobile screens */}
          <div className="hidden sm:block w-28 md:w-36 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 pointer-events-auto">
            {content.poster ? <img src={content.poster} alt={content.title} className="w-full h-auto object-cover" /> : <div className="w-full aspect-[2/3] bg-gray-800"></div>}
          </div>

          {/* Title & Basic Info - Left aligned */}
          <div className="flex-1 text-left pointer-events-auto w-full">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black mb-2 sm:mb-4 text-white drop-shadow-lg text-left">{content.title}</h1>
            <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-6">
              {content.releaseDate && <span className="bg-white/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">{new Date(content.releaseDate).getFullYear()}</span>}
              {content.ageRating && <span className="border border-gray-500 px-2 py-0.5 rounded text-gray-400">{content.ageRating}</span>}
              {content.country && <span>{content.country}</span>}
              {content.language && content.language.length > 0 && <span>{content.language[0]}</span>}
              <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" /> {content.rating?.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* 2. LEFT MAIN BODY: Overview, Cast, Reviews (70%) */}
        <div className="w-full lg:w-[70%]">
          {/* Action Buttons (Mobile visible, but mainly for Layout flow) */}
          <div className="flex flex-wrap gap-4 mb-10 lg:hidden">
            {content.trailer && (
              <button
                onClick={() => setShowTrailerModal(true)}
                className="flex-1 glass-panel px-4 py-3 rounded-xl hover:bg-[var(--color-neon-pink)] hover:text-white font-bold transition-colors flex items-center justify-center gap-2 border border-[var(--color-neon-pink)]/30 text-white"
              >
                <Play className="w-5 h-5 fill-current" /> Watch Trailer
              </button>
            )}
            <button
              onClick={handleToggleWatched}
              className={`flex-1 glass-panel px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isWatched 
                  ? 'bg-emerald-400/90 text-black border border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
                  : 'text-white hover:bg-emerald-500/20 hover:text-emerald-300'
              }`}
            >
              <CheckCircle className="w-5 h-5" /> {isWatched ? 'Watched ✓' : 'Mark as Watched'}
            </button>
            <button
              onClick={handleToggleWatchLater}
              className={`flex-1 glass-panel px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isWatchLater 
                  ? 'bg-emerald-400/90 text-black border border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
                  : 'text-white hover:bg-[var(--color-neon-pink)]'
              }`}
            >
              <Bookmark className="w-5 h-5" /> {isWatchLater ? 'In Watch Later' : 'Watch Later'}
            </button>
            <button
              onClick={() => {
                if (!token) triggerLogin();
                else setShowCollectionModal(true);
              }}
              className="flex-1 glass-panel px-4 py-3 rounded-xl hover:bg-[var(--color-anime-purple)] hover:text-white font-bold transition-colors flex items-center justify-center gap-2 text-white"
            >
              <Plus className="w-5 h-5" /> Collection
            </button>
          </div>

          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="w-1.5 h-6 bg-[var(--color-electric-cyan)] rounded-full"></span>Synopsis</h3>
          <p className="text-gray-300 leading-relaxed mb-10 text-lg">{content.description || "No overview available."}</p>

          {/* Genre & Mood Chart */}
          <div className="mb-10 p-6 glass-panel rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Categorization</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-400 mr-2">Genres:</span>
              {content.genres?.map(g => <span key={g} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm font-semibold">{g}</span>)}
            </div>
            {content.mood && content.mood.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-400 mr-2">AI Mood:</span>
                {content.mood.map(m => <span key={m} className="px-3 py-1 bg-[var(--color-anime-purple)]/20 text-[var(--color-anime-purple)] rounded-full text-sm font-bold border border-[var(--color-anime-purple)]/30">{m}</span>)}
              </div>
            )}
          </div>

          {/* Cast */}
          {content.cast && content.cast.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><span className="w-1.5 h-6 bg-[var(--color-electric-cyan)] rounded-full"></span>Top Cast</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                {content.cast.slice(0, 10).map(person => (
                  <Link to={`/person/${content.source}/${person.externalId}`} key={person.externalId} className="min-w-[120px] w-[120px] snap-start group">
                    <div className="w-full aspect-square rounded-full overflow-hidden mb-3 border-2 border-white/10 group-hover:border-[var(--color-electric-cyan)] transition-colors bg-gray-800">
                      {person.profilePic && <img src={person.profilePic} className="w-full h-full object-cover" alt={person.name} />}
                    </div>
                    <p className="font-bold text-sm text-center line-clamp-1">{person.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews & Cenify Meter */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-[var(--color-neon-pink)]" />
                Community Reviews
              </h3>
              <button
                onClick={() => {
                  if (!token) triggerLogin();
                  else setShowReviewModal(true);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors cursor-pointer text-white"
              >
                Write Review
              </button>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(review => {
                  // Determine Cenify Meter color
                  let meterColor = 'text-yellow-400';
                  if (review.cenifyMeter === 'Must Watch') meterColor = 'text-green-400';
                  if (review.cenifyMeter === 'Waste') meterColor = 'text-red-400';

                  return (
                    <div key={review._id} className="p-6 glass-panel rounded-2xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold">{review.userId?.username || 'Anonymous'}</p>
                          <p className={`text-xs font-black uppercase tracking-wider ${meterColor} mt-1 border border-current px-2 py-0.5 rounded-full inline-block`}>
                            {review.cenifyMeter}
                          </p>
                        </div>
                        <div className="text-3xl font-black italic text-white/50">{review.worthScore}<span className="text-lg text-white/20">/10</span></div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-10 glass-panel rounded-2xl">
                <p className="text-gray-400 mb-4">No reviews yet.</p>
                <button
                  onClick={() => {
                    if (!token) triggerLogin();
                    else setShowReviewModal(true);
                  }}
                  className="px-6 py-2 bg-[var(--color-neon-pink)] text-white font-bold rounded-lg shadow-[0_0_15px_rgba(255,42,95,0.4)] cursor-pointer"
                >
                  Be the first to rate!
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. RIGHT SIDEBAR: Actions & Platforms */}
        <div className="w-full lg:w-[30%] flex-shrink-0 flex flex-col gap-6">

          {/* Action Buttons (Desktop) */}
          <div className="hidden lg:flex flex-col gap-3 sticky top-24">
            {content.trailer && (
              <button
                onClick={() => setShowTrailerModal(true)}
                className="w-full glass-panel px-6 py-4 rounded-xl hover:bg-[var(--color-neon-pink)] hover:text-white font-black transition-colors flex items-center justify-center gap-3 text-lg border border-[var(--color-neon-pink)]/30 text-white"
              >
                <Play className="w-6 h-6 fill-current" /> Watch Trailer
              </button>
            )}
            <button
              onClick={handleToggleWatched}
              className={`w-full glass-panel px-6 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-3 text-lg cursor-pointer ${
                isWatched 
                  ? 'bg-emerald-400/90 text-black border border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.5)]' 
                  : 'text-white hover:bg-emerald-500/20 hover:text-emerald-300'
              }`}
            >
              <CheckCircle className="w-6 h-6" /> {isWatched ? 'Watched ✓' : 'Mark as Watched'}
            </button>
            <button
              onClick={handleToggleWatchLater}
              className={`w-full glass-panel px-6 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-3 text-lg cursor-pointer ${
                isWatchLater 
                  ? 'bg-emerald-400/90 text-black border border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.5)]' 
                  : 'text-white hover:bg-[var(--color-neon-pink)]'
              }`}
            >
              <Bookmark className="w-6 h-6" /> {isWatchLater ? 'In Watch Later' : 'Watch Later'}
            </button>
            <button
              onClick={() => {
                if (!token) triggerLogin();
                else setShowCollectionModal(true);
              }}
              className="w-full glass-panel px-6 py-4 rounded-xl hover:bg-[var(--color-anime-purple)] hover:text-white font-black transition-colors flex items-center justify-center gap-3 text-lg text-white"
            >
              <Plus className="w-6 h-6" /> Add to Collection
            </button>

            {/* Streaming Platforms */}
            {content.platforms && content.platforms.length > 0 && (
              <div className="mt-8 p-6 glass-panel rounded-2xl neon-border border-[var(--color-anime-purple)]">
                <h4 className="font-bold mb-4 flex items-center gap-2"><Tv className="w-5 h-5 text-[var(--color-anime-purple)]" /> Available On</h4>
                <div className="flex flex-wrap gap-2">
                  {content.platforms.map(p => <span key={p} className="px-3 py-1 bg-white/10 rounded text-sm font-semibold">{p}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Trailer Modal Overlay */}
      {showTrailerModal && videoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowTrailerModal(false);
                setIsModalVideoPlaying(true);
              }}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-all shadow-lg border border-white/10"
              aria-label="Close trailer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* The YouTube Player element */}
            <div id="modal-player" className="w-full h-full"></div>

            {/* Custom Overlay to block "More Videos" on pause/end */}
            {!isModalVideoPlaying && (
              <div
                onClick={() => {
                  if (player && player.playVideo) {
                    player.playVideo();
                  }
                }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs cursor-pointer group transition-all"
              >
                {/* Background preview image if poster is available */}
                {content.backdrop && (
                  <img src={content.backdrop} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />
                )}
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-[var(--color-neon-pink)] flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,42,95,0.6)] group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 fill-current ml-1" />
                  </div>
                  <span className="text-xl font-bold tracking-wide text-white drop-shadow-md">Click to Resume Trailer</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Form Modal Overlay */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl p-8 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 cursor-pointer animate-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-wide mb-1 text-gradient">WRITE REVIEW</h2>
              <p className="text-sm text-[var(--color-text-secondary)] font-semibold">Share your experience with the community</p>
            </div>

            {reviewError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-crimson)]/20 border border-[var(--color-crimson)]/50 text-red-200 text-sm font-semibold text-center">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Worth Score Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Worth Score ({worthScore}/10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={worthScore}
                  onChange={(e) => setWorthScore(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
                <div className="flex justify-between text-xs text-gray-500 font-semibold px-1 mt-1">
                  <span>1 (Waste)</span>
                  <span>5 (Decent)</span>
                  <span>10 (Masterpiece)</span>
                </div>
              </div>

              {/* Cenify Meter Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cenify Meter</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Must Watch', 'Worth it', 'Waste'].map(item => {
                    let activeStyle = '';
                    if (cenifyMeter === item) {
                      if (item === 'Must Watch') activeStyle = 'bg-green-500/20 text-green-400 border-green-500/50';
                      if (item === 'Worth it') activeStyle = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
                      if (item === 'Waste') activeStyle = 'bg-red-500/20 text-red-400 border-red-500/50';
                    } else {
                      activeStyle = 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10';
                    }

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCenifyMeter(item)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${activeStyle}`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Review Comment</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Tell us what you liked or disliked about this..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3.5 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] font-black text-md transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,165,116,0.25)] disabled:opacity-50 mt-6 cursor-pointer"
              >
                {submittingReview ? 'Submitting...' : 'SUBMIT REVIEW'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Collections Modal Overlay */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl overflow-hidden shadow-2xl p-8 border border-white/10 flex flex-col md:flex-row gap-8 max-h-[90vh]">

            {/* Close Button */}
            <button
              onClick={() => setShowCollectionModal(false)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Add to existing collection */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-xl font-black text-white mb-4 tracking-wide text-gradient">MY COLLECTIONS</h3>

              {collectionError && (
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-crimson)]/20 border border-[var(--color-crimson)]/50 text-red-200 text-sm font-semibold text-center">
                  {collectionError}
                </div>
              )}

              {userCollections.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 hide-scrollbar">
                  {userCollections.map(col => (
                    <button
                      key={col._id}
                      disabled={addingToColLoading}
                      onClick={() => handleAddToCollection(col._id)}
                      className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex justify-between items-center group cursor-pointer disabled:opacity-50"
                    >
                      <div>
                        <h4 className="font-bold text-white group-hover:text-[var(--color-electric-cyan)] transition-colors">{col.title}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{col.items?.length || 0} items</p>
                      </div>
                      <span className="text-gray-500 group-hover:text-white text-lg font-bold">+</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-6">
                  <Library className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">You haven't created any collections yet.</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-white/10 self-stretch" />

            {/* Right: Create new collection */}
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-xl font-black text-white mb-4 tracking-wide text-gradient">NEW COLLECTION</h3>
              <form onSubmit={handleCreateCollectionAndAdd} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Collection Name (e.g. Best Sci-Fi)"
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold"
                  />
                </div>
                <div>
                  <textarea
                    rows="3"
                    placeholder="Description (Optional)"
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingToColLoading}
                  className="w-full py-3.5 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] font-black text-md transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,165,116,0.2)] disabled:opacity-50 cursor-pointer"
                >
                  {addingToColLoading ? 'Saving...' : 'CREATE & ADD'}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDetails;
