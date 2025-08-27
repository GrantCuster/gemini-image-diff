import { useEffect } from "react";
import type { ToastItem } from "./Types";
import { useAtom } from "jotai";
import { ToastItemsAtom } from "./Atoms";

interface ToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

export const Toast = ({ toast, onRemove }: ToastProps) => {
  useEffect(() => {
    if (!toast.persistent && toast.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, toast.persistent, onRemove]);

  const getToastStyles = () => {
    const baseStyles = "px-[1ch] py-[0.5ch] transition-all duration-300 ease-out";
    
    switch (toast.type) {
      case "success":
        return `${baseStyles} bg-green-600`;
      case "error":
        return `${baseStyles} bg-red-600`;
      case "warning":
        return `${baseStyles} bg-neutral-600`;
      case "loading":
        return `${baseStyles} bg-neutral-600`;
      default:
        return `${baseStyles} bg-neutral-600`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "loading":
        return "⟳";
      default:
        return "ℹ";
    }
  };

  return (
    <div className={`${getToastStyles()} text-neutral-100`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[1ch]">
          <div className={`text-sm ${toast.type === "loading" ? "animate-spin" : ""}`}>
            {getIcon()}
          </div>
          <div>{toast.message}</div>
        </div>
        {!toast.persistent && (
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-[2ch] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useAtom(ToastItemsAtom);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed w-full top-[1lh] pointer-events-none flex flex-col justify-center z-50 gap-[0.5lh] items-center">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

export const useToast = () => {
  const [, setToasts] = useAtom(ToastItemsAtom);

  const addToast = (message: string, type: ToastType = "info", options?: {
    duration?: number;
    persistent?: boolean;
  }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastItem = {
      id,
      message,
      type,
      duration: options?.duration,
      persistent: options?.persistent,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const updateToast = (id: string, updates: Partial<Omit<ToastItem, "id">>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  const showSuccess = (message: string, duration = 3000) => 
    addToast(message, "success", { duration });

  const showError = (message: string, duration = 5000) => 
    addToast(message, "error", { duration });

  const showWarning = (message: string, duration = 4000) => 
    addToast(message, "warning", { duration });

  const showInfo = (message: string, duration = 3000) => 
    addToast(message, "info", { duration });

  const showLoading = (message: string) => 
    addToast(message, "loading", { persistent: true });

  return {
    addToast,
    removeToast,
    updateToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
};
