import React, { useEffect, useState } from 'react';
import { Megaphone, Flame, Play, Star, CalendarDays, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

// Reusable Horizontal Scroller Component
const ContentScroller = ({ title, icon: Icon, data }) => (
  <section className="mt-12">
    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
      <Icon className="w-5 h-5 text-[var(--color-electric-cyan)]" />
      {title}
    </h2>
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
      {data.map((item) => (
        <Link to={`/details/${item.source}/${item.externalId}`} key={item.externalId} className="min-w-[160px] w-[160px] snap-start group flex flex-col">
          <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-2 transition-transform duration-300 group-hover:scale-105 shadow-lg group-hover:neon-border">
            {item.poster ? (
              <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center text-xs text-gray-500">No Image</div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white/80" />
            </div>
            {item.rating && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-yellow-400">
                ★ {item.rating.toFixed(1)}
              </div>
            )}
          </div>
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">
            {item.title}
          </h3>
          <p className="text-[10px] text-[var(--color-text-secondary)] capitalize mt-0.5">{item.type}</p>
        </Link>
      ))}
    </div>
  </section>
);

const Home = () => {
  const [data, setData] = useState({ trending: [], top: [], ongoing: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendRes, topRes, ongoingRes, upcomingRes] = await Promise.all([
          fetch(`${API_URL}/content/trending`),
          fetch(`${API_URL}/content/top`),
          fetch(`${API_URL}/content/ongoing`),
          fetch(`${API_URL}/content/upcoming`)
        ]);
        
        const safeJson = async (res) => {
          try {
            const data = await res.json();
            return Array.isArray(data) ? data : [];
          } catch (e) {
            return [];
          }
        };

        setData({
          trending: await safeJson(trendRes),
          top: await safeJson(topRes),
          ongoing: await safeJson(ongoingRes),
          upcoming: await safeJson(upcomingRes)
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex gap-8">
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-xl"></div>)}
      </div>
      <div className="w-80 hidden lg:block space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-10">
      
      {/* Left Main Column */}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-white" />
          Talk Of The Town
        </h2>
        
        {/* Trending Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {data.trending.slice(0, 8).map((item) => (
            <Link to={`/details/${item.source}/${item.externalId}`} key={item.externalId} className="group flex flex-col">
              <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-2 transition-transform duration-300 group-hover:scale-105 shadow-lg group-hover:neon-border">
                {item.poster ? (
                  <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center text-xs text-gray-500">No Image</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 text-white fill-white/80" />
                </div>
              </div>
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">
                {item.title}
              </h3>
              <p className="text-[10px] text-[var(--color-text-secondary)] capitalize mt-0.5">{item.type}</p>
            </Link>
          ))}
        </div>

        {/* Releasing Today (Ongoing) */}
        <ContentScroller title="Releasing Today / Ongoing" icon={Clock} data={data.ongoing} />

        {/* Top Rated */}
        <ContentScroller title="All-Time Top Rated" icon={Star} data={data.top} />

        {/* Upcoming */}
        <ContentScroller title="Coming Soon" icon={CalendarDays} data={data.upcoming} />

      </div>

      {/* Right Sidebar Column */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-8">
        
        {/* Banner Ad / Highlight */}
        <div className="relative rounded-xl overflow-hidden glass-panel aspect-[4/3] neon-border p-6 flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-anime-purple)]/20 to-[var(--color-neon-pink)]/20 z-0" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black italic tracking-tighter mb-2 text-white drop-shadow-md">
              CINEFY <span className="text-[var(--color-electric-cyan)]">PREMIUM</span>
            </h3>
            <p className="text-sm font-semibold mb-4 text-white/90">Unlock ad-free streaming & exclusive collections.</p>
            <button className="bg-[var(--color-anime-purple)] text-white text-sm font-bold py-2 px-6 rounded-lg hover:scale-105 transition-transform w-full">
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Most Interested List (Top 5 Trending) */}
        <div className="sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              Most Interested
            </h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {data.trending.slice(0, 5).map((item, index) => (
              <Link to={`/details/${item.source}/${item.externalId}`} key={item.externalId} className="flex items-center gap-4 p-3 rounded-xl glass-panel-hover transition-colors border border-transparent hover:border-white/10 group">
                <div className="text-5xl font-black italic text-white/10 group-hover:text-[var(--color-text-secondary)] transition-colors w-8 text-center -ml-2">
                  {index + 1}
                </div>
                <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-[var(--color-surface)]">
                  {item.poster && <img src={item.poster} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-[var(--color-electric-cyan)] transition-colors">{item.title}</h4>
                  <p className="text-[10px] text-[var(--color-text-secondary)] capitalize mb-1">{item.type}</p>
                  <p className="text-[10px] text-orange-500 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-orange-500" />
                    {item.popularity ? `${(item.popularity / 1000).toFixed(1)}K Interested` : 'Trending'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Home;
