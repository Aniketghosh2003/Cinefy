import React, { useEffect, useState } from 'react';
import { Megaphone, Flame, Play, Star, CalendarDays, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

// Reusable Grid Component
const ContentGridSection = ({ title, icon: Icon, data, limit = 10 }) => (
  <section className="mt-12">
    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
      <Icon className="w-5 h-5 text-[var(--color-electric-cyan)]" />
      {title}
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {data.slice(0, limit).map((item) => (
        <Link to={`/details/${item.source}/${item.externalId}`} key={item.externalId} className="group flex flex-col">
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

const HomeLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-xl">
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-[rgba(15,17,21,0.72)] px-8 py-10 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(0,229,255,0.35),rgba(212,165,116,0.28))] blur-2xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
          <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-[var(--color-electric-cyan)] border-r-[var(--color-accent)] animate-spin" />
          <div className="absolute inset-3 rounded-full border-2 border-dashed border-white/20 animate-[spin_6s_linear_infinite_reverse]" />
          <div className="w-3 h-3 rounded-full bg-[var(--color-electric-cyan)] shadow-[0_0_18px_rgba(0,229,255,0.9)]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">Loading Cinefy</p>
        <h2 className="mt-2 text-2xl font-black text-white">Fetching the latest titles</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
          We&apos;re loading trending, top rated, ongoing, and upcoming content.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-electric-cyan)] animate-bounce [animation-delay:-0.2s]" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.1s]" />
          <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
        </div>
      </div>
    </div>
  </div>
);

const Home = () => {
  const [data, setData] = useState({ trending: [], top: [], ongoing: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [trendRes, topRes, ongoingRes, upcomingRes] = await Promise.allSettled([
          fetch(`${API_URL}/content/trending`),
          fetch(`${API_URL}/content/top`),
          fetch(`${API_URL}/content/ongoing`),
          fetch(`${API_URL}/content/upcoming`)
        ]);
        
        const safeJson = async (result) => {
          try {
            if (result.status !== 'fulfilled' || !result.value.ok) {
              return [];
            }

            const data = await result.value.json();
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
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <HomeLoader />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-10">
      
      {/* Left Main Column */}
      <div className="flex-1 min-w-0 -mt-12">
        {/* Trending Grid */}
        <ContentGridSection title="Trending" icon={Megaphone} data={data.trending} />

        {/* Releasing Today (Ongoing) */}
        <ContentGridSection title="Today's Menu" icon={Clock} data={data.ongoing} />

        {/* Top Rated */}
        <ContentGridSection title="All-Time Top Rated" icon={Star} data={data.top} />

        {/* Upcoming */}
        <ContentGridSection title="Coming Soon" icon={CalendarDays} data={data.upcoming} />

      </div>


      
    </div>
  );
};

export default Home;
