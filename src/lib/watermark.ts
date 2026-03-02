/**
 * Client-side watermark using Canvas API.
 * Overlays a logo (top-left) and "Shared via Pamaptor" (bottom strip)
 * onto the image before sharing.
 */

const LOGO_PATH = "/logo-watermark.png";

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

  // 2. Top-left logo — 20% of image height, no background (transparent logo)
  try {
    const logo = await loadImage(LOGO_PATH);
    const logoH = Math.round(h * 0.2);
    const logoW = Math.round(logo.naturalWidth * (logoH / logo.naturalHeight));

    ctx.globalAlpha = 0.85;
    ctx.drawImage(logo, padding, padding, logoW, logoH);
    ctx.globalAlpha = 1;
  } catch {
    // Logo failed to load — skip it silently
  }

  // 3. Bottom text — BeReal-style bold "110PATROL", no background
  const text = "110PATROL";
  const fontSize = Math.max(Math.round(h * 0.05), 28); // 5% of height, min 28px
  ctx.font = `800 ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const textX = w / 2;
  const textY = h - padding * 2;
  const shadowOffset = Math.max(Math.round(fontSize * 0.04), 2);

  // Shadow pass — dark offset for readability
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillText(text, textX + shadowOffset, textY + shadowOffset);

  // Main text — white
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
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
