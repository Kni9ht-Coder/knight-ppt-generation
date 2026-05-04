import { z } from "zod";
import { languageSchema } from "./brief.js";

export const boxSchema = z.object({
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
  w: z.number().min(1).max(1000),
  h: z.number().min(1).max(1000)
}).refine(
  (box) => box.x + box.w <= 1000,
  { message: "元素越界：x + w 不能超过 1000" }
).refine(
  (box) => box.y + box.h <= 1000,
  { message: "元素越界：y + h 不能超过 1000" }
);

export const layoutElementSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "shape", "line", "visual-placeholder"]),
  role: z.enum(["title", "subtitle", "body", "caption", "footer", "label", "decoration", "visual"]).optional(),
  box: boxSchema,
  content: z.string().optional(),
  visualType: z.enum(["diagram", "chart", "table", "image"]).optional()
});

export const layoutSlideSchema = z.object({
  id: z.string().min(1, "slide id 不能为空"),
  layout: z.enum(["cover", "section", "content", "two-column", "diagram", "table", "closing"]).default("content"),
  title: z.string().min(1, "标题不能为空"),
  elements: z.array(layoutElementSchema).min(3, "每页至少需要 3 个元素")
});

export const layoutSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    language: languageSchema,
    slideCount: z.number().int().min(1).max(40)
  }),
  slides: z.array(layoutSlideSchema).min(1, "至少需要 1 页")
});

export type LayoutSpec = z.infer<typeof layoutSchema>;
export type LayoutSlide = z.infer<typeof layoutSlideSchema>;
export type LayoutElement = z.infer<typeof layoutElementSchema>;
export type Box = z.infer<typeof boxSchema>;
