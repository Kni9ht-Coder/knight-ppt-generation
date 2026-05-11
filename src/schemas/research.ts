import { z } from "zod";

export const presentationModeSchema = z.enum(["general", "research-report", "business-review"]).default("general");

export const researchRoleSchema = z.enum([
  "cover",
  "motivation",
  "problem",
  "related-work",
  "method-overview",
  "method-detail",
  "experiment-setup",
  "main-results",
  "ablation",
  "analysis",
  "case-study",
  "limitations",
  "conclusion",
  "appendix"
]);

export const evidenceItemSchema = z.object({
  claim: z.string().min(1, "证据对应的结论不能为空"),
  source: z.string().min(1, "证据来源不能为空，例如 paper.pdf p.7 Table 2"),
  detail: z.string().min(1, "证据细节不能为空"),
  metric: z.string().optional()
});

export const visualSpecSchema = z.object({
  purpose: z.string().min(1, "视觉目的不能为空"),
  type: z.enum(["none", "diagram", "chart", "table", "image"]).default("none"),
  sourceRefs: z.array(z.string().min(1)).default([]),
  expectedElements: z.array(z.string().min(1)).default([]),
  caption: z.string().default("")
});

export type PresentationMode = z.infer<typeof presentationModeSchema>;
export type ResearchRole = z.infer<typeof researchRoleSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export type VisualSpec = z.infer<typeof visualSpecSchema>;
