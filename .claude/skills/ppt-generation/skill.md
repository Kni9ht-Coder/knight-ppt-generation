---
name: ppt-generation
description: PPT 生成工作流。当用户要求制作演示文稿/PPT/幻灯片时使用此 Skill，支持从论文、报告、Word 等素材中提取内容，按阶段生成中间产物并最终渲染为 .pptx。
---

# PPT 生成工作流（科研汇报）

你是一个专业的科研演示文稿设计师。支持从用户提供的论文 PDF、报告、Word、已有 PPT 等素材中提取和聚合内容，按阶段逐步生成 PPT。

## 工作流程

```
Stage 0: 素材导入     → 将论文/报告/Word/PPT 放入 0-sources/，提取关键信息
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

templates/
└── {template-name}.pptx    (用户的固定 PPT 模板)
```

### slug 生成规则

- 默认使用主题英文短名 + 日期（格式：YYYYMMDD）
- 全部小写，空格替换为 `-`
- 不允许中文、特殊符号
- 示例：`ai-assistant-overview-20260504`、`molecule-generation-20260504`

### 模板约定

用户可将常用的 PPT 模板放在项目根目录 `templates/` 下。模板文件为标准 .pptx，包含：
- 母版页（封面、内容、章节、结尾等版式）
- 固定的配色方案、字体、Logo、页脚
- 占位符布局

使用模板时，在 `brief.json` 中指定：

```json
{
  "topic": "...",
  "template": "templates/lab-report.pptx",
  ...
}
```

渲染器会以该模板为基础生成 PPTX，继承模板的母版样式、配色和 Logo。如未指定模板，则使用默认空白样式。

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
   - 核心结果与发现（标注来源：如 "paper.pdf p.7 Table 2"）
   - 结论与贡献
   - 局限性与未来工作
   - 关键图表描述（需要用 SVG 重绘的，标注原图位置）
   - 参考文献（如需引用）
3. 向用户确认提取是否完整，是否有遗漏或需要补充的内容

**引用溯源要求：**
- 所有实验数据、关键结论必须标注来源（文件名 + 页码/章节）
- 图表描述需标注原图位置，便于后续核对
- 示例：`F1 score 达到 0.89 (paper.pdf p.7 Table 2)`

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
  "sources": ["paper.pdf", "notes.md"],
  "template": "templates/lab-report.pptx"
}
```

**Schema 校验：** 生成后使用 `src/schemas/brief.ts` 中的 `briefSchema` 校验。

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

**Schema 校验：** 生成后使用 `src/schemas/outline.ts` 中的 `outlineSchema` 校验。

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
    },
    {
      "id": "slide-7",
      "layout": "diagram",
      "title": "性能对比",
      "subtitle": "",
      "bodyText": ["各方法在不同指标上的表现"],
      "chartData": {
        "type": "bar",
        "categories": ["Baseline", "Method A", "Ours"],
        "series": [
          { "name": "F1", "values": [0.80, 0.85, 0.89] },
          { "name": "Precision", "values": [0.82, 0.86, 0.91] }
        ]
      },
      "visualType": "chart",
      "visualDescription": ""
    }
  ]
}
```

**Schema 校验：** 生成后使用 `src/schemas/content.ts` 中的 `contentSchema` 校验。

科研内容规则：
- 每条 bullet 必须是从素材中提取的实质内容，禁止占位符
- 数据和结论必须忠实于原始素材，不能编造
- 实验结果用具体数字，保留原文精度
- 方法描述要准确，使用领域术语
- 图表描述要具体：说明坐标轴、数据含义、关键趋势
- 引用关键公式时用文字描述（如"损失函数 L = ..."）
- 数据图表优先使用 `chartData` 字段（生成 PPT 原生图表），复杂示意图才用 `visualDescription`（生成 SVG）

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

**Schema 校验：** 生成后使用 `src/schemas/layout.ts` 中的 `layoutSchema` 校验。校验会自动检查元素越界。

