import pptxgen from "pptxgenjs";
import type { DeckSpec, SlideElement } from "../schemas/deck.js";
import type { ResolvedAssetMap } from "../assets/assetPipeline.js";
import { ensureDirForFile } from "../utils/fs.js";
import { applySlideChrome } from "./masters.js";
import { boxToInches, SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN } from "./units.js";

export interface RenderOptions {
  outputPath: string;
  assets: ResolvedAssetMap;
}

export async function renderPptx(deck: DeckSpec, options: RenderOptions): Promise<string> {
  const imported = pptxgen as any;
  const PptxGenJS = (typeof imported === "function" ? imported : imported.default) as { new (): any };
  const pptx = new PptxGenJS();
  pptx.author = "knight-ppt-generation";
  pptx.company = "knight-ppt-generation";
  pptx.subject = deck.meta.title;
  pptx.title = deck.meta.title;
  pptx.lang = deck.meta.language;
  pptx.layout = "LAYOUT_WIDE";
  pptx.defineLayout({ name: "LAYOUT_KNIGHT_WIDE", width: SLIDE_WIDTH_IN, height: SLIDE_HEIGHT_IN });
  pptx.layout = "LAYOUT_KNIGHT_WIDE";
  pptx.theme = {
    headFontFace: deck.theme.fontFace,
    bodyFontFace: deck.theme.fontFace,
    lang: deck.meta.language
  };

  deck.slides.forEach((slideSpec, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: slideSpec.backgroundColor || deck.theme.colors.background };

    for (const element of slideSpec.elements) {
      renderElement(slide, element, deck, options.assets);
    }

    applySlideChrome(slide, deck, index);

    if (slideSpec.notes && typeof slide.addNotes === "function") {
      slide.addNotes(slideSpec.notes);
    }
  });

  await ensureDirForFile(options.outputPath);
  await pptx.writeFile({ fileName: options.outputPath });
  return options.outputPath;
}

function renderElement(slide: any, element: SlideElement, deck: DeckSpec, assets: ResolvedAssetMap): void {
  switch (element.type) {
    case "text":
      renderText(slide, element, deck);
      break;
    case "shape":
      renderShape(slide, element, deck);
      break;
    case "line":
      renderLine(slide, element);
      break;
    case "svg":
    case "image":
      renderImage(slide, element, assets);
      break;
    case "table":
      renderTable(slide, element, deck);
      break;
  }
}

function renderText(slide: any, element: Extract<SlideElement, { type: "text" }>, deck: DeckSpec): void {
  const box = boxToInches(element.box);
  const style = element.style;
  const fontSize = style.fontSize || defaultFontSize(element.role);

  slide.addText(element.text, {
    ...box,
    fontFace: style.fontFace || deck.theme.fontFace,
    fontSize,
    color: style.color || deck.theme.colors.text,
    bold: style.bold,
    italic: style.italic,
    align: style.align || "left",
    valign: style.valign || "top",
    breakLine: false,
    fit: "shrink",
    margin: 0.05
  });
}

function renderShape(slide: any, element: Extract<SlideElement, { type: "shape" }>, deck: DeckSpec): void {
  const box = boxToInches(element.box);
  slide.addShape(element.shape, {
    ...box,
    fill: { color: element.fill || deck.theme.colors.surface, transparency: opacityToTransparency(element.opacity) },
    line: {
      color: element.line || deck.theme.colors.border,
      width: element.lineWidth ?? 0.8,
      transparency: opacityToTransparency(element.opacity)
    },
    radius: element.radius
  });
}

function renderLine(slide: any, element: Extract<SlideElement, { type: "line" }>): void {
  const box = boxToInches(element.box);
  slide.addShape("line", {
    ...box,
    line: { color: element.line, width: element.lineWidth }
  });
}

function renderImage(slide: any, element: Extract<SlideElement, { type: "svg" | "image" }>, assets: ResolvedAssetMap): void {
  const asset = assets.get(element.assetId);
  if (!asset) {
    throw new Error(`Asset ${element.assetId} was not resolved.`);
  }

  slide.addImage({
    path: asset.path,
    ...boxToInches(element.box)
  });
}

function renderTable(slide: any, element: Extract<SlideElement, { type: "table" }>, deck: DeckSpec): void {
  const box = boxToInches(element.box);
  const rows = element.rows.map((row, rowIndex) =>
    row.map((cell) => ({
      text: cell,
      options: {
        bold: element.headerRow && rowIndex === 0,
        color: rowIndex === 0 ? "FFFFFF" : deck.theme.colors.text,
        fill: { color: rowIndex === 0 ? deck.theme.colors.primary : "FFFFFF" },
        margin: 0.08
      }
    }))
  );

  slide.addTable(rows, {
    ...box,
    fontFace: element.style.fontFace || deck.theme.fontFace,
    fontSize: element.style.fontSize || 11,
    color: element.style.color || deck.theme.colors.text,
    border: { type: "solid", color: deck.theme.colors.border, width: 0.5 },
    valign: "mid",
    margin: 0.06
  });
}

function defaultFontSize(role: Extract<SlideElement, { type: "text" }>["role"]): number {
  switch (role) {
    case "title":
      return 28;
    case "subtitle":
      return 16;
    case "caption":
    case "footer":
      return 10;
    case "label":
      return 11;
    case "body":
    default:
      return 14;
  }
}

function opacityToTransparency(opacity: number | undefined): number {
  if (opacity === undefined) {
    return 0;
  }

  return Math.round((1 - opacity) * 100);
}
