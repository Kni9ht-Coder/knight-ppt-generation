import type { DeckAsset, DeckSpec } from "../schemas/deck.js";

type ThemeColors = DeckSpec["theme"]["colors"];

export function renderSvgTemplate(asset: DeckAsset, colors: ThemeColors): string {
  switch (asset.template) {
    case "workflow":
      return workflowSvg(colors);
    case "architecture":
      return architectureSvg(colors);
    case "roadmap":
      return roadmapSvg(colors);
    case "metrics":
      return metricsSvg(colors);
    case "cover":
      return coverSvg(colors);
    case "placeholder":
    default:
      return placeholderSvg(colors);
  }
}

function svgWrap(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">${body}</svg>`;
}

function workflowSvg(c: ThemeColors): string {
  return svgWrap(
    800,
    420,
    `
<rect x="42" y="72" width="150" height="110" rx="18" fill="#${c.surface}" stroke="#${c.border}" stroke-width="3"/>
<rect x="242" y="72" width="150" height="110" rx="18" fill="#EAF3FA" stroke="#${c.primary}" stroke-width="3"/>
<rect x="442" y="72" width="150" height="110" rx="18" fill="#FFF3E3" stroke="#${c.accent}" stroke-width="3"/>
<rect x="642" y="72" width="115" height="110" rx="18" fill="#ECFDF5" stroke="#${c.secondary}" stroke-width="3"/>
<path d="M198 127H235" stroke="#${c.muted}" stroke-width="5" stroke-linecap="round"/>
<path d="M398 127H435" stroke="#${c.muted}" stroke-width="5" stroke-linecap="round"/>
<path d="M598 127H635" stroke="#${c.muted}" stroke-width="5" stroke-linecap="round"/>
<path d="M226 112L242 127L226 142" stroke="#${c.muted}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M426 112L442 127L426 142" stroke="#${c.muted}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M626 112L642 127L626 142" stroke="#${c.muted}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="117" cy="285" r="48" fill="#${c.primary}" opacity="0.12"/>
<circle cx="317" cy="285" r="48" fill="#${c.secondary}" opacity="0.12"/>
<circle cx="517" cy="285" r="48" fill="#${c.accent}" opacity="0.14"/>
<path d="M88 285H146M288 285H346M488 285H546" stroke="#${c.text}" stroke-width="8" stroke-linecap="round" opacity="0.22"/>
`.trim()
  );
}

function architectureSvg(c: ThemeColors): string {
  return svgWrap(
    900,
    420,
    `
<rect x="80" y="40" width="740" height="82" rx="18" fill="#EAF3FA" stroke="#${c.primary}" stroke-width="3"/>
<rect x="80" y="168" width="215" height="92" rx="18" fill="#${c.surface}" stroke="#${c.border}" stroke-width="3"/>
<rect x="342" y="168" width="215" height="92" rx="18" fill="#FFF3E3" stroke="#${c.accent}" stroke-width="3"/>
<rect x="605" y="168" width="215" height="92" rx="18" fill="#ECFDF5" stroke="#${c.secondary}" stroke-width="3"/>
<rect x="80" y="306" width="740" height="72" rx="18" fill="#F8FAFC" stroke="#${c.border}" stroke-width="3"/>
<path d="M450 122V158" stroke="#${c.muted}" stroke-width="5" stroke-linecap="round"/>
<path d="M188 260V296M450 260V296M713 260V296" stroke="#${c.muted}" stroke-width="5" stroke-linecap="round"/>
<circle cx="450" cy="81" r="23" fill="#${c.primary}" opacity="0.95"/>
<circle cx="188" cy="214" r="22" fill="#${c.primary}" opacity="0.22"/>
<circle cx="450" cy="214" r="22" fill="#${c.accent}" opacity="0.32"/>
<circle cx="713" cy="214" r="22" fill="#${c.secondary}" opacity="0.28"/>
`.trim()
  );
}

function roadmapSvg(c: ThemeColors): string {
  return svgWrap(
    920,
    300,
    `
<path d="M90 150H830" stroke="#${c.border}" stroke-width="8" stroke-linecap="round"/>
<circle cx="150" cy="150" r="42" fill="#${c.primary}"/>
<circle cx="460" cy="150" r="42" fill="#${c.accent}"/>
<circle cx="770" cy="150" r="42" fill="#${c.secondary}"/>
<path d="M136 150H164M446 150H474M756 150H784" stroke="white" stroke-width="8" stroke-linecap="round"/>
<path d="M150 108V66M460 108V66M770 108V66" stroke="#${c.muted}" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
<rect x="70" y="44" width="160" height="22" rx="11" fill="#${c.primary}" opacity="0.14"/>
<rect x="380" y="44" width="160" height="22" rx="11" fill="#${c.accent}" opacity="0.18"/>
<rect x="690" y="44" width="160" height="22" rx="11" fill="#${c.secondary}" opacity="0.16"/>
<rect x="70" y="225" width="160" height="22" rx="11" fill="#${c.primary}" opacity="0.14"/>
<rect x="380" y="225" width="160" height="22" rx="11" fill="#${c.accent}" opacity="0.18"/>
<rect x="690" y="225" width="160" height="22" rx="11" fill="#${c.secondary}" opacity="0.16"/>
`.trim()
  );
}

function metricsSvg(c: ThemeColors): string {
  return svgWrap(
    620,
    420,
    `
<rect x="58" y="48" width="504" height="322" rx="28" fill="#${c.surface}" stroke="#${c.border}" stroke-width="3"/>
<path d="M124 310V178" stroke="#${c.primary}" stroke-width="44" stroke-linecap="round"/>
<path d="M238 310V130" stroke="#${c.accent}" stroke-width="44" stroke-linecap="round"/>
<path d="M352 310V215" stroke="#${c.secondary}" stroke-width="44" stroke-linecap="round"/>
<path d="M466 310V94" stroke="#${c.primary}" stroke-width="44" stroke-linecap="round" opacity="0.75"/>
<path d="M98 310H512" stroke="#${c.text}" stroke-width="5" stroke-linecap="round" opacity="0.32"/>
<circle cx="124" cy="178" r="13" fill="white"/>
<circle cx="238" cy="130" r="13" fill="white"/>
<circle cx="352" cy="215" r="13" fill="white"/>
<circle cx="466" cy="94" r="13" fill="white"/>
`.trim()
  );
}

function coverSvg(c: ThemeColors): string {
  return svgWrap(
    900,
    700,
    `
<rect x="90" y="90" width="720" height="520" rx="48" fill="#${c.surface}" stroke="#${c.border}" stroke-width="3"/>
<circle cx="322" cy="312" r="122" fill="#${c.primary}" opacity="0.14"/>
<circle cx="552" cy="324" r="150" fill="#${c.accent}" opacity="0.16"/>
<circle cx="450" cy="350" r="86" fill="#${c.secondary}" opacity="0.15"/>
<path d="M280 355C340 265 560 254 626 356" stroke="#${c.primary}" stroke-width="18" stroke-linecap="round" opacity="0.75"/>
<path d="M300 410C390 470 525 470 604 410" stroke="#${c.accent}" stroke-width="18" stroke-linecap="round" opacity="0.72"/>
<rect x="244" y="186" width="412" height="56" rx="28" fill="white" opacity="0.78"/>
<rect x="210" y="506" width="480" height="38" rx="19" fill="white" opacity="0.72"/>
`.trim()
  );
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
