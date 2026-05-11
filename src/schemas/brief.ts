import { z } from "zod";
import { presentationModeSchema } from "./research.js";

export const languageSchema = z.enum(["zh-CN", "en-US"]).default("zh-CN");

export const briefSchema = z.object({
  topic: z.string().min(1, "主题不能为空"),
  audience: z.string().min(1, "目标受众不能为空").default("业务负责人"),
  slideCount: z.number().int().min(1).max(40).default(8),
  language: languageSchema,
  mode: presentationModeSchema,
  style: z.string().min(1).default("专业、简洁、信息密度适中"),
  goals: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  template: z.string().optional()
});

export type BriefSpec = z.infer<typeof briefSchema>;
