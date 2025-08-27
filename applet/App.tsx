import { useAtom } from "jotai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CurrentPromptAtom,
  ModeAtom,
  OpacityAtom,
  ResultImageAtom,
  ResultPromptAtom,
  ShowInfoAtom,
  SourceImageAtom,
} from "./Atoms";
import { TextareaAutosize } from "./TextAreaAutosize";
import { loadImage } from "./Utils";
import { generateImage } from "./Gemini";
import { ModeType } from "./Types";
import { ToastContainer, useToast } from "./Toast";

function App() {
  const [aspect, setAspect] = useState<"portrait" | "landscape">("landscape");
  const [, setShowInfo] = useAtom(ShowInfoAtom);
  const [, setSourceImage] = useAtom(SourceImageAtom);
  const [resultImage] = useAtom(ResultImageAtom);
  usePasteImage();
  useDropImage();
  const resetDiff = useResetDiff();

  useLayoutEffect(() => {
    function updateAspect() {
      if (window.innerWidth / window.innerHeight > 0.8) {
        setAspect("landscape");
      } else {
        setAspect("portrait");
      }
    }
    updateAspect();
    window.addEventListener("resize", updateAspect);
    return () => {
      window.removeEventListener("resize", updateAspect);
    };
  }, []);

  return (
    <div className="w-full h-[100dvh] flex flex-col relative overflow-hidden">
      <div className="w-full flex justify-between items-center shrink-0 px-[0.5ch] py-[0.25lh]">
        <div className="pl-[1ch]">GEMINI FLASH IMAGE DIFF</div>
        <div className="flex gap-[1ch]">
          <label className="block cursor-pointer py-[0.25lh] text-neutral-200 px-[1ch] bg-neutral-900 hover:bg-neutral-800">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = function(event) {
                    const result = event.target?.result;
                    if (typeof result === "string") {
                      resetDiff();
                      setSourceImage(result);
                    }
                  };
                  reader.readAsDataURL(file);
                }
                // reset the input value to allow re-uploading the same file
                e.target.value = "";
              }}
            />
            Choose, paste, or drop a source image
          </label>
          <button
            className="px-[1ch] py-[0.25lh] text-neutral-200 hover:bg-neutral-800 bg-neutral-900"
            onClick={() => setShowInfo((v) => !v)}
          >
            Info
          </button>
        </div>
      </div>
      <div
        className="w-full grow relative overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: aspect === "landscape" ? "1fr 1fr 1fr" : "1fr",
          gridTemplateRows: aspect === "landscape" ? "1fr" : "1fr 1fr 1fr",
        }}
      >
        {!resultImage && <div></div>}
        <div className="relative w-full h-full">
          <Source />
        </div>
        {resultImage && (
          <div className="relative w-full h-full">
            <Diff />
          </div>
        )}
        {resultImage && (
          <div className="relative w-full h-full">
            <Result />
          </div>
        )}
      </div>
      <div className="w-full shrink-0">
        <Controls />
        <Prompt />
      </div>
      <ToastContainer />
      <InfoModal />
    </div>
  );
}

export default App;