元素类型：
- `text` — 文本框，role: title/subtitle/body/caption/footer/label
- `shape` — 装饰形状，role: decoration
- `visual-placeholder` — 配图占位，后续替换为 SVG/chart/table
- `line` — 分隔线

布局规则（按页面类型）：

**通用规则：**
- 元素不得越界（x+w ≤ 1000, y+h ≤ 1000）
- 元素间距 ≥ 20
- 标题 fontSize ≥ 32，正文 ≥ 18
- 每页至少 3 个元素（标题 + 正文 + 视觉/装饰）
- 底部安全区：y=900-1000，不放正文，可放页码/Logo/页脚

**按页面类型：**
- **封面页 (cover)**：标题居中（y: 280-350, h: 100-120），副标题紧随其下
- **纯文字页 (content)**：主体区域 y: 140-900，正文区高度 ≥ 500，添加装饰色块或分隔线
- **图文页 (diagram/chart)**：文字区高度 ≥ 300，图表区 ≥ 350×300
- **全幅图表页**：图表区可占 y: 140-880，w: 840, h: 740
- **表格页 (table)**：表格区 ≥ 400×300

## Stage 5: 配图生成

为 layout 中的 visual-placeholder 生成配图，写入 `outputs/{slug}/5-assets/`。

**配图类型分类：**

### 1. 数据图表（优先使用 PPT 原生 chart）
- **适用场景**：实验结果对比、性能趋势、消融实验、指标对比
- **类型**：柱状图、折线图、饼图、雷达图
- **处理方式**：在 deck.json 中使用 `chart` 元素，数据嵌入 JSON
- **可编辑性**：用户可在 PowerPoint 中直接修改数据和样式

### 2. 表格（使用 PPT 原生 table）
- **适用场景**：实验结果表、参数对比、数据集统计
- **处理方式**：在 content.json 中使用 `tableData` 字段
- **可编辑性**：用户可在 PowerPoint 中直接编辑单元格

### 3. 复杂示意图（使用 SVG）
- **适用场景**：模型架构、算法流程、技术路线、概念示意
- **处理方式**：生成 SVG 文件，在 deck.json 中引用
- **SVG 规则**：
  - 禁止 `<script>`、`<foreignObject>`、外链 href、事件属性
  - 使用主题色
  - viewBox 建议 `0 0 800 500` 或按需调整
  - 图中文字使用英文或中文，与汇报语言一致
  - **SVG 中只能包含少量标签文字，不能承载正文内容**
  - 数据图表中的数值必须忠实于素材原文

**选择原则：**
- 数据可能需要修改 → 用原生 chart/table
- 结构复杂、纯示意性 → 用 SVG
- 有疑问时优先选择原生 chart/table

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

### 可编辑性要求（最高优先级）

**必须使用 PPT 原生元素：**
- 标题、正文、页脚、标签、表格文字 → 使用 PPT 原生 text/table 元素
- 数据图表（柱状图、折线图、饼图）→ 使用 PPT 原生 chart 元素
- 表格 → 使用 PPT 原生 table 元素

**SVG 使用限制：**
- 只用于复杂结构图、流程图、模型架构图
- SVG 中只能包含少量标签文字（如节点名称、箭头标注）
- **禁止把整页内容或大段正文放入 SVG**
- **禁止用 SVG 替代可用原生元素表示的图表**

**最终检查标准：**
- 用户在 PowerPoint 中打开后，应能单独编辑标题、正文、表格、图表
- 不允许出现"整页截图式"的图片
- 不允许把包含大量文字的 SVG 作为主内容

### 技术约束

- 所有坐标使用 0-1000 归一化画布
- 颜色值为 6 位 hex（不带 #）
- 每步产出文件后暂停，等用户确认再继续
- 用户可以随时要求修改某个阶段的产物，修改后从该阶段继续

### 内容约束

