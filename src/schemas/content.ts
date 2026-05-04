import { z } from "zod";
import { languageSchema } from "./brief.js";

export const contentSlideSchema = z.object({
  id: z.string().min(1, "slide id 不能为空"),
  layout: z.enum(["cover", "section", "content", "two-column", "diagram", "table", "closing"]).default("content"),
  title: z.string().min(1, "标题不能为空"),
  subtitle: z.string().default(""),
  bodyText: z.array(z.string()).default([]),
  tableData: z.array(z.array(z.string())).optional(),
  visualType: z.enum(["none", "diagram", "chart", "table", "image"]).default("none"),
  visualDescription: z.string().default(""),
  chartData: z.object({
    type: z.enum(["bar", "line", "pie", "radar"]).optional(),
    categories: z.array(z.string()).optional(),
    series: z.array(z.object({
      name: z.string(),
      values: z.array(z.number())
    })).optional()
  }).optional()
});

export const contentSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    language: languageSchema,
    slideCount: z.number().int().min(1).max(40)
  }),
  slides: z.array(contentSlideSchema).min(1, "至少需要 1 页")
});

export type ContentSpec = z.infer<typeof contentSchema>;
export type ContentSlide = z.infer<typeof contentSlideSchema>;
