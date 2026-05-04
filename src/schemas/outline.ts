import { z } from "zod";
import { languageSchema } from "./brief.js";

export const outlineSlideSchema = z.object({
  id: z.string().min(1, "slide id 不能为空"),
  layout: z.enum(["cover", "section", "content", "two-column", "diagram", "table", "closing"]).default("content"),
  title: z.string().min(1, "标题不能为空"),
  keyPoints: z.array(z.string()).max(5, "每页要点不超过 5 条").default([]),
  visualType: z.enum(["none", "diagram", "chart", "table", "image"]).default("none")
});

export const outlineSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    language: languageSchema,
    slideCount: z.number().int().min(1).max(40)
  }),
  slides: z.array(outlineSlideSchema).min(1, "至少需要 1 页")
});

export type OutlineSpec = z.infer<typeof outlineSchema>;
export type OutlineSlide = z.infer<typeof outlineSlideSchema>;
