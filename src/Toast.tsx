import { useEffect } from "react";
import type { ToastItem } from "@types";

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
