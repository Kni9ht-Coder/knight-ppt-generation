import { ZodError } from "zod";
import { deckSpecSchema, type Box, type DeckSpec, type SlideElement } from "../schemas/deck.js";
import type { ResearchRole } from "../schemas/research.js";

export interface ValidationIssue {
  level: "error" | "warning";
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateDeckSpec(candidate: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const parsed = deckSpecSchema.safeParse(candidate);

  if (!parsed.success) {
    issues.push(...zodIssues(parsed.error));
    return splitIssues(issues);
  }

  const deck = parsed.data;
  issues.push(...validateMeta(deck));
  issues.push(...validateIds(deck));
  issues.push(...validateAssets(deck));
  issues.push(...validateSlides(deck));
  issues.push(...validateResearchDeck(deck));

  return splitIssues(issues);
}

function zodIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    level: "error",
    path: issue.path.join("."),
    message: issue.message
  }));
}

function validateMeta(deck: DeckSpec): ValidationIssue[] {
  if (deck.meta.slideCount === deck.slides.length) {
    return [];
  }

  return [{
    level: "error",
    path: "meta.slideCount",
    message: `slideCount is ${deck.meta.slideCount}, but slides length is ${deck.slides.length}.`
  }];
}

function validateIds(deck: DeckSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const assetIds = new Set<string>();
  const slideIds = new Set<string>();

  for (const asset of deck.assets) {
    if (assetIds.has(asset.id)) {
      issues.push({ level: "error", path: `assets.${asset.id}`, message: "Duplicate asset id." });
    }
    assetIds.add(asset.id);
  }

  for (const slide of deck.slides) {
    if (slideIds.has(slide.id)) {
      issues.push({ level: "error", path: `slides.${slide.id}`, message: "Duplicate slide id." });
    }
    slideIds.add(slide.id);
  }

  return issues;
}

function validateAssets(deck: DeckSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const asset of deck.assets) {
    if ((asset.kind === "svg") && !asset.svg && !asset.sourcePath) {
      issues.push({
        level: "warning",
        path: `assets.${asset.id}`,
        message: "Asset has no inline SVG or sourcePath; placeholder SVG will be used."
      });
    }
  }

  return issues;
}

function validateSlides(deck: DeckSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const assetIds = new Set(deck.assets.map((asset) => asset.id));

  deck.slides.forEach((slide, slideIndex) => {
    const slidePath = `slides.${slideIndex}`;
    const elementIds = new Set<string>();

    const hasTitle = slide.elements.some((element) => element.type === "text" && element.role === "title");
    if (!hasTitle) {
      issues.push({ level: "warning", path: slidePath, message: "Slide has no title text element." });
    }

    for (const element of slide.elements) {
      if (elementIds.has(element.id)) {
        issues.push({ level: "error", path: `${slidePath}.${element.id}`, message: "Duplicate element id." });
      }
      elementIds.add(element.id);

      issues.push(...validateElement(slidePath, element, assetIds));
    }

    issues.push(...validateOverlap(slidePath, slide.elements));
  });

  return issues;
}

function validateResearchDeck(deck: DeckSpec): ValidationIssue[] {
  if (deck.meta.mode !== "research-report") {
    return [];
  }

  const issues: ValidationIssue[] = [];
  const roles = new Set(deck.slides.map((slide) => slide.researchRole));
  const requiredRoles: ResearchRole[] = ["problem", "method-overview", "experiment-setup", "main-results", "conclusion"];

  for (const role of requiredRoles) {
    if (!roles.has(role)) {
      issues.push({
        level: "error",
        path: "slides",
        message: `Research report is missing required slide role: ${role}.`
      });
    }
  }

  deck.slides.forEach((slide, slideIndex) => {
    const slidePath = `slides.${slideIndex}`;
    const isLightSlide = slide.layout === "cover" || slide.layout === "section" || slide.layout === "closing";
    if (isLightSlide) {
      return;
    }

    if (!slide.researchRole) {
      issues.push({
        level: "error",
        path: `${slidePath}.researchRole`,
        message: "Research report body slide must declare researchRole."
      });
    }

    const titleCount = slide.elements.filter((element) => element.type === "text" && element.role === "title").length;
    const claimText = slide.elements
      .filter((element) => element.type === "text" && element.role === "claim")
      .map((element) => element.text)
      .join("");
    const bodyText = slide.elements
      .filter((element) => element.type === "text" && (element.role === "body" || element.role === "evidence"))
      .map((element) => element.text)
      .join("");
    const visualCount = slide.elements.filter((element) => element.type === "svg" || element.type === "image" || element.type === "table").length;

    if (titleCount < 1) {
      issues.push({
        level: "error",
        path: `${slidePath}.elements`,
        message: "Research report body slide must include a title text element."
      });
    }

    if (claimText.trim().length < 8) {
      issues.push({
        level: "error",
        path: `${slidePath}.elements`,
        message: "Research report body slide must include a claim text element."
      });
    }

    const hasEnoughText = bodyText.trim().length >= 80;
    const hasVisualWithText = visualCount > 0 && bodyText.trim().length >= 40;
    if (!hasEnoughText && !hasVisualWithText) {
      issues.push({
        level: "error",
        path: `${slidePath}.elements`,
        message: "Research report body slide is too thin: add evidence text, table data, or a substantive visual."
      });
    }

    if (!slide.notes || slide.notes.trim().length < 60) {
      issues.push({
        level: "error",
        path: `${slidePath}.notes`,
        message: "Research report body slide must include speaker notes with enough detail for delivery."
      });
    }
  });

  return issues;
}

function validateElement(slidePath: string, element: SlideElement, assetIds: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { x, y, w, h } = element.box;

  if (x + w > 1000 || y + h > 1000) {
    issues.push({ level: "error", path: `${slidePath}.${element.id}.box`, message: "Element box exceeds canvas." });
  }

  if ((element.type === "svg" || element.type === "image") && !assetIds.has(element.assetId)) {
    issues.push({
      level: "error",
      path: `${slidePath}.${element.id}.assetId`,
      message: `Referenced asset ${element.assetId} does not exist.`
    });
  }

  if (element.type === "text") {
    const fontSize = element.style.fontSize ?? 14;
    if (element.role !== "footer" && fontSize < 10) {
      issues.push({ level: "warning", path: `${slidePath}.${element.id}.style.fontSize`, message: "Text may be too small." });
    }

    const estimatedCapacity = Math.max(40, (w * h) / 72);
    if (element.text.length > estimatedCapacity) {
      issues.push({
        level: "warning",
        path: `${slidePath}.${element.id}.text`,
        message: "Text may overflow its box."
      });
    }
  }

  return issues;
}

function validateOverlap(slidePath: string, elements: SlideElement[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const candidates = elements.filter((element) => element.type === "text");

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i];
      const b = candidates[j];
      const ratio = overlapRatio(a.box, b.box);

      if (ratio > 0.42 && (a.type === "text" || b.type === "text")) {
        issues.push({
          level: "warning",
          path: `${slidePath}.${a.id}`,
          message: `Text element may overlap ${b.id}.`
        });
      }
    }
  }

  return issues;
}

function overlapRatio(a: Box, b: Box): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const intersection = xOverlap * yOverlap;
  const smallerArea = Math.min(a.w * a.h, b.w * b.h);
  return smallerArea === 0 ? 0 : intersection / smallerArea;
}

function splitIssues(issues: ValidationIssue[]): ValidationResult {
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");
  return { ok: errors.length === 0, errors, warnings };
}
