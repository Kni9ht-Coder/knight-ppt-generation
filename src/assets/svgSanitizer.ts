const DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /<foreignObject[\s>]/i,
  /\son[a-z]+\s*=/i,
  /\s(?:href|xlink:href)\s*=\s*["']https?:\/\//i,
  /\s(?:href|xlink:href)\s*=\s*["']data:/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i
];

export function sanitizeSvg(svg: string): string {
  const trimmed = svg.trim();

  if (!trimmed.startsWith("<svg") || !trimmed.includes("</svg>")) {
    throw new Error("Invalid SVG asset: expected an <svg> root.");
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error(`Unsafe SVG asset: matched ${pattern.source}.`);
    }
  }

  return trimmed
    .replace(/<\?xml[^>]*>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .trim();
}
