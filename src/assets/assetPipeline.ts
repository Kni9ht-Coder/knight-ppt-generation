import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hasOpenAIKey } from "../config.js";
import type { DeckAsset, DeckSpec } from "../schemas/deck.js";
import { ensureDir } from "../utils/fs.js";
import { generateGptImage2Asset } from "./imageGenerator.js";
import { sanitizeSvg } from "./svgSanitizer.js";
import { renderSvgTemplate } from "./svgTemplates.js";

export interface AssetPipelineOptions {
  assetsDir: string;
  offline?: boolean;
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
  if (asset.sourcePath) {
    return { id: asset.id, kind: asset.kind, path: asset.sourcePath };
  }

  if (asset.kind === "ai-raster" && !options.offline && hasOpenAIKey()) {
    const extension = asset.outputFormat === "jpeg" ? "jpg" : asset.outputFormat;
    const outputPath = join(options.assetsDir, `${asset.id}.${extension}`);
    await generateGptImage2Asset(asset, outputPath);
    return { id: asset.id, kind: asset.kind, path: outputPath };
  }

  const svg = asset.svg || renderSvgTemplate(asset, deck.theme.colors);
  const safeSvg = sanitizeSvg(svg);
  const outputPath = join(options.assetsDir, `${asset.id}.svg`);
  await writeFile(outputPath, `${safeSvg}\n`, "utf8");
  return { id: asset.id, kind: asset.kind, path: outputPath };
}
