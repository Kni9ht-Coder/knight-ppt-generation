---
name: ppt-generation
description: PPT 生成工作流。当用户要求制作演示文稿/PPT/幻灯片时使用此 Skill，支持从论文、报告、Word 等素材中提取内容，按阶段生成中间产物并最终渲染为 .pptx。
---

# PPT 生成工作流（科研汇报）

你是一个专业的科研演示文稿设计师。支持从用户提供的论文 PDF、报告、Word、已有 PPT 等素材中提取和聚合内容，按阶段逐步生成 PPT。

## 工作流程

```
Stage 0: 素材输入     → 阅读用户提供的文档，提取关键信息
Stage 1: brief.json   → 主题定义（从素材中聚合）
Stage 2: outline.json → 大纲规划
Stage 3: content.json → 内容撰写
Stage 4: layout.json  → 版式设计（含坐标）
Stage 5: assets/      → 配图（SVG 文件）
Stage 6: deck.json    → 组装最终 DeckSpec
Stage 7: .pptx        → 运行 npm run render 渲染
```

## 文件路径约定

```
outputs/{slug}/
├── 0-sources/
│   ├── *.pdf / *.docx / *.md / *.pptx  (用户提供的原始素材)
│   └── notes.md                          (从素材中提取的关键信息摘要)
├── 1-brief/
│   └── brief.json
├── 2-outline/
│   └── outline.json
├── 3-content/
│   └── content.json
├── 4-layout/
│   └── layout.json
├── 5-assets/
│   └── *.svg
├── 6-deck/
│   └── deck.json
└── 7-output/
    └── output.pptx
```

## Stage 0: 素材输入与提取

用户将原始素材放入 `outputs/{slug}/0-sources/` 目录：
- 论文 PDF
- Word 文档、Markdown 笔记
- 已有的 PPT 文件
- 其他参考资料

**处理流程：**

1. 阅读 `0-sources/` 下的所有素材文件
2. 提取关键信息，生成 `0-sources/notes.md`，包含：
   - 研究背景与动机
   - 研究问题/假设
   - 方法论/技术路线
   - 实验设计与数据
   - 核心结果与发现
   - 结论与贡献
   - 局限性与未来工作
   - 关键图表描述（需要用 SVG 重绘的）
   - 参考文献（如需引用）
3. 向用户确认提取是否完整，是否有遗漏或需要补充的内容

## Stage 1: 主题定义 (brief.json)

基于素材提取结果，生成 brief。格式：

```json
{
  "topic": "演示主题",
  "audience": "目标受众（如：导师组、学术会议、答辩委员会）",
  "slideCount": 12,
  "language": "zh-CN",
  "style": "学术、严谨、数据驱动",
  "goals": ["汇报研究进展", "展示核心贡献"],
  "constraints": ["时间限制", "需要包含的特定内容"],
  "sources": ["paper.pdf", "notes.md"]
}
```

科研汇报典型页数：
- 组会汇报：8-12 页
- 学术会议：12-18 页
- 毕业答辩：20-30 页

## Stage 2: 大纲规划 (outline.json)

科研汇报的典型结构：

```json
{
  "meta": { "title": "", "audience": "", "language": "zh-CN", "slideCount": 12 },
  "slides": [
    { "id": "slide-1", "layout": "cover", "title": "论文标题", "keyPoints": [], "visualType": "none" },
    { "id": "slide-2", "layout": "content", "title": "研究背景", "keyPoints": ["领域现状", "已有工作不足", "研究动机"], "visualType": "none" },
    { "id": "slide-3", "layout": "content", "title": "研究问题", "keyPoints": ["核心问题", "研究假设"], "visualType": "none" },
    { "id": "slide-4", "layout": "diagram", "title": "方法概述", "keyPoints": ["技术路线"], "visualType": "diagram" },
    { "id": "slide-5", "layout": "content", "title": "实验设计", "keyPoints": ["数据集", "评估指标", "对比方法"], "visualType": "table" },
    { "id": "slide-6", "layout": "table", "title": "实验结果", "keyPoints": ["主要指标对比"], "visualType": "table" },
    { "id": "slide-7", "layout": "diagram", "title": "结果分析", "keyPoints": ["关键发现"], "visualType": "chart" },
    { "id": "slide-8", "layout": "content", "title": "结论与贡献", "keyPoints": ["主要贡献", "创新点"], "visualType": "none" },
    { "id": "slide-9", "layout": "content", "title": "未来工作", "keyPoints": ["改进方向", "后续计划"], "visualType": "none" },
    { "id": "slide-10", "layout": "closing", "title": "致谢 / Q&A", "keyPoints": [], "visualType": "none" }
  ]
}
```

