import { z } from "zod";
import { languageSchema } from "./brief.js";
import { presentationModeSchema, researchRoleSchema } from "./research.js";
import type { ResearchRole } from "./research.js";

export const outlineSlideSchema = z.object({
  id: z.string().min(1, "slide id 不能为空"),
  layout: z.enum(["cover", "section", "content", "two-column", "diagram", "table", "closing"]).default("content"),
  title: z.string().min(1, "标题不能为空"),
  researchRole: researchRoleSchema.optional(),
  keyPoints: z.array(z.string().min(1)).max(6, "每页要点不超过 6 条").default([]),
  visualType: z.enum(["none", "diagram", "chart", "table", "image"]).default("none")
});

const outlineBaseSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    language: languageSchema,
    mode: presentationModeSchema,
    slideCount: z.number().int().min(1).max(40)
  }),
  slides: z.array(outlineSlideSchema).min(1, "至少需要 1 页")
});

export const outlineSchema = outlineBaseSchema.superRefine((outline, ctx) => {
  if (outline.meta.mode !== "research-report") {
    return;
  }

  const roles = new Set(outline.slides.map((slide) => slide.researchRole));
  const requiredRoles: ResearchRole[] = ["problem", "method-overview", "experiment-setup", "main-results", "conclusion"];

  for (const role of requiredRoles) {
    if (!roles.has(role)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides"],
        message: `科研汇报缺少必要页面角色：${role}`
      });
    }
  }

  outline.slides.forEach((slide, index) => {
    const isLightSlide = slide.layout === "cover" || slide.layout === "section" || slide.layout === "closing";
    if (!isLightSlide && !slide.researchRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "researchRole"],
        message: "科研汇报正文页必须声明 researchRole"
      });
    }

    if (!isLightSlide && slide.keyPoints.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "keyPoints"],
        message: "科研汇报正文页至少需要 3 条具体要点"
      });
    }
  });
});

export type OutlineSpec = z.infer<typeof outlineSchema>;
export type OutlineSlide = z.infer<typeof outlineSlideSchema>;
