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