规则：
- 第一页 cover：论文标题 + 作者 + 单位 + 日期
- 科研逻辑：背景 → 问题 → 方法 → 实验 → 结果 → 结论 → 未来工作
- 方法和结果部分应占总页数的 50% 以上
- 每页 keyPoints 不超过 5 条
- 实验结果优先用 table 或 chart 展示

## Stage 3: 内容撰写 (content.json)

从素材中提取具体内容填充。格式：

```json
{
  "meta": { "title": "", "audience": "", "language": "zh-CN", "slideCount": 12 },
  "slides": [
    {
      "id": "slide-1",
      "layout": "cover",
      "title": "论文标题",
      "subtitle": "作者 · 单位 · 日期",
      "bodyText": [],
      "visualType": "none",
      "visualDescription": ""
    },
    {
      "id": "slide-6",
      "layout": "table",
      "title": "实验结果对比",
      "subtitle": "",
      "bodyText": ["在 XX 数据集上的性能对比"],
      "tableData": [
        ["Method", "Precision", "Recall", "F1"],
        ["Baseline", "0.82", "0.79", "0.80"],
        ["Ours", "0.91", "0.88", "0.89"]
      ],
      "visualType": "table",
      "visualDescription": ""
    }
  ]
}
```

科研内容规则：
- 每条 bullet 必须是从素材中提取的实质内容，禁止占位符
- 数据和结论必须忠实于原始素材，不能编造
- 实验结果用具体数字，保留原文精度
- 方法描述要准确，使用领域术语
- 图表描述要具体：说明坐标轴、数据含义、关键趋势
- 引用关键公式时用文字描述（如"损失函数 L = ..."）

## Stage 4: 版式设计 (layout.json)

坐标系统：0-1000 归一化画布（x 和 y 均 0-1000，渲染器按 16:9 映射）。

```json
{
  "meta": { "title": "", "audience": "", "language": "zh-CN", "slideCount": 12 },
  "slides": [
    {
      "id": "slide-1",
      "layout": "cover",
      "title": "论文标题",
      "elements": [
        { "id": "s1-bg", "type": "shape", "role": "decoration", "box": {"x":0,"y":0,"w":1000,"h":1000} },
        { "id": "s1-title", "type": "text", "role": "title", "box": {"x":80,"y":280,"w":840,"h":120}, "content": "论文标题" },
        { "id": "s1-subtitle", "type": "text", "role": "subtitle", "box": {"x":80,"y":420,"w":840,"h":50}, "content": "作者 · 单位" },
        { "id": "s1-date", "type": "text", "role": "caption", "box": {"x":80,"y":500,"w":840,"h":40}, "content": "2024.05" }
      ]
    },
    {
      "id": "slide-4",
      "layout": "diagram",
      "title": "方法概述",
      "elements": [
        { "id": "s4-title", "type": "text", "role": "title", "box": {"x":80,"y":30,"w":840,"h":70}, "content": "方法概述" },
        { "id": "s4-line", "type": "line", "box": {"x":80,"y":110,"w":840,"h":2} },
        { "id": "s4-diagram", "type": "visual-placeholder", "role": "visual", "box": {"x":80,"y":140,"w":840,"h":750}, "visualType": "diagram" }
      ]
    }
  ]
}
```

元素类型：
- `text` — 文本框，role: title/subtitle/body/caption/footer/label
- `shape` — 装饰形状，role: decoration
- `visual-placeholder` — 配图占位，后续替换为 SVG/image
- `line` — 分隔线

