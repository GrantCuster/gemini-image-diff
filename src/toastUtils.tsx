import { useAtom } from "jotai";
import { ToastItemsAtom } from "./Atoms";
import type { ToastType, ToastItem } from "./Types";

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