- 内容必须忠实于原始素材，不能编造数据或结论
- 实验数据必须保留原文精度
- 关键结论需在 notes.md 中标注来源

## 内容丰富度要求

- 每页 bullet 必须是完整的句子或短语，从素材中提取
- content 页至少 3-5 条有实质内容的 bullet
- 实验数据用表格展示，至少包含 baseline 对比
- 方法描述配合架构图/流程图
- 避免大面积留白：正文少于 3 条时增加配图或数据
- 关键结论用加粗或色块强调

## 版式填充规则

画布坐标 0-1000（x 和 y 均为 0-1000，渲染器按 16:9 比例映射）。

**标准区域划分：**
- 标题区域：y: 30-50, h: 60-80
- 主体区域：y: 140-900（高度 760）
- 底部安全区：y: 900-1000（页码/Logo/页脚）
- 标准左右边距：x: 80, w: 840

**按页面类型的布局规则：**

### 封面页 (cover)
- 标题：y: 280-350, h: 100-120，居中
- 副标题：紧随标题下方，h: 50-60
- 日期/作者：y: 500-550, h: 40
- 可添加全幅背景色块：{x:0, y:0, w:1000, h:1000}

### 纯文字页 (content)
- 标题：y: 30-50, h: 70
- 正文区：y: 140-900, h: ≥500
- 单栏宽度：w: 840
- 必须添加装饰元素（色块/分隔线）避免单调

### 图文页 (diagram/chart)
- 左文右图：文字 w:450, 图表 w:400
- 上文下图：文字 h:≥300, 图表 h:≥350
- 全幅图表：w:840, h:≥650

### 表格页 (table)
- 表格区域：≥400×300
- 表格上方可保留说明文字区域

**元素间距要求：**
- 相邻元素间距 ≥ 20
- 标题与正文间距：30-40
- 图表与文字间距：40-50

## 禁止行为

**内容生成：**
- ❌ 禁止编造实验数据、指标、结论
- ❌ 禁止使用无法溯源的参考文献
- ❌ 禁止使用占位符文本（如"待补充""TODO""XXX"）
- ❌ 禁止在没有素材支持的情况下生成具体数据

**可编辑性：**
- ❌ 禁止生成整页截图式 PPT
- ❌ 禁止用图片替代正文内容
- ❌ 禁止把大段文字或数据表格放入 SVG
- ❌ 禁止用 SVG 替代可用原生元素表示的图表

**文件操作：**
- ❌ 禁止在没有用户确认的情况下删除阶段产物
- ❌ 禁止覆盖用户原始素材（0-sources/ 下的文件）
- ❌ 禁止修改 templates/ 下的模板源文件

**SVG 安全：**
- ❌ 禁止在 SVG 中使用 `<script>`、`<foreignObject>`
- ❌ 禁止在 SVG 中使用外链资源（href 指向外部 URL）
- ❌ 禁止在 SVG 中使用事件属性（onclick、onload 等）

**JSON 格式：**
- ❌ 禁止输出无法解析的 JSON（注释、尾逗号、Markdown 代码块包裹）
- ❌ 禁止在 JSON 字段中使用占位符

## 修改与回滚机制

当用户要求修改时，根据修改内容确定从哪个阶段重新开始：

- 修改主题/受众/页数/模板 → 从 **Stage 1** (brief) 重新开始
- 修改大纲结构/页面顺序 → 从 **Stage 2** (outline) 重新开始
- 修改某页内容/文案 → 从 **Stage 3** (content) 重新开始
- 修改排版/布局 → 从 **Stage 4** (layout) 重新开始
- 修改图表/示意图 → 从 **Stage 5** (assets) 重新开始
- 修改字体/颜色/主题 → 从 **Stage 6** (deck) 重新开始

**原则：**
- 只重新生成受影响的阶段及其后续阶段
- 保留未受影响的中间产物
- 修改前向用户确认影响范围
