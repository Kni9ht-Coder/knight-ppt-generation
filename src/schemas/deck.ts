import { z } from "zod";
import { GPT_IMAGE_MODEL } from "../config.js";

export const languageSchema = z.enum(["zh-CN", "en-US"]).default("zh-CN");

export const briefSpecSchema = z.object({
  topic: z.string().min(1),
  audience: z.string().min(1).default("业务负责人"),
  slideCount: z.number().int().min(1).max(40).default(8),
  language: languageSchema,
  style: z.string().min(1).default("专业、简洁、信息密度适中"),
  goals: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([])
});

export const boxSchema = z.object({
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
  w: z.number().min(1).max(1000),
  h: z.number().min(1).max(1000)
});

export const colorSchema = z
  .string()
  .regex(/^#?[0-9A-Fa-f]{6}$/)
  .transform((value) => value.replace("#", "").toUpperCase());

export const textStyleSchema = z.object({
  fontFace: z.string().optional(),
  fontSize: z.number().min(8).max(72).optional(),
  color: colorSchema.optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  valign: z.enum(["top", "mid", "bottom"]).optional(),
  lineSpacingMultiple: z.number().min(0.8).max(2).optional()
});

const baseElementSchema = z.object({
  id: z.string().min(1),
  box: boxSchema,
  opacity: z.number().min(0).max(1).optional()
});

export const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  text: z.string(),
  role: z.enum(["title", "subtitle", "body", "caption", "footer", "label"]).default("body"),
  style: textStyleSchema.default({})
});

export const shapeElementSchema = baseElementSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "roundRect", "ellipse", "arc", "chevron"]).default("rect"),
  fill: colorSchema.optional(),
  line: colorSchema.optional(),
  lineWidth: z.number().min(0).max(8).optional(),
  radius: z.number().min(0).max(40).optional()
});

export const lineElementSchema = baseElementSchema.extend({
  type: z.literal("line"),
  line: colorSchema.default("CBD5E1"),
  lineWidth: z.number().min(0.25).max(8).default(1)
});

export const svgElementSchema = baseElementSchema.extend({
  type: z.literal("svg"),
  assetId: z.string().min(1)
});

export const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  assetId: z.string().min(1),
  crop: z.enum(["contain", "cover"]).default("contain")
});

export const tableElementSchema = baseElementSchema.extend({
  type: z.literal("table"),
  rows: z.array(z.array(z.string())).min(1),
  headerRow: z.boolean().default(true),
  style: textStyleSchema.default({})
});

export const slideElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  shapeElementSchema,
  lineElementSchema,
  svgElementSchema,
  imageElementSchema,
  tableElementSchema
]);

export const assetSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["svg", "ai-raster", "raster", "vectorized"]),
  prompt: z.string().optional(),
  alt: z.string().optional(),
  model: z.string().default(GPT_IMAGE_MODEL),
  quality: z.enum(["low", "medium", "high", "auto"]).default("medium"),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536", "auto"]).default("1536x1024"),
  outputFormat: z.enum(["png", "jpeg", "webp"]).default("png"),
  background: z.enum(["transparent", "opaque", "auto"]).default("auto"),
  template: z.enum(["cover", "workflow", "architecture", "roadmap", "metrics", "placeholder"]).optional(),
  svg: z.string().optional(),
  sourcePath: z.string().optional()
});

export const themeSchema = z.object({
  fontFace: z.string().default("Microsoft YaHei"),
  colors: z.object({
    background: colorSchema.default("FFFFFF"),
    surface: colorSchema.default("F8FAFC"),
    primary: colorSchema.default("174A7C"),
    secondary: colorSchema.default("0F766E"),
    accent: colorSchema.default("F28C28"),
    text: colorSchema.default("172033"),
    muted: colorSchema.default("64748B"),
    border: colorSchema.default("CBD5E1")
  }),
  footer: z
    .object({
      enabled: z.boolean().default(true),
      text: z.string().default("")
    })
    .default({ enabled: true, text: "" })
});

export const slideSchema = z.object({
  id: z.string().min(1),
  layout: z.enum(["cover", "section", "content", "two-column", "diagram", "table", "closing"]).default("content"),
  title: z.string().optional(),
  notes: z.string().optional(),
  backgroundColor: colorSchema.optional(),
  elements: z.array(slideElementSchema).min(1)
});

export const deckSpecSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    language: languageSchema,
    slideCount: z.number().int().min(1).max(40)
  }),
  theme: themeSchema,
  assets: z.array(assetSchema).default([]),
  slides: z.array(slideSchema).min(1)
});

export type BriefSpec = z.infer<typeof briefSpecSchema>;
export type DeckSpec = z.infer<typeof deckSpecSchema>;
export type DeckAsset = z.infer<typeof assetSchema>;
export type SlideSpec = z.infer<typeof slideSchema>;
export type SlideElement = z.infer<typeof slideElementSchema>;
export type Box = z.infer<typeof boxSchema>;
