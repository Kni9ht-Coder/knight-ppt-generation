import type { DeckAsset, DeckSpec } from "../schemas/deck.js";

type ThemeColors = DeckSpec["theme"]["colors"];

export function renderSvgTemplate(_asset: DeckAsset, colors: ThemeColors): string {
  // 在 Skill 驱动工作流中，SVG 由 Agent 直接生成
  // 这里只提供占位符 SVG
  return placeholderSvg(colors);
}

function svgWrap(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">${body}</svg>`;
}

function placeholderSvg(c: ThemeColors): string {
  return svgWrap(
    900,
    600,
    `
<rect width="900" height="600" rx="36" fill="#${c.surface}"/>
<rect x="74" y="74" width="752" height="452" rx="30" fill="white" stroke="#${c.border}" stroke-width="3"/>
<circle cx="338" cy="290" r="128" fill="#${c.primary}" opacity="0.12"/>
<circle cx="552" cy="296" r="150" fill="#${c.accent}" opacity="0.14"/>
<path d="M270 320C355 230 522 232 628 324" stroke="#${c.primary}" stroke-width="15" stroke-linecap="round" opacity="0.72"/>
<path d="M302 382C390 434 515 434 598 382" stroke="#${c.secondary}" stroke-width="15" stroke-linecap="round" opacity="0.7"/>
`.trim()
  );
}


