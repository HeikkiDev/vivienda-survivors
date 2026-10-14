import { SHARE_CARD, UI } from '../config';

export interface ShareCardLines {
  title: string;
  stats: string;
  footer: string;
}

/** Compone la imagen para compartir: captura de la partida (recortada a 1200×630) con el resultado encima. */
export function createShareCard(snapshot: HTMLImageElement, lines: ShareCardLines): Promise<Blob | null> {
  const c = SHARE_CARD;
  const canvas = document.createElement('canvas');
  canvas.width = c.width;
  canvas.height = c.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  // "cover": rellena todo el lienzo recortando lo que sobre.
  const scale = Math.max(c.width / snapshot.width, c.height / snapshot.height);
  const w = snapshot.width * scale;
  const h = snapshot.height * scale;
  ctx.drawImage(snapshot, (c.width - w) / 2, (c.height - h) / 2, w, h);

  const shade = ctx.createLinearGradient(0, c.shadeFromY, 0, c.height);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, `rgba(0,0,0,${c.shadeAlpha})`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, c.shadeFromY, c.width, c.height - c.shadeFromY);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const maxWidth = c.width - c.marginX * 2;
  drawLine(ctx, lines.title, c.titleY, c.titleSize, c.titleColor, true, maxWidth);
  drawLine(ctx, lines.stats, c.statsY, c.statsSize, c.statsColor, true, maxWidth);
  drawLine(ctx, lines.footer, c.footerY, c.footerSize, c.footerColor, false, maxWidth);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), c.mimeType));
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  size: number,
  color: string,
  bold: boolean,
  maxWidth: number,
): void {
  const c = SHARE_CARD;
  let fontSize = size;
  const font = (px: number): string => `${bold ? 'bold ' : ''}${px}px ${UI.fontFamily}`;
  ctx.font = font(fontSize);
  while (fontSize > c.minFontSize && ctx.measureText(text).width > maxWidth) {
    fontSize--;
    ctx.font = font(fontSize);
  }
  const x = c.width / 2;
  ctx.strokeStyle = c.strokeColor;
  ctx.lineWidth = c.strokeWidth;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
