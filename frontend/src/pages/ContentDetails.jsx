import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Play, CheckCircle, Bookmark, Plus, Star, Tv, MessageSquare, X, Pause } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

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
  const [content, setContent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [isPlayingBackground, setIsPlayingBackground] = useState(true);
  const [player, setPlayer] = useState(null);
  const [isModalVideoPlaying, setIsModalVideoPlaying] = useState(true);

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

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-white">Loading incredible content...</div>;
  }

  if (!content) return <div className="p-20 text-center text-white">Content not found.</div>;

  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`
    : content.trailer;

  return (
    <div className="pb-20 max-w-7xl mx-auto">
      {/* 1. TOP SECTION: Trailer & Poster */}
      <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden mb-10 glass-panel neon-border">
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
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 flex flex-col md:flex-row gap-8 items-end pointer-events-none">
          {/* Poster */}
          <div className="w-28 md:w-36 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 hidden sm:block pointer-events-auto">
            {content.poster ? <img src={content.poster} alt={content.title} className="w-full h-auto" /> : <div className="w-full aspect-[2/3] bg-gray-800"></div>}
          </div>
          
          {/* Title & Basic Info */}
          <div className="flex-1 pointer-events-auto">
            <h1 className="text-4xl md:text-6xl font-black mb-4 text-white drop-shadow-lg">{content.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-300 mb-6">
              {content.releaseDate && <span className="bg-white/10 px-3 py-1 rounded-full">{new Date(content.releaseDate).getFullYear()}</span>}
              {content.ageRating && <span className="border border-gray-500 px-2 py-0.5 rounded text-gray-400">{content.ageRating}</span>}
              {content.country && <span>{content.country}</span>}
              {content.language && content.language.length > 0 && <span>{content.language[0]}</span>}
              <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" /> {content.rating?.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* 2. LEFT MAIN BODY: Overview, Cast, Reviews */}
        <div className="flex-1">
          {/* Action Buttons (Mobile visible, but mainly for Layout flow) */}
          <div className="flex flex-wrap gap-4 mb-10 lg:hidden">
             {content.trailer && (
               <button 
                 onClick={() => setShowTrailerModal(true)} 
                 className="flex-1 glass-panel px-4 py-3 rounded-xl hover:bg-[var(--color-neon-pink)] hover:text-white font-bold transition-colors flex items-center justify-center gap-2 border border-[var(--color-neon-pink)]/30 text-white"
               >
                 <Play className="w-5 h-5 fill-current"/> Watch Trailer
               </button>
             )}
             <button className="flex-1 glass-panel px-4 py-3 rounded-xl hover:bg-[var(--color-electric-cyan)] hover:text-black font-bold transition-colors flex items-center justify-center gap-2 text-white"><CheckCircle className="w-5 h-5"/> Watched</button>
             <button className="flex-1 glass-panel px-4 py-3 rounded-xl hover:bg-[var(--color-neon-pink)] hover:text-white font-bold transition-colors flex items-center justify-center gap-2 text-white"><Bookmark className="w-5 h-5"/> Watch Later</button>
             <button className="flex-1 glass-panel px-4 py-3 rounded-xl hover:bg-[var(--color-anime-purple)] hover:text-white font-bold transition-colors flex items-center justify-center gap-2 text-white"><Plus className="w-5 h-5"/> Collection</button>
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
                <span className="text-sm text-gray-400 mr-2">Grok AI Mood:</span>
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
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">Write Review</button>
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
                          <p className="font-bold">{review.user?.username || 'Anonymous'}</p>
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
                <button className="px-6 py-2 bg-[var(--color-neon-pink)] text-white font-bold rounded-lg shadow-[0_0_15px_rgba(255,42,95,0.4)]">Be the first to rate!</button>
              </div>
            )}
          </div>
        </div>

        {/* 3. RIGHT SIDEBAR: Actions & Platforms */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
          
          {/* Action Buttons (Desktop) */}
          <div className="hidden lg:flex flex-col gap-3 sticky top-24">
             {content.trailer && (
               <button 
                 onClick={() => setShowTrailerModal(true)} 
                 className="w-full glass-panel px-6 py-4 rounded-xl hover:bg-[var(--color-neon-pink)] hover:text-white font-black transition-colors flex items-center justify-center gap-3 text-lg border border-[var(--color-neon-pink)]/30 text-white"
               >
                 <Play className="w-6 h-6 fill-current"/> Watch Trailer
               </button>
             )}
             <button className="w-full glass-panel px-6 py-4 rounded-xl hover:bg-[var(--color-electric-cyan)] hover:text-black font-black transition-colors flex items-center justify-center gap-3 text-lg"><CheckCircle className="w-6 h-6"/> Mark as Watched</button>
             <button className="w-full glass-panel px-6 py-4 rounded-xl hover:bg-[var(--color-neon-pink)] hover:text-white font-black transition-colors flex items-center justify-center gap-3 text-lg"><Bookmark className="w-6 h-6"/> Watch Later</button>
             <button className="w-full glass-panel px-6 py-4 rounded-xl hover:bg-[var(--color-anime-purple)] hover:text-white font-black transition-colors flex items-center justify-center gap-3 text-lg"><Plus className="w-6 h-6"/> Add to Collection</button>
             
             {/* Streaming Platforms */}
             {content.platforms && content.platforms.length > 0 && (
               <div className="mt-8 p-6 glass-panel rounded-2xl neon-border border-[var(--color-anime-purple)]">
                 <h4 className="font-bold mb-4 flex items-center gap-2"><Tv className="w-5 h-5 text-[var(--color-anime-purple)]"/> Available On</h4>
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
              onClick={() => setShowTrailerModal(false)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-all shadow-lg border border-white/10"
              aria-label="Close trailer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`} 
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDetails;
