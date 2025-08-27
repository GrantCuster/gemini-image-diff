export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle CORS if needed
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
