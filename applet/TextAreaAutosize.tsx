import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

type TextareaAutosizeProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> & {
  /** Minimum visible rows (default 1) */
  minRows?: number;
  /** Maximum visible rows before scrolling */
  maxRows?: number;
  /** Allow user to manually resize; default false */
  enableManualResize?: boolean;
};

export const TextareaAutosize = forwardRef<HTMLTextAreaElement, TextareaAutosizeProps>(
  (
    {
      minRows = 1,
      maxRows,
      enableManualResize = false,
      style,
      onChange,
      ...props
    },
    ref
  ) => {
    const elRef = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(ref, () => elRef.current as HTMLTextAreaElement);

    const adjust = useCallback(() => {
      const el = elRef.current;
      if (!el) return;

      const cs = window.getComputedStyle(el);

      const borderY =
        parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      const paddingY =
        parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const lineHeight = parseFloat(cs.lineHeight) || 0;

      const minHeight = Math.max(minRows * lineHeight + paddingY + borderY, 0);
      const maxHeight =
        typeof maxRows === "number"
          ? maxRows * lineHeight + paddingY + borderY
          : Number.POSITIVE_INFINITY;

      // Measure intrinsic content height
      el.style.height = "0px"; // collapse first to get true scrollHeight
      const content = el.scrollHeight;

      const next = Math.min(Math.max(content, minHeight), maxHeight);

      el.style.overflowY = content > maxHeight ? "auto" : "hidden";
      el.style.height = `${next}px`;
    }, [minRows, maxRows]);

    // Resize on mount and on value changes (controlled)
    useLayoutEffect(() => {
      adjust();
    }, [adjust, props.value]);

    // Resize when user types (uncontrolled or controlled)
    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
      adjust();
      onChange?.(e);
    };

    // Resize when layout/width changes
    useLayoutEffect(() => {
      const el = elRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => adjust());
      ro.observe(el);
      return () => ro.disconnect();
    }, [adjust]);

    // Resize after fonts load (helps if custom webfonts shift line-height)
    useLayoutEffect(() => {
      // @ts-ignore: document.fonts may not exist in older browsers
      const fonts = (document as any).fonts;
      if (fonts?.ready) {
        fonts.ready.then(() => adjust());
      }
    }, [adjust]);

    return (
      <textarea
        {...props}
        ref={elRef}
        onChange={handleChange}
        spellCheck={false}
        style={{
          whiteSpace: "pre-wrap",
          // Prevent manual resize unless opted in
          resize: enableManualResize ? "vertical" : "none",
          overflowY: "hidden",
          // Let the component manage height
          height: 0,
          ...style,
        }}
      />
    );
  }
);
