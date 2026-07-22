import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Edit3, MessageSquare, Grid, Library, Clock, LogOut, Heart } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Profile = () => {
  const { token, handleLogout } = useOutletContext();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('watchlater');
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  
  const [userProfile, setUserProfile] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const fetchProfileAndData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch User Profile (fully populated watched/watchLater lists)
        const profileRes = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserProfile(profileData);
          setUsernameInput(profileData.username);
        } else {
          const errData = await profileRes.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to load profile (${profileRes.status})`);
        }

        // Fetch User Reviews
        const reviewsRes = await fetch(`${API_URL}/reviews/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setUserReviews(reviewsData);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err.message || 'Something went wrong loading your profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndData();
  }, [token, navigate]);

  const handleEditToggle = async () => {
    if (isEditing) {
      // Save changes to backend
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ username: usernameInput })
        });
        if (res.ok) {
          const updatedUser = await res.json();
          setUserProfile(prev => ({ ...prev, username: updatedUser.username }));
          // Update localStorage
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          savedUser.username = updatedUser.username;
          localStorage.setItem('user', JSON.stringify(savedUser));
          window.dispatchEvent(new Event('auth-change'));
        }
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
    setIsEditing(!isEditing);
  };

  const onLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-white">Loading your profile...</div>;
  }

  if (!userProfile) {
    return (
      <div className="pb-20 max-w-6xl mx-auto mt-4">
        <div className="glass-panel rounded-3xl p-12 text-center">
          <UserIcon className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-3">Unable to Load Profile</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {error || 'We couldn\'t load your profile. Your session may have expired.'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[var(--color-electric-cyan)] text-white font-bold rounded-xl hover:opacity-90 transition-all"
            >
              Retry
            </button>
            <button
              onClick={() => {
                handleLogout();
                navigate('/');
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
            >
              Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-6xl mx-auto mt-4">
      
      {/* Top Profile Header */}
      <div className="relative glass-panel rounded-3xl p-8 mb-10 overflow-hidden neon-border">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-anime-purple)]/20 to-[var(--color-electric-cyan)]/10" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          
          {/* Profile Picture */}
          <div className="relative group w-32 h-32 flex-shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 bg-[var(--color-surface)] flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.3)]">
              {userProfile.profilePic ? (
                <img src={userProfile.profilePic} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <UserIcon className="w-16 h-16 text-gray-500" />
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="flex flex-col gap-3 max-w-sm mx-auto md:mx-0">
                <input 
                  type="text" 
                  value={usernameInput} 
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="bg-black/50 border border-[var(--color-electric-cyan)] rounded-lg px-4 py-2 text-xl font-bold text-white focus:outline-none"
                />
                <button onClick={handleEditToggle} className="bg-[var(--color-electric-cyan)] text-white font-bold py-2 rounded-lg">Save Changes</button>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-black text-white mb-2 tracking-wide text-gradient">{userProfile.username}</h1>
                <p className="text-[var(--color-text-secondary)] font-semibold mb-4">{userProfile.email}</p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <button onClick={handleEditToggle} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                  <button onClick={onLogoutClick} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-bold transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="hidden lg:flex gap-6 border-l border-white/10 pl-8">
             <div className="text-center">
               <div className="text-3xl font-black text-white">{userReviews.length}</div>
               <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">Reviews</div>
             </div>
             <div className="text-center">
               <div className="text-3xl font-black text-[var(--color-neon-pink)]">{(userProfile.watched || []).length}</div>
               <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">Watched</div>
             </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('watchlater')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'watchlater' ? 'text-[var(--color-electric-cyan)] border-[var(--color-electric-cyan)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <Clock className="w-4 h-4" /> Watch Later
        </button>
        <button 
          onClick={() => setActiveTab('watched')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'watched' ? 'text-[var(--color-electric-cyan)] border-[var(--color-electric-cyan)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <Library className="w-4 h-4" /> Watched List
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'reviews' ? 'text-[var(--color-neon-pink)] border-[var(--color-neon-pink)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <MessageSquare className="w-4 h-4" /> My Reviews
        </button>
      </div>

      {/* Tab Content Areas */}
      <div className="glass-panel rounded-2xl p-8 min-h-[300px]">
        {activeTab === 'watchlater' && (
          (userProfile.watchLater || []).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {userProfile.watchLater.map(item => (
                <Link to={`/details/${item.source}/${item.externalId}`} key={item._id} className="group flex flex-col gap-2">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group-hover:border-[var(--color-electric-cyan)] transition-colors bg-gray-800">
                    {item.poster ? <img src={item.poster} className="w-full h-full object-cover" alt={item.title} /> : <div className="w-full h-full bg-gray-700"></div>}
                  </div>
                  <h4 className="font-bold text-sm line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">{item.title}</h4>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-[var(--color-electric-cyan)] mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Your Watch Later List is Empty</h3>
              <p className="text-gray-400">Save movies and anime here to watch them when you have time.</p>
            </div>
          )
        )}

        {activeTab === 'watched' && (
          (userProfile.watched || []).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {userProfile.watched.map(item => (
                <Link to={`/details/${item.source}/${item.externalId}`} key={item._id} className="group flex flex-col gap-2">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group-hover:border-[var(--color-electric-cyan)] transition-colors bg-gray-800">
                    {item.poster ? <img src={item.poster} className="w-full h-full object-cover" alt={item.title} /> : <div className="w-full h-full bg-gray-700"></div>}
                  </div>
                  <h4 className="font-bold text-sm line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">{item.title}</h4>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Library className="w-16 h-16 text-[var(--color-electric-cyan)] mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Your Watched List is Empty</h3>
              <p className="text-gray-400">Keep track of movies and anime you've already completed!</p>
            </div>
          )
        )}

        {activeTab === 'reviews' && (
          userReviews.length > 0 ? (
            <div className="space-y-4">
              {userReviews.map(review => {
                let meterColor = 'text-yellow-400';
                if (review.cenifyMeter === 'Must Watch') meterColor = 'text-green-400';
                if (review.cenifyMeter === 'Waste') meterColor = 'text-red-400';

                return (
                  <div key={review._id} className="p-6 bg-black/20 border border-white/5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start">
                    {review.contentId?.poster && (
                      <Link to={`/details/${review.contentId.source}/${review.contentId.externalId}`} className="w-16 flex-shrink-0 rounded-lg overflow-hidden border border-white/10">
                        <img src={review.contentId.poster} className="w-full h-auto" alt="" />
                      </Link>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Link to={`/details/${review.contentId?.source}/${review.contentId?.externalId}`} className="font-bold text-lg text-white hover:text-[var(--color-electric-cyan)] transition-colors">
                            {review.contentId?.title || 'Unknown Title'}
                          </Link>
                          <div className="mt-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${meterColor} border border-current px-2 py-0.5 rounded-full inline-block`}>
                              {review.cenifyMeter}
                            </span>
                          </div>
                        </div>
                        <div className="text-2xl font-black italic text-white/50">{review.worthScore}<span className="text-xs text-white/20">/10</span></div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-[var(--color-neon-pink)] mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No Reviews Yet</h3>
              <p className="text-gray-400">You haven't rated anything. Go to a movie page and drop a Cenify Meter review!</p>
            </div>
          )
        )}
      </div>

    </div>
  );
};

export default Profile;
