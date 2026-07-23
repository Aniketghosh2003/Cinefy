import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';

import API_URL from '../api';

const PersonDetails = () => {
  const { source, id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/person/${source}/${id}`);
        const data = await res.json();
        setPerson(data);
      } catch (error) {
        console.error("Error fetching person:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerson();
  }, [source, id]);

  if (loading) return <div className="p-20 text-center animate-pulse">Loading biography...</div>;
  if (!person) return <div className="p-20 text-center">Person not found.</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto flex flex-col md:flex-row gap-10 mt-10">
      
      {/* Left Sidebar: Profile Pic */}
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="w-64 h-64 md:w-full md:aspect-[2/3] md:h-auto mx-auto rounded-3xl overflow-hidden glass-panel neon-border shadow-2xl bg-gray-800">
          {person.profilePic ? (
            <img src={person.profilePic} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-20 h-20 text-gray-500"/></div>
          )}
        </div>
      </div>

      {/* Right Main Body: Bio & Works */}
      <div className="flex-1">
        <h1 className="text-5xl font-black text-white mb-6 text-gradient">{person.name}</h1>
        
        <h3 className="text-xl font-bold mb-4 text-[var(--color-electric-cyan)]">Biography</h3>
        <p className="text-gray-300 leading-relaxed mb-10 whitespace-pre-line text-sm md:text-base">
          {person.bio || "No biography available for this person."}
        </p>

        <h3 className="text-xl font-bold mb-4 text-[var(--color-neon-pink)]">Known For</h3>
        {person.knownForItems && person.knownForItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {person.knownForItems.map(work => (
              <Link 
                to={`/details/${source}/${work.externalId}?type=${work.type}`} 
                key={`${source}-${work.type}-${work.externalId}`}
                className="glass-panel p-4 rounded-xl flex items-center justify-center text-center hover:neon-border hover:bg-[var(--color-electric-cyan)]/10 transition-all cursor-pointer aspect-square"
              >
                <span className="text-sm font-bold text-white line-clamp-3">{work.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No known works listed.</p>
        )}
      </div>

    </div>
  );
};

export default PersonDetails;
