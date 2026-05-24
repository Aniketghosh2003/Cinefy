import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Film, Home, Calendar, Grid, Users, Sparkles, Tag, Search, User as UserIcon } from 'lucide-react';

// Custom NavItem that only shows text when active
const NavItem = ({ to, icon: Icon, label }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `group relative self-stretch flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 overflow-hidden ${
          isActive 
            ? 'text-white' 
            : 'text-text-secondary hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="w-5 h-5 shrink-0" />
          <span
            className={`text-sm font-bold whitespace-nowrap transition-all duration-300 ${
              isActive ? 'max-w-40 opacity-100' : 'max-w-0 opacity-0 group-hover:max-w-40 group-hover:opacity-100'
            } overflow-hidden`}
          >
              {label}
          </span>
          <span
            className={`pointer-events-none absolute inset-x-3 bottom-0 h-px rounded-full bg-linear-to-t from-[#2b0a57] via-[#8b5cf6] to-[#ff7ab6] shadow-[0_-1px_10px_rgba(139,92,246,0.45)] transition-all duration-300 ${
              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          />
        </>
      )}
    </NavLink>
  );
};

const Layout = () => {
  return (
    <div className="min-h-screen bg-(--color-void) text-white flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-b-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 w-48">
          <Film className="w-8 h-8 text-(--color-electric-cyan)" />
          <Link to="/" className="text-2xl font-black tracking-wider text-gradient hidden sm:block">
            CINEFY
          </Link>
        </div>
        
        {/* The 8 requested navigation items */}
        <nav className="flex items-center justify-center flex-1 gap-2 md:gap-4 overflow-x-auto hide-scrollbar">
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/ongoing" icon={Calendar} label="Today's Menu" />
          <NavItem to="/grids" icon={Grid} label="3x3" />
          <NavItem to="/community" icon={Users} label="Community" />
          <NavItem to="/recommendations" icon={Sparkles} label="Recommendations" />
          <NavItem to="/genres" icon={Tag} label="Genres" />
          <NavItem to="/search" icon={Search} label="Search" />
        </nav>

        <div className="w-48 flex justify-end">
          <NavItem to="/profile" icon={UserIcon} label="Profile" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
