/**
 * Client-side watermark using Canvas API.
 * Overlays a logo (top-left) and "Shared via Pamaptor" (bottom strip)
 * onto the image before sharing.
 */

const LOGO_PATH = "/logo-watermark.png?v=3";

interface WatermarkOptions {
  categoryLabel?: string;
  categoryColor?: string;
}

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

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function colorToRgba(color: string, alpha: number): string | null {
  const value = color.trim();

  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const r = parseInt(value[1] + value[1], 16);
    const g = parseInt(value[2] + value[2], 16);
    const b = parseInt(value[3] + value[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgbMatch = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (rgbMatch) {
    const r = Math.min(255, parseInt(rgbMatch[1], 10));
    const g = Math.min(255, parseInt(rgbMatch[2], 10));
    const b = Math.min(255, parseInt(rgbMatch[3], 10));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return null;
}

function truncateTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "...";
  let result = text;
  while (result.length > 1 && ctx.measureText(result + ellipsis).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result.length < text.length ? result + ellipsis : result;
}

export async function addWatermark(imageBlob: Blob, options: WatermarkOptions = {}): Promise<Blob> {
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
  let badgeMinX = padding;

  // 2. Top-left logo — 10% of image height, no background (transparent logo)
  try {
    const logo = await loadImage(LOGO_PATH);
    const logoH = Math.round(h * 0.08);
    const logoW = Math.round(logo.naturalWidth * (logoH / logo.naturalHeight));
    const logoGap = Math.round(w * 0.02);
    badgeMinX = padding + logoW + logoGap;

    ctx.globalAlpha = 0.85;
    ctx.drawImage(logo, padding, padding, logoW, logoH);
    ctx.globalAlpha = 1;
  } catch {
    // Logo failed to load — skip it silently
  }

  // 3. Category badge text with semi-transparent gray background
  if (options.categoryLabel?.trim()) {
    const categoryText = options.categoryLabel.trim();
    const minFontSize = 12;
    let categoryFontSize = Math.max(Math.round(h * 0.028), 16);
    const badgeMaxRight = w - padding;
    const maxBadgeWidth = Math.max(badgeMaxRight - badgeMinX, Math.round(w * 0.25));

    let badgePaddingX = Math.round(categoryFontSize * 0.8);
    let textMaxWidth = maxBadgeWidth - badgePaddingX * 2;

    while (categoryFontSize > minFontSize && textMaxWidth > 0) {
      ctx.font = `600 ${categoryFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
      const measuredWidth = ctx.measureText(categoryText).width;
      if (measuredWidth + badgePaddingX * 2 <= maxBadgeWidth) break;
      categoryFontSize -= 1;
      badgePaddingX = Math.round(categoryFontSize * 0.8);
      textMaxWidth = maxBadgeWidth - badgePaddingX * 2;
    }

    ctx.font = `600 ${categoryFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    badgePaddingX = Math.round(categoryFontSize * 0.8);
    const badgePaddingY = Math.round(categoryFontSize * 0.45);
    textMaxWidth = Math.max(maxBadgeWidth - badgePaddingX * 2, 10);
    const fittedText = truncateTextToWidth(ctx, categoryText, textMaxWidth);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textMetrics = ctx.measureText(fittedText);
    const textWidth = Math.ceil(textMetrics.width);
    const badgeWidth = Math.min(textWidth + badgePaddingX * 2, maxBadgeWidth);
    const badgeHeight = categoryFontSize + badgePaddingY * 2;
    const freeAreaCenterX = (badgeMinX + badgeMaxRight) / 2;
    const badgeX = Math.round(
      Math.max(badgeMinX, Math.min(freeAreaCenterX - badgeWidth / 2, badgeMaxRight - badgeWidth)),
    );
    const badgeY = padding;
    const badgeRadius = Math.round(badgeHeight / 2);

    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
    ctx.fillStyle = colorToRgba(options.categoryColor ?? "", 0.45) ?? "rgba(128, 128, 128, 0.45)";
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillText(fittedText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
  }

  // 4. Bottom text — "Pamaptor." BeReal-style centered
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

  // 5. Export as JPEG blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.9,
    );
  });
}