function Controls() {
  const [resultPrompt] = useAtom(ResultPromptAtom);
  const [mode, setMode] = useAtom(ModeAtom);
  const [opacity, setOpacity] = useAtom(OpacityAtom);

  return (
    <div className="px-[1ch] flex justify-center">
      <div className="flex flex-col items-center gap-[0.5lh]">
        {resultPrompt ? (
          <div className="pt-[0.5lh]">"{resultPrompt}"</div>
        ) : null}
        {resultPrompt ? (
          <div className="flex items-center gap-[1ch]">
            <select
              className="bg-neutral-800 px-[1ch] py-[0.25lh]"
              value={mode}
              onChange={(e) => setMode(e.target.value as ModeType)}
            >
              <option value="diff">Difference</option>
              <option value="overlay">Overlay</option>
            </select>
            {mode === "overlay" ? (
              <div className="flex items-center gap-[0.5ch]">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="mx-[1ch] align-middle"
                />
                <div className="w-[4ch] text-right">
                  {Math.round(opacity * 100)}%
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Prompt() {
  const [sourceImage] = useAtom(SourceImageAtom);
  const [prompt, setPrompt] = useAtom(CurrentPromptAtom);
  const [, setResultImage] = useAtom(ResultImageAtom);
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setResultPrompt] = useAtom(ResultPromptAtom);
  const { addToast, removeToast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function handleGenerate() {
    if (isGenerating) return;
    setIsGenerating(true);
    const toastId = addToast("Generating image...", "loading", {
      duration: 0,
      persistent: true,
    });
    setResultImage(null);
    setResultPrompt(prompt);
    setPrompt("");
    const canvas = canvasRef.current || document.createElement("canvas");
    const image = await loadImage(sourceImage);
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    try {
      const resultSource = await generateImage({ prompt, dataUrl });
      if (resultSource) {
        setResultImage(resultSource);
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to generate image. Please try again.", "error");
    }
    removeToast(toastId);
    setIsGenerating(false);
  }

  const textElRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className="w-full shrink-0 gap-[1ch] py-[0.5lh] px-[1ch] flex items-center">
      <TextareaAutosize
        value={prompt}
        ref={textElRef}
        className="w-full grow px-[1ch] py-[0.25lh] focus:outline-none bg-neutral-800"
        onChange={(e) => setPrompt(e.target.value)}
        autoFocus
        placeholder="Enter your prompt here"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (sourceImage && prompt.trim()) {
              (e.target as HTMLTextAreaElement).blur();
              handleGenerate();
            }
          }
        }}
      />
      <button
        className={`px-[2ch] py-[0.25lh] bg-neutral-800 hover:bg-neutral-700 ${isGenerating ? "cursor-loading opacity-50" : ""} ${prompt.trim().length === 0 || !sourceImage ? "opacity-50" : ""}`}
        onClick={() => {
          if (sourceImage && prompt.trim()) {
            handleGenerate();
          } else {
            textElRef.current?.focus();
          }
        }}
      >
        Generate
      </button>
    </div>
  );
}

function useSizeImage(image: string | null) {
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [displaySize, setDisplaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchImageSize() {
      if (image) {
        const img = await loadImage(image);
        setImageSize({ width: img.width, height: img.height });
      } else {
        setImageSize(null);
      }
    }
    fetchImageSize();
  }, [image]);

  useEffect(() => {
    // resize observer to get the display size
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (imageSize && containerSize) {
      const imageAspect = imageSize.width / imageSize.height;
      const containerAspect = containerSize.width / (containerSize.height - 36); // account for label height
      let width, height;
      if (imageAspect > containerAspect) {
        // image is wider than container
        width = containerSize.width;
        height = width / imageAspect;
      } else {
        // image is taller than container
        height = containerSize.height - 36; // account for label height
        width = height * imageAspect;
      }
      setDisplaySize({ width, height });
    } else {
      setDisplaySize(null);
    }
  }, [imageSize, containerSize]);

  return { imageSize, displaySize, containerRef };
}

function Source() {
  const [sourceImage] = useAtom(SourceImageAtom);
  const { imageSize, displaySize, containerRef } = useSizeImage(sourceImage);

  return (
    <div className="absolute inset-0 flex" ref={containerRef}>
      <div className="m-auto">
        <div className="text-center text-neutral-400 w-full py-[0.25lh]">
          SOURCE
        </div>
        <img
          src={sourceImage}
          alt={
            imageSize
              ? `Source (${imageSize.width}x${imageSize.height})`
              : "Source"
          }
          className="w-auto h-auto max-w-full max-h-full"
          style={
            displaySize
              ? { width: displaySize.width, height: displaySize.height }
              : {}
          }
        />
      </div>
    </div>
  );
}

function Diff() {
  const [sourceImage] = useAtom(SourceImageAtom);
  const [resultImage] = useAtom(ResultImageAtom);
  const [mode] = useAtom(ModeAtom);
  const [opacity] = useAtom(OpacityAtom);
  const [bump, setBump] = useState(0); // to force re-render when images change
  const { containerRef, displaySize } = useSizeImage(sourceImage);

  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const resultImageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function main() {
      if (sourceImage) {
        const img = await loadImage(sourceImage);
        sourceImageRef.current = img;
      } else {
        sourceImageRef.current = null;
      }
      setBump((b) => b + 1);
    }
    main();
  }, [sourceImage]);

  useEffect(() => {
    async function main() {
      if (resultImage) {
        const img = await loadImage(resultImage);
        resultImageRef.current = img;
      } else {
        resultImageRef.current = null;
      }
      setBump((b) => b + 1);
    }
    main();
  }, [resultImage]);

  useEffect(() => {
    async function render() {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      if (!sourceImage || !resultImage) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }
      const srcImg = sourceImageRef.current;
      if (!srcImg) return;
      const width = srcImg.width;
      const height = srcImg.height;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const resImg = resultImageRef.current;
      if (!resImg) return;
      if (mode === "diff") {
        ctx.drawImage(srcImg, 0, 0, width, height);
        ctx.globalCompositeOperation = "difference";
        ctx.drawImage(resImg, 0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
      } else if (mode === "overlay") {
        ctx.drawImage(srcImg, 0, 0, width, height);
        ctx.globalAlpha = opacity;
        ctx.drawImage(resImg, 0, 0, width, height);
        ctx.globalAlpha = 1.0;
      }
    }
    render();
  }, [sourceImage, resultImage, mode, opacity, bump]);

  return (
    <div className="absolute inset-0 flex" ref={containerRef}>
      <div className="m-auto">
        <div className="text-center text-neutral-400 w-full py-[0.25lh]">
          DIFF
        </div>
        {resultImage ? (
          <canvas
            ref={canvasRef}
            className="w-auto h-auto max-w-full max-h-full"
            style={
              displaySize
                ? { width: displaySize.width, height: displaySize.height }
                : {}
            }
          ></canvas>
        ) : null}
      </div>
    </div>
  );
}

