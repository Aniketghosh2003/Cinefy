import React from 'react';
import { Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GENRES = [
  { name: 'Action', color: 'from-red-500 to-orange-500', emoji: '⚔️' },
  { name: 'Comedy', color: 'from-yellow-400 to-amber-600', emoji: '😂' },
  { name: 'Drama', color: 'from-blue-500 to-indigo-600', emoji: '🎭' },
  { name: 'Horror', color: 'from-gray-700 to-black', emoji: '👻' },
  { name: 'Sci-Fi', color: 'from-cyan-400 to-blue-600', emoji: '🚀' },
  { name: 'Romance', color: 'from-pink-400 to-rose-600', emoji: '❤️' },
  { name: 'Thriller', color: 'from-emerald-500 to-teal-700', emoji: '🔪' },
  { name: 'Fantasy', color: 'from-purple-500 to-fuchsia-600', emoji: '✨' },
];

const Genres = () => {
  const navigate = useNavigate();

  const handleGenreClick = (genre) => {
    // Navigate to recommendations page with genre filter pre-filled
    // We would need to parse this in Recommendations.jsx if we used search params,
    // but for now, they can just use the smart filters. Let's assume we implement URL params later.
    navigate(`/recommendations`);
  };

  return (
    <div className="pb-10 max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-white mb-4 flex items-center justify-center gap-3">
          <Tag className="w-10 h-10 text-[var(--color-anime-purple)]" />
          Explore By Genre
        </h1>
        <p className="text-[var(--color-text-secondary)]">Discover content grouped by your favorite categories.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {GENRES.map((genre) => (
          <div 
            key={genre.name}
            onClick={() => handleGenreClick(genre.name)}
            className={`cursor-pointer rounded-2xl h-40 relative overflow-hidden group hover:scale-105 transition-transform shadow-lg`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
              <span className="text-4xl mb-2">{genre.emoji}</span>
              <h3 className="text-xl font-black tracking-wider text-shadow-sm">{genre.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Genres;
