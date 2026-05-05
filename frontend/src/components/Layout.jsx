import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Film, Home, Calendar, Grid, Users, Sparkles, Tag, Search, User as UserIcon } from 'lucide-react';

// Custom NavItem that only shows text when active
const NavItem = ({ to, icon: Icon, label }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
          isActive 
            ? 'bg-[var(--color-neon-pink)]/10 text-[var(--color-neon-pink)] neon-border' 
            : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="w-5 h-5 flex-shrink-0" />
          {isActive && (
            <span className="text-sm font-bold whitespace-nowrap animate-fade-in">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

const Layout = () => {
  return (
    <div className="min-h-screen bg-[var(--color-void)] text-white flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-b-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 w-48">
          <Film className="w-8 h-8 text-[var(--color-electric-cyan)]" />
          <Link to="/" className="text-2xl font-black tracking-wider text-gradient hidden sm:block">
            CINEFY
          </Link>
        </div>
        
        {/* The 8 requested navigation items */}
        <nav className="flex items-center justify-center flex-1 gap-2 md:gap-4 overflow-x-auto hide-scrollbar">
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/ongoing" icon={Calendar} label="Releasing Today" />
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
