import React, { useState } from 'react';
import { User, Edit3, MessageSquare, Grid, Library, Clock, LogOut } from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('watchlater');
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock User Data for UI demonstration
  const [user, setUser] = useState({
    username: 'AnimeKage_99',
    email: 'kage@example.com',
    profilePic: null,
  });

  const handleEditToggle = () => setIsEditing(!isEditing);

  return (
    <div className="pb-20 max-w-6xl mx-auto mt-4">
      
      {/* Top Profile Header */}
      <div className="relative glass-panel rounded-3xl p-8 mb-10 overflow-hidden neon-border">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-anime-purple)]/20 to-[var(--color-electric-cyan)]/10" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          
          {/* Profile Picture & Edit Overlay */}
          <div className="relative group cursor-pointer w-32 h-32 flex-shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 bg-[var(--color-surface)] flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.3)]">
              {user.profilePic ? (
                <img src={user.profilePic} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User className="w-16 h-16 text-gray-500" />
              )}
            </div>
            {isEditing && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="flex flex-col gap-3 max-w-sm">
                <input 
                  type="text" 
                  value={user.username} 
                  onChange={(e) => setUser({...user, username: e.target.value})}
                  className="bg-black/50 border border-[var(--color-electric-cyan)] rounded-lg px-4 py-2 text-xl font-bold text-white focus:outline-none"
                />
                <button onClick={handleEditToggle} className="bg-[var(--color-electric-cyan)] text-black font-bold py-2 rounded-lg">Save Changes</button>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-black text-white mb-2 tracking-wide text-gradient">{user.username}</h1>
                <p className="text-[var(--color-text-secondary)] font-semibold mb-4">{user.email}</p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <button onClick={handleEditToggle} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-bold transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="hidden lg:flex gap-6 border-l border-white/10 pl-8">
             <div className="text-center">
               <div className="text-3xl font-black text-white">42</div>
               <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">Reviews</div>
             </div>
             <div className="text-center">
               <div className="text-3xl font-black text-[var(--color-neon-pink)]">3</div>
               <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">Grids</div>
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
          onClick={() => setActiveTab('reviews')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'reviews' ? 'text-[var(--color-neon-pink)] border-[var(--color-neon-pink)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <MessageSquare className="w-4 h-4" /> My Reviews
        </button>
        <button 
          onClick={() => setActiveTab('grids')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'grids' ? 'text-[var(--color-anime-purple)] border-[var(--color-anime-purple)]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <Grid className="w-4 h-4" /> My 3x3 Grids
        </button>
        <button 
          onClick={() => setActiveTab('collections')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'collections' ? 'text-white border-white' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <Library className="w-4 h-4" /> My Collections
        </button>
      </div>

      {/* Tab Content Areas (Placeholders for UI completeness) */}
      <div className="glass-panel rounded-2xl p-10 text-center min-h-[300px] flex flex-col items-center justify-center">
        {activeTab === 'watchlater' && (
          <>
            <Clock className="w-16 h-16 text-[var(--color-electric-cyan)] mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Your Watch Later List is Empty</h3>
            <p className="text-gray-400">Save movies and anime here to watch them when you have time.</p>
          </>
        )}
        {activeTab === 'reviews' && (
          <>
            <MessageSquare className="w-16 h-16 text-[var(--color-neon-pink)] mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Reviews Yet</h3>
            <p className="text-gray-400">You haven't rated anything. Go to a movie page and drop a Cenify Meter review!</p>
          </>
        )}
        {activeTab === 'grids' && (
          <>
            <Grid className="w-16 h-16 text-[var(--color-anime-purple)] mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No 3x3 Grids Created</h3>
            <p className="text-gray-400">Show off your ultimate top 9 favorites by creating a grid.</p>
          </>
        )}
        {activeTab === 'collections' && (
          <>
            <Library className="w-16 h-16 text-white mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Collections Found</h3>
            <p className="text-gray-400">Create custom lists like "Best Horror" or "Anime Watch Order".</p>
          </>
        )}
      </div>

    </div>
  );
};

export default Profile;