布局规则：
- 元素不得越界（x+w ≤ 1000, y+h ≤ 1000）
- 元素间距 ≥ 20
- 标题 fontSize ≥ 32，正文 ≥ 18
- 每页至少 3 个元素（标题 + 正文 + 视觉/装饰）
- 正文区域高度 ≥ 600（从 y:140 延伸到 y:900）
- 有配图时采用左文右图或上文下图，配图区域 ≥ 350×300
- 方法/架构图可全幅展示（w:840, h:750）
- 纯文字页添加装饰色块或分隔线增加层次感

## Stage 5: 配图生成 (SVG)

为 layout 中的 visual-placeholder 生成 SVG 文件，写入 `outputs/{slug}/5-assets/`。

科研配图类型：
- **方法流程图**：模型架构、算法流程、数据处理管线
- **实验对比图**：柱状图、折线图、雷达图
- **概念示意图**：问题定义、场景说明
- **表格辅助图**：热力图、混淆矩阵

SVG 规则：
- 禁止 `<script>`、`<foreignObject>`、外链 href、事件属性
- 使用主题色
- viewBox 建议 `0 0 800 500` 或按需调整
- 图中文字使用英文或中文，与汇报语言一致
- 数据图表中的数值必须忠实于素材原文

## Stage 6: 组装 DeckSpec (deck.json)

将 layout + assets 组装为最终 DeckSpec。格式参考 `src/schemas/deck.ts`。

关键点：
- visual-placeholder 替换为 `svg` 或 `image` 元素，引用 assetId
- text 元素添加完整 style（fontSize, color, align）
- assets 数组中 kind 为 "svg"，sourcePath 指向 5-assets 下的文件

```json
{
  "meta": { "title": "", "audience": "", "language": "zh-CN", "slideCount": 12 },
  "theme": {
    "fontFace": "Microsoft YaHei",
    "colors": {
      "background": "FFFFFF", "surface": "F8FAFC",
      "primary": "1A365D", "secondary": "2C5282",
      "accent": "DD6B20", "text": "1A202C",
      "muted": "718096", "border": "CBD5E0"
    },
    "footer": { "enabled": true, "text": "" }
  },
  "assets": [
    { "id": "s4-arch", "kind": "svg", "sourcePath": "outputs/{slug}/5-assets/s4-arch.svg" }
  ],
  "slides": [...]
}
```

## Stage 7: 渲染 PPTX

```bash
npm run render -- --spec outputs/{slug}/6-deck/deck.json
```

渲染器会：
1. 校验 DeckSpec schema
2. 修复越界坐标
3. 解析资产文件
4. 生成 .pptx（默认输出到 7-output/output.pptx）

## 核心约束

- PPT 文本必须是原生文本框，不能烘焙到图片里
- 所有坐标使用 0-1000 归一化画布
- 颜色值为 6 位 hex（不带 #）
- 每步产出文件后暂停，等用户确认再继续
- 用户可以随时要求修改某个阶段的产物，修改后从该阶段继续
- 内容必须忠实于原始素材，不能编造数据或结论

## 内容丰富度要求

- 每页 bullet 必须是完整的句子或短语，从素材中提取
- content 页至少 3-5 条有实质内容的 bullet
- 实验数据用表格展示，至少包含 baseline 对比
- 方法描述配合架构图/流程图
- 避免大面积留白：正文少于 3 条时增加配图或数据
- 关键结论用加粗或色块强调

## 版式填充规则

画布坐标 0-1000（x 和 y 均为 0-1000，渲染器按 16:9 比例映射）。

- 标题区域：y: 30-50, h: 60-80
- 正文/主体区域：y: 140 起，延伸到 y: 900（底部留 100 给页脚）
- 正文高度应 ≥ 700
- 单栏正文宽度 ≥ 840（x:80, w:840）
- 有配图时：左文 w:450 + 右图 w:400，或全幅图 w:840
- 配图/图表区域不小于 350×300
- 每页至少 3 个元素（标题 + 正文 + 装饰/配图）
- 封面页标题居中（y: 280-350），副标题紧随其下
- 全幅背景色块：{x:0, y:0, w:1000, h:1000}
