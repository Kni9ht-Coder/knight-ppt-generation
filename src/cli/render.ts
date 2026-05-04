import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { resolveDeckAssets } from "../assets/assetPipeline.js";
import { repairDeckSpec } from "../layout/repair.js";
import { validateDeckSpec } from "../layout/validator.js";
import { renderPptx } from "../renderer/pptxRenderer.js";
import { deckSpecSchema } from "../schemas/deck.js";
import { readJsonFile } from "../utils/fs.js";
import { slugify } from "../utils/slug.js";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      spec: { type: "string" },
      template: { type: "string" },
      out: { type: "string" },
      "assets-dir": { type: "string" }
    }
  });

  if (!values.spec) {
    console.error("Usage: npm run render -- --spec <deck.json> [--template <template.pptx>] [--assets-dir <dir>] [--out <file.pptx>]");
    process.exitCode = 1;
    return;
  }

  const specPath = resolve(values.spec);
  const raw = await readJsonFile<unknown>(specPath);
  const deck = repairDeckSpec(deckSpecSchema.parse(raw));

  const validation = validateDeckSpec(deck);
  for (const w of validation.warnings) console.warn(`[warn] ${w.path}: ${w.message}`);
  if (!validation.ok) {
    for (const e of validation.errors) console.error(`[error] ${e.path}: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  const topicDir = inferTopicDir(specPath, deck.meta.title);
  const assetsDir = resolve(values["assets-dir"] || pickStageDir(topicDir, "5-资产", "5-assets"));
  const outputPath = resolve(values.out || join(pickStageDir(topicDir, "7-输出", "7-output"), "output.pptx"));

  const assets = await resolveDeckAssets(deck, { assetsDir });
  const templatePath = values.template ? resolve(values.template) : undefined;
  await renderPptx(deck, { outputPath, assets, templatePath });

  console.log(`PPTX: ${outputPath}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});

function inferTopicDir(specPath: string, title: string): string {
  const specDir = dirname(specPath);
  const stageDir = basename(specDir);
  if (stageDir === "6-渲染规格" || stageDir === "6-deck") {
    return dirname(specDir);
  }

  return resolve(`outputs/${slugify(title)}`);
}

function pickStageDir(topicDir: string, preferred: string, legacy: string): string {
  const preferredPath = join(topicDir, preferred);
  const legacyPath = join(topicDir, legacy);

  if (!existsSync(preferredPath) && existsSync(legacyPath)) {
    return legacyPath;
  }

  return preferredPath;
}
