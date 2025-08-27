import { useAtom } from "jotai";
import { ToastItemsAtom } from "./Atoms";
import { Toast } from "./Toast";

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