function Result() {
  const [resultImage] = useAtom(ResultImageAtom);
  const [sourceImage] = useAtom(SourceImageAtom);
  const { imageSize, displaySize, containerRef } = useSizeImage(
    resultImage || sourceImage,
  );

  return (
    <div className="absolute inset-0 flex" ref={containerRef}>
      <div className="m-auto">
        <div className="text-center text-neutral-400 w-full py-[0.25lh]">
          GENERATED
        </div>
        <img
          src={resultImage || sourceImage}
          alt={
            imageSize
              ? `Source (${imageSize.width}x${imageSize.height})`
              : "Source"
          }
          className="w-auto h-auto max-w-full max-h-full"
          style={{
            width: displaySize ? displaySize.width : undefined,
            height: displaySize ? displaySize.height : undefined,
            opacity: resultImage ? 1.0 : 0,
          }}
        />
      </div>
    </div>
  );
}

function usePasteImage() {
  const [, setSourceImage] = useAtom(SourceImageAtom);
  const resetDiff = useResetDiff();

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      if (event.clipboardData) {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = function(e) {
                const result = e.target?.result;
                if (typeof result === "string") {
                  resetDiff();
                  setSourceImage(result);
                }
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [setSourceImage]);
}

function useDropImage() {
  const resetDiff = useResetDiff();
  const [, setSourceImage] = useAtom(SourceImageAtom);
  useEffect(() => {
    function handleDragOver(event: DragEvent) {
      event.preventDefault();
    }
    function handleDrop(event: DragEvent) {
      event.preventDefault();
      if (event.dataTransfer) {
        const files = event.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.indexOf("image") !== -1) {
            const reader = new FileReader();
            reader.onload = function(e) {
              const result = e.target?.result;
              if (typeof result === "string") {
                resetDiff();
                setSourceImage(result);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [setSourceImage]);
}

function useResetDiff() {
  const [, setCurrentPrompt] = useAtom(CurrentPromptAtom);
  const [, setResultPrompt] = useAtom(ResultPromptAtom);
  const [, setResultImage] = useAtom(ResultImageAtom);

  return function() {
    setResultPrompt("");
    setResultImage(null);
    setCurrentPrompt("");
  };
}

function InfoModal() {
  const [showInfo, setShowInfo] = useAtom(ShowInfoAtom);
  return showInfo ? (
    <div
      className="absolute inset-0 bg-black bg-opacity-75 z-10 flex"
      onClick={() => setShowInfo(false)}
    >
      <div
        className="m-auto max-w-lg w-full bg-neutral-900 text-neutral-200 p-[2ch] max-w-[90vw] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-[1lh]">
          <div className="">About</div>
          <button
            className="px-[1ch] py-[0.25lh] text-neutral-200 hover:bg-neutral-800 bg-neutral-900"
            onClick={() => setShowInfo(false)}
          >
            &times;
          </button>
        </div>
        <div>
          A simple app for generating images using{" "}
          <a
            href="https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Gemini Flash Image
          </a>{" "}
          and viewing a diff of the source and generated image.
        </div>
      </div>
    </div>
  ) : null;
}
