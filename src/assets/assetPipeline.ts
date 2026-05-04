import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DeckAsset, DeckSpec } from "../schemas/deck.js";
import { ensureDir } from "../utils/fs.js";
import { sanitizeSvg } from "./svgSanitizer.js";
import { renderSvgTemplate } from "./svgTemplates.js";

export interface AssetPipelineOptions {
  assetsDir: string;
}

export interface ResolvedAsset {
  id: string;
  kind: DeckAsset["kind"];
  path: string;
}

export type ResolvedAssetMap = Map<string, ResolvedAsset>;

export async function resolveDeckAssets(deck: DeckSpec, options: AssetPipelineOptions): Promise<ResolvedAssetMap> {
  await ensureDir(options.assetsDir);

  const resolved: ResolvedAssetMap = new Map();

  for (const asset of deck.assets) {
    const resolvedAsset = await resolveAsset(deck, asset, options);
    resolved.set(asset.id, resolvedAsset);
  }

  return resolved;
}

async function resolveAsset(deck: DeckSpec, asset: DeckAsset, options: AssetPipelineOptions): Promise<ResolvedAsset> {
  // 如果指定了 sourcePath，直接使用
  if (asset.sourcePath) {
    return { id: asset.id, kind: asset.kind, path: asset.sourcePath };
  }

  // 生成 SVG（从 inline svg 或模板）
  const svg = asset.svg || renderSvgTemplate(asset, deck.theme.colors);
  const safeSvg = sanitizeSvg(svg);
  const outputPath = join(options.assetsDir, `${asset.id}.svg`);
  await writeFile(outputPath, `${safeSvg}\n`, "utf8");
  return { id: asset.id, kind: asset.kind, path: outputPath };
}

