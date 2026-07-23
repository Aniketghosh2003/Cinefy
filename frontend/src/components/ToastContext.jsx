import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    borderColor: 'border-emerald-500/40',
    iconColor: 'text-emerald-400',
    progressColor: 'bg-emerald-400',
  },
  error: {
    icon: AlertCircle,
    gradient: 'from-red-500/20 to-red-600/5',
    borderColor: 'border-red-500/40',
    iconColor: 'text-red-400',
    progressColor: 'bg-red-400',
  },
  info: {
    icon: Info,
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    borderColor: 'border-cyan-500/40',
    iconColor: 'text-cyan-400',
    progressColor: 'bg-cyan-400',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-amber-500/20 to-amber-600/5',
    borderColor: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    progressColor: 'bg-amber-400',
  },
};

const Toast = ({ toast, onDismiss }) => {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);

  const duration = toast.duration || 3000;

  useEffect(() => {
    const step = 50; // ms per tick
    const decrement = (step / duration) * 100;

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return next;
      });
    }, step);

    return () => clearInterval(intervalRef.current);
  }, [duration]);

  useEffect(() => {
    if (progress <= 0) {
      handleDismiss();
    }
  }, [progress]);

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    clearInterval(intervalRef.current);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'} relative flex items-start gap-3 w-80 p-4 rounded-2xl border ${config.borderColor} bg-gradient-to-r ${config.gradient} backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer group`}
      onClick={handleDismiss}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{toast.message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="flex-shrink-0 p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className={`h-full ${config.progressColor} transition-none rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — bottom right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
