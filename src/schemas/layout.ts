import { z } from "zod";
import { languageSchema } from "./brief.js";
import { presentationModeSchema, researchRoleSchema } from "./research.js";

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
  role: z.enum([
    "title",
    "subtitle",
    "claim",
    "body",
    "evidence",
    "metric",
    "caption",
    "footer",
    "label",
    "decoration",
    "visual"
  ]).optional(),
  box: boxSchema,
  content: z.string().optional(),
  visualType: z.enum(["diagram", "chart", "table", "image"]).optional()
});

export const layoutSlideSchema = z.object({
  id: z.string().min(1, "slide id 不能为空"),
  layout: z.enum(["cover", "section", "content", "two-column", "diagram", "table", "closing"]).default("content"),
  title: z.string().min(1, "标题不能为空"),
  researchRole: researchRoleSchema.optional(),
  elements: z.array(layoutElementSchema).min(3, "每页至少需要 3 个元素")
});

const layoutBaseSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    language: languageSchema,
    mode: presentationModeSchema,
    slideCount: z.number().int().min(1).max(40)
  }),
  slides: z.array(layoutSlideSchema).min(1, "至少需要 1 页")
});

export const layoutSchema = layoutBaseSchema.superRefine((layout, ctx) => {
  if (layout.meta.mode !== "research-report") {
    return;
  }

  layout.slides.forEach((slide, index) => {
    const isLightSlide = slide.layout === "cover" || slide.layout === "section" || slide.layout === "closing";
    if (isLightSlide) {
      return;
    }

    if (!slide.researchRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "researchRole"],
        message: "科研汇报正文页必须声明 researchRole"
      });
    }

    const roles = new Set(slide.elements.map((element) => element.role));
    if (!roles.has("title")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "elements"],
        message: "科研汇报正文页必须包含 title 元素"
      });
    }

    if (!roles.has("claim")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "elements"],
        message: "科研汇报正文页必须包含 claim 元素，用于承载本页核心结论"
      });
    }

    const bodyElements = slide.elements.filter((element) => element.role === "body" || element.role === "evidence");
    if (bodyElements.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "elements"],
        message: "科研汇报正文页至少需要 2 个 body/evidence 信息块"
      });
    }

    if (needsVisual(slide.researchRole) && !roles.has("visual")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "elements"],
        message: "方法、实验、结果、分析类页面必须包含 visual-placeholder 或 visual 元素"
      });
    }
  });
});

function needsVisual(role: z.infer<typeof researchRoleSchema> | undefined): boolean {
  return role === "method-overview" ||
    role === "method-detail" ||
    role === "experiment-setup" ||
    role === "main-results" ||
    role === "ablation" ||
    role === "analysis" ||
    role === "case-study";
}

export type LayoutSpec = z.infer<typeof layoutSchema>;
export type LayoutSlide = z.infer<typeof layoutSlideSchema>;
export type LayoutElement = z.infer<typeof layoutElementSchema>;
export type Box = z.infer<typeof boxSchema>;
