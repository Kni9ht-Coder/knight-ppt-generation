import { z } from "zod";
import { languageSchema } from "./brief.js";
import {
  evidenceItemSchema,
  presentationModeSchema,
  researchRoleSchema,
  visualSpecSchema
} from "./research.js";

export const contentSlideSchema = z.object({
  id: z.string().min(1, "slide id 不能为空"),
  layout: z.enum(["cover", "section", "content", "two-column", "diagram", "table", "closing"]).default("content"),
  title: z.string().min(1, "标题不能为空"),
  researchRole: researchRoleSchema.optional(),
  subtitle: z.string().default(""),
  claim: z.string().default(""),
  bodyText: z.array(z.string().min(1)).max(6, "每页正文不超过 6 条").default([]),
  evidence: z.array(evidenceItemSchema).default([]),
  sourceRefs: z.array(z.string().min(1)).default([]),
  tableData: z.array(z.array(z.string())).optional(),
  visualType: z.enum(["none", "diagram", "chart", "table", "image"]).default("none"),
  visualDescription: z.string().default(""),
  visualSpec: visualSpecSchema.default({
    purpose: "无",
    type: "none",
    sourceRefs: [],
    expectedElements: [],
    caption: ""
  }),
  speakerNotes: z.string().default(""),
  chartData: z.object({
    type: z.enum(["bar", "line", "pie", "radar"]).optional(),
    categories: z.array(z.string()).optional(),
    series: z.array(z.object({
      name: z.string(),
      values: z.array(z.number())
    })).optional()
  }).optional()
});

const contentBaseSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    language: languageSchema,
    mode: presentationModeSchema,
    slideCount: z.number().int().min(1).max(40)
  }),
  slides: z.array(contentSlideSchema).min(1, "至少需要 1 页")
});

export const contentSchema = contentBaseSchema.superRefine((content, ctx) => {
  content.slides.forEach((slide, index) => {
    const evidenceFields = slide.evidence.flatMap((item) => [item.claim, item.source, item.detail, item.metric ?? ""]);
    const visualSpecFields = [
      slide.visualSpec.purpose,
      ...slide.visualSpec.sourceRefs,
      ...slide.visualSpec.expectedElements,
      slide.visualSpec.caption
    ];
    const textFields = [
      slide.title,
      slide.subtitle,
      slide.claim,
      ...slide.bodyText,
      ...evidenceFields,
      slide.visualDescription,
      ...visualSpecFields,
      slide.speakerNotes
    ];
    if (textFields.some(hasPlaceholderText)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index],
        message: "内容中不能包含待补充、TODO、XXX 等占位文本"
      });
    }
  });

  if (content.meta.mode !== "research-report") {
    return;
  }

  content.slides.forEach((slide, index) => {
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

    if (slide.claim.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "claim"],
        message: "科研汇报正文页必须提供明确的核心论点 claim"
      });
    }

    if (slide.bodyText.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "bodyText"],
        message: "科研汇报正文页至少需要 3 条有信息量的正文要点"
      });
    }

    const bodyTextLength = slide.bodyText.join("").trim().length;
    const hasEnoughBodyText = bodyTextLength >= 90;
    const hasVisualWithBodyText = slide.visualType !== "none" && bodyTextLength >= 60;
    if (!hasEnoughBodyText && !hasVisualWithBodyText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "bodyText"],
        message: "科研汇报正文页正文信息量不足，需要补充方法细节、实验条件、数据解释或局限分析"
      });
    }

    if (slide.evidence.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "evidence"],
        message: "科研汇报正文页至少需要 1 条可溯源证据"
      });
    }

    if (slide.speakerNotes.trim().length < 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "speakerNotes"],
        message: "科研汇报正文页必须提供可用于讲解的 speakerNotes，且不能过短"
      });
    }

    if (slide.visualType !== "none" && slide.visualSpec.type !== slide.visualType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "visualSpec", "type"],
        message: "visualSpec.type 必须与 visualType 保持一致"
      });
    }

    if (slide.visualType === "table" && (!slide.tableData || slide.tableData.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "tableData"],
        message: "表格页必须提供 tableData，且至少包含表头和一行数据"
      });
    }

    if (slide.visualType === "chart" && (!slide.chartData?.categories?.length || !slide.chartData?.series?.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "chartData"],
        message: "图表页必须提供 chartData.categories 和 chartData.series"
      });
    }

    if ((slide.researchRole === "main-results" || slide.researchRole === "ablation") && slide.visualType !== "table" && slide.visualType !== "chart") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "visualType"],
        message: "主结果和消融实验页必须使用 table 或 chart 承载数据"
      });
    }
  });
});

function hasPlaceholderText(value: string): boolean {
  return /待补充|TODO|XXX|TBD/i.test(value);
}

export type ContentSpec = z.infer<typeof contentSchema>;
export type ContentSlide = z.infer<typeof contentSlideSchema>;
