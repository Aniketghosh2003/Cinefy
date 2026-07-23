import React, { useState } from 'react';
import { X, Lock, Mail, User } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

import API_URL from '../api';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        username: data.username,
        email: data.email,
        profilePic: data.profilePic || null
      }));

      if (onAuthSuccess) onAuthSuccess(data);
      if (showToast) showToast(`Welcome, ${data.username}! 🚀`, 'success');
      onClose();
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(err.message || 'Google authentication failed');
      if (showToast) showToast(err.message || 'Google Login Failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin ? { email, password } : { username, email, password };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Save token and user details to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        username: data.username,
        email: data.email,
        profilePic: data.profilePic || null
      }));

      // Call success callback and close modal
      if (onAuthSuccess) onAuthSuccess(data);
      if (showToast) {
        showToast(
          isLogin ? `Welcome back, ${data.username}!` : `Account created! Welcome, ${data.username}!`,
          'success'
        );
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl p-8 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white tracking-wide mb-2 text-gradient">
            {isLogin ? 'WELCOME BACK' : 'JOIN CINEFY'}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] font-semibold">
            {isLogin ? 'Log in to rate, review, and track content!' : 'Create an account to start your journey!'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-crimson)]/20 border border-[var(--color-crimson)]/50 text-red-200 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* Google OAuth Login */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google Authentication Failed');
              if (showToast) showToast('Google Authentication Failed', 'error');
            }}
            theme="filled_black"
            shape="pill"
            text={isLogin ? "signin_with" : "signup_with"}
          />
          <div className="relative w-full flex items-center justify-center mt-6">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#171a21] px-3 text-xs uppercase tracking-widest text-gray-500 font-bold shrink-0">
              Or with email
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="email" 
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="password" 
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-all font-semibold"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] font-black text-lg transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,165,116,0.3)] disabled:opacity-50 mt-6 cursor-pointer"
          >
            {loading ? 'Please wait...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-sm font-semibold">
          <span className="text-gray-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-[var(--color-accent)] hover:underline ml-1 cursor-pointer"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
