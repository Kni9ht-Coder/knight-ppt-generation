# PPT Generation Agent Rules

本仓库用于通过 Codex/OpenAI 自动生成可编辑 PowerPoint。

## 固定目标

- 输出格式固定为 `.pptx`。
- agent 只能生成 `DeckSpec JSON`、SVG 资产、图片 prompt、修复建议和代码变更。
- 不允许让模型直接生成 `.pptx` 二进制。
- PPT 文本必须使用 PowerPoint 原生文本框。
- 表格、形状、线条、页码、页眉页脚优先使用 PowerPoint 原生对象。
- 每一页必须先通过 schema 校验和布局校验，再进入渲染器。

## 图片与 SVG 规则

- 复杂封面图、章节插画、抽象场景图使用 OpenAI Image API，模型固定为 `gpt-image-2`。
- 不允许把正文、标题、图表标签烘焙到 AI 图片里。
- 流程图、架构图、图标、简单装饰图必须使用 SVG 或 PowerPoint 原生形状。
- SVG 必须经过 sanitizer，禁止 `script`、`foreignObject`、外链 `href`、事件属性。
- 如果用户要求“配图必须是 SVG”，复杂插图要么降级为 SVG 模板风格，要么走 raster-to-vectorize 流程；不要直接把 PNG 伪装为 SVG。

## 版式规则

- 坐标系统固定为 0-1000 归一化画布。
- 默认 PPT 画布为 16:9。
- 元素不得越界。
- 主要文本字号不低于 18，脚注不低于 9。
- 每页正文块建议不超过 5 条 bullet。
- 标题、正文、图形之间必须留出明确间距。
- 封面和章节页可以使用大图，但文字仍必须是 PPT 原生文本。

## 运行流程

固定流水线：

```text
brief -> deck spec -> validate -> asset generation -> validate assets -> render pptx
```

任何新功能都应保持这个边界：agent 负责意图、内容、结构和风格；renderer 负责可编辑 PPTX 的确定性落地。
