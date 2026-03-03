/**
 * Client-side watermark using Canvas API.
 * Overlays a logo (top-left) and "Shared via Pamaptor" (bottom strip)
 * onto the image before sharing.
 */

const LOGO_PATH = "/logo-watermark.png?v=2";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function addWatermark(imageBlob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataUrl(imageBlob);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // 1. Draw original image
  ctx.drawImage(img, 0, 0);

  const w = canvas.width;
  const h = canvas.height;
  const padding = Math.round(w * 0.03); // ~3% of width

  // 2. Top-left logo — 10% of image height, no background (transparent logo)
  try {
    const logo = await loadImage(LOGO_PATH);
    const logoH = Math.round(h * 0.08);
    const logoW = Math.round(logo.naturalWidth * (logoH / logo.naturalHeight));

    ctx.globalAlpha = 0.85;
    ctx.drawImage(logo, padding, padding, logoW, logoH);
    ctx.globalAlpha = 1;
  } catch {
    // Logo failed to load — skip it silently
  }

  // 3. Bottom text — "Pamaptor." BeReal-style centered
  const text = "Pamaptor.";
  const fontSize = Math.max(Math.round(h * 0.035), 20); // 3.5% of height, min 20px
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const textX = w / 2;
  const textY = h - Math.round(h * 0.025); // ~2.5% from bottom edge

  // Shadow for contrast on any background
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillText(text, textX + 1, textY + 2);

  // Main text — soft white like BeReal
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillText(text, textX, textY);

  // 4. Export as JPEG blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.9,
    );
  });
}
