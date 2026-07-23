import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Film, Home, Calendar, Grid, Users, Sparkles, Tag, Search, User as UserIcon, LogIn, Menu, X } from 'lucide-react';
import AuthModal from './AuthModal';
import { useToast } from './ToastContext';

// Custom NavItem that smoothly reveals text on active or hover with nice ease-in timing
const NavItem = ({ to, icon: Icon, label, onClick }) => {
  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={({ isActive }) => 
        `group relative flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-500 ease-out overflow-hidden ${
          isActive 
            ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
            : 'text-text-secondary hover:text-white hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
          <span
            className={`text-sm font-semibold whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
              isActive 
                ? 'max-w-48 opacity-100 ml-1' 
                : 'max-w-0 opacity-0 group-hover:max-w-48 group-hover:opacity-100 group-hover:ml-1'
            } overflow-hidden`}
          >
            {label}
          </span>
          <span
            className={`pointer-events-none absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-[0_-1px_10px_rgba(139,92,246,0.5)] transition-all duration-500 ease-out ${
              isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50 group-hover:opacity-100 group-hover:scale-x-100'
            }`}
          />
        </>
      )}
    </NavLink>
  );
};

const Layout = () => {
  const { showToast } = useToast();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
      const saved = localStorage.getItem('user');
      setUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, []);

  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser({
      _id: data._id,
      username: data.username,
      email: data.email,
      profilePic: data.profilePic || null
    });
    window.dispatchEvent(new Event('auth-change'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  const triggerLogin = () => {
    setShowAuthModal(true);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navItemsList = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/ongoing", icon: Calendar, label: "Today's Menu" },
    { to: "/grids", icon: Grid, label: "3x3" },
    { to: "/community", icon: Users, label: "Community" },
    { to: "/recommendations", icon: Sparkles, label: "Recommendations" },
    { to: "/genres", icon: Tag, label: "Genres" },
    { to: "/search", icon: Search, label: "Search" },
  ];

  return (
    <div className="min-h-screen bg-(--color-void) text-white flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-b-white/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Film className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--color-electric-cyan,#00e5ff)]" />
          <Link to="/" className="text-xl sm:text-2xl font-black tracking-wider text-gradient">
            CINEFY
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center justify-center flex-1 gap-1.5 xl:gap-3 mx-4">
          {navItemsList.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Desktop Auth / Profile */}
        <div className="hidden lg:flex items-center justify-end gap-2">
          {token ? (
            <NavItem to="/profile" icon={UserIcon} label="Profile" />
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-all border border-white/5 cursor-pointer text-white"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {token ? (
            <Link 
              to="/profile" 
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Profile"
            >
              <UserIcon className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold transition-all text-white flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Login
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300" 
            onClick={closeMobileMenu}
          />

          {/* Drawer Content */}
          <div className="relative mt-[65px] ml-auto w-4/5 max-w-xs h-[calc(100vh-65px)] bg-[#12151c] border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-50 animate-in slide-in-from-right duration-300">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">Navigation</p>
              {navItemsList.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-900/60 to-cyan-900/40 text-white border border-purple-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <IconComponent className="w-5 h-5 text-cyan-400" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {token ? (
                <>
                  <NavLink
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-white transition-all"
                  >
                    <UserIcon className="w-5 h-5 text-purple-400" />
                    <span>View Profile</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold text-white shadow-lg transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Log In / Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6">
        <Outlet context={{ token, user, triggerLogin, handleLogout, showToast }} />
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={handleAuthSuccess}
        showToast={showToast}
      />
    </div>
  );
};

export default Layout;
