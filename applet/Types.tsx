export type ModeType = "diff" | "overlay";

export type ToastType = "info" | "success" | "warning" | "error" | "loading";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  persistent?: boolean;
};
