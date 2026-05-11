---
name: ppt-generation
description: PPT 生成工作流。当用户要求制作、修改、校验或渲染演示文稿/PPT/PPTX/幻灯片时使用此 Skill；启动时先询问 PPT 主题并创建 outputs/{slug} 阶段目录，让用户放入 source 后等待继续；之后必须逐阶段生成并在每个阶段完成后停下等待用户检查确认，不能一次性完成全流程；支持从论文、报告、Word、Markdown、已有 PPT、素材目录、brief、DeckSpec JSON、SVG 资产和图片 prompt 生成中文可编辑 PPTX。图片生成必须使用 OpenAI Image API，模型固定为 gpt-image-2；默认最终 PPT 和所有阶段文案均为中文。
---

# PPT 生成工作流

你是一个专业的中文演示文稿设计与生成 Agent。目标是通过本仓库的确定性流水线生成可编辑 `.pptx`，而不是让模型直接生成 PowerPoint 二进制文件。

除非用户明确要求其他语言，所有阶段产物、页面标题、正文、图表说明、备注和最终 PPT 文案都必须使用中文，DeckSpec 中 `meta.language` 使用 `zh-CN`。

## 最高优先级边界

- 输出格式固定为 `.pptx`。
- Codex 只能生成 `brief.json`、`outline.json`、`content.json`、`layout.json`、`deck.json`、SVG 资产、图片 prompt、修复建议和代码变更。
- 不允许让模型直接生成 `.pptx` 二进制。
- 渲染器是唯一负责把 `DeckSpec JSON` 落地为 `.pptx` 的组件。
- PPT 文本必须使用 PowerPoint 原生文本框。
- 表格、形状、线条、页码、页眉页脚优先使用 PowerPoint 原生对象。
- 每一页必须先通过 schema 校验和布局校验，再进入渲染器。
- 不允许把正文、标题、表格、页脚或图表标签烘焙到图片中。
- 本 Skill 不允许被压缩成摘要版；必须保留阶段流程、产物格式、版式规则、图片规则、校验规则和禁止项。

## 固定流水线

固定执行顺序：

```text
topic -> create folders -> user adds sources -> notes + brief -> outline -> content -> layout -> assets -> deck spec -> validate -> render pptx
```

交互启动规则：

- 用户只说“开始 PPT 生成”“开始”“生成 PPT”但没有给主题时，只询问 PPT 主题，不生成任何阶段文件。
- 用户给出主题后，先生成 slug，并创建 `outputs/{slug}/0-素材/` 到 `7-输出/` 的阶段目录；随后立即停止，提示用户把素材放入 `0-素材/`。
- 如果用户一开始已经给出主题，也只创建阶段目录并停止，不要直接读取素材、生成 `brief.json` 或继续后续阶段。
- 用户把素材放入 `0-素材/` 并回复“继续”后，才开始读取素材。
- 读取素材后生成 `0-素材/notes.md` 和 `1-简报/brief.json`，完成必要校验，然后停止等待用户检查 brief。
- 如果用户回复“继续”但 `0-素材/` 没有可读素材，必须停止并询问是否允许基于主题直接生成，不能默认编造内容。

## 强制逐阶段确认门禁

默认必须采用交互式分阶段生成。每次用户确认最多推进一个阶段；完成该阶段内部必要的校验和摘要说明后必须停止，等待用户检查并明确回复继续。禁止在同一轮中继续执行下一阶段，更禁止从主题或 brief 一次性跑到 render。

门禁规则：

- 启动阶段：拿到主题后只创建目录并停止，等待用户放入素材。
- Stage 0/1：用户放入素材并确认继续后，读取素材，生成 `notes.md` 和 `brief.json` 并校验，然后停止，等待用户确认素材提取、主题、受众、页数、风格和限制。
- Stage 2 完成 `outline.json` 并校验后停止，等待用户确认页序、标题、页面类型和视觉类型。
- Stage 3 完成 `content.json` 并校验后停止，等待用户确认每页文案、表格数据、图表数据和备注。
- Stage 4 完成 `layout.json` 并校验后停止，等待用户确认版式、坐标、安全区和信息密度。
- Stage 5 完成资产、SVG 或图片 prompt，并通过资产校验后停止，等待用户确认视觉资产。
- Stage 6 完成 `deck.json`、schema 校验和布局校验后停止，等待用户确认 DeckSpec 可以进入渲染。
- Stage 7 只能在用户明确确认可以渲染后运行，渲染完成后给出 `.pptx` 路径和校验结果。

继续条件：

- 用户回复“继续”“确认”“下一步”“进入 Stage N”“可以渲染”等明确指令后，才可进入下一阶段。
- 如果用户要求修改当前阶段，只修改当前阶段及后续受影响阶段，不自动跨过新的确认门禁。
- 如果用户要求“开始 PPT 生成”但没有给主题，只询问主题；如果已经给主题，只创建阶段目录并停止。
- 即使用户提供了完整主题和素材，也必须逐阶段暂停确认。

阶段完成时的回复格式：

```text
已完成：{阶段名称}
产物：outputs/{slug}/{stage-dir}/{file}
校验：通过/未通过，关键问题如下
请检查该阶段内容。确认后我再进入下一阶段。
```

分阶段工程产物使用以下目录结构：

```text
outputs/{slug}/
├── 0-素材/
│   ├── *.pdf / *.docx / *.md / *.pptx
│   └── notes.md
├── 1-简报/
│   └── brief.json
├── 2-大纲/
│   └── outline.json
├── 3-内容/
│   └── content.json
├── 4-版式/
│   └── layout.json
├── 5-资产/
│   └── *.svg / *.png / image-prompts.json
├── 6-渲染规格/
│   └── deck.json
└── 7-输出/
    └── output.pptx

templates/
└── {template-name}.pptx
```

## Slug 与文件约定

- 默认 slug 使用主题英文短名 + 日期，格式为 `kebab-case-YYYYMMDD`。
- slug 不使用中文，不使用特殊符号。
- 示例：`ai-assistant-overview-20260504`、`molecule-generation-20260504`。
- 不覆盖用户原始素材。
- 不删除既有阶段产物，除非用户明确要求。
- 不修改 `templates/` 下的模板源文件。
- 如果需要重新生成某阶段，只重新生成该阶段及其后续受影响文件。

## 模板约定

用户可将固定 PPT 模板放在 `templates/` 下。模板文件为标准 `.pptx`，可包含：

- 母版页：封面、内容页、章节页、结尾页等。
- 固定配色、字体、Logo、页脚。
- 占位符布局。

使用模板时，在 `brief.json` 中指定：

```json
{
  "topic": "演示主题",
  "template": "templates/lab-report.pptx"
}
```

如果当前渲染器尚未完整支持模板继承，应明确说明实现状态，并优先通过 `DeckSpec` 的主题色、字体、页脚和元素布局模拟模板风格。

## Stage 0：启动、素材输入与提取

启动流程：

1. 如果用户没有给 PPT 主题，只问：“PPT 主题是什么？”不要追问受众、页数、风格等细节。
2. 用户给出主题后，生成 slug，并创建完整阶段目录。
3. 回复用户 `outputs/{slug}/0-素材/` 路径，请用户把 PDF、Word、Markdown、已有 PPT、数据表或笔记放入该目录。
4. 立即停止，等待用户回复“继续”。
5. 用户回复继续后，先列出 `0-素材/` 下素材；如果为空，停止询问是否允许基于主题直接生成。
6. 如果存在素材，读取所有可读素材，提取 `notes.md`，再生成 `brief.json`。
7. 完成 `notes.md` 和 `brief.json` 后停止，等待用户确认。

用户将原始素材放入：

```text
outputs/{slug}/0-素材/
```

可处理素材包括：

- 论文 PDF。
- Word 文档。
- Markdown 笔记。
- 已有 PPT。
- 报告、网页摘录、表格数据。
- 用户直接粘贴的文字资料。

处理流程：

1. 阅读 `0-素材/` 下所有可读素材。
2. 提取关键信息并生成 `0-素材/notes.md`。
3. 对实验数据、关键结论和图表描述标注来源。
4. 基于主题和素材生成 `1-简报/brief.json`。
5. 向用户确认 `notes.md` 与 `brief.json` 是否完整，除非用户明确要求修改，否则不进入 outline。

`notes.md` 应包含：

- 研究背景与动机。
- 核心问题或业务问题。
- 方法论、技术路线或解决方案框架。
- 实验设计、样本、数据来源和指标。
- 核心结果与发现。
- 结论、贡献、风险和局限。
- 关键图表描述及来源位置。
- 需要重绘为 SVG、原生表格或原生图表的图形说明。
- 参考文献或资料来源。

引用溯源格式：

```text
F1 score 达到 0.89（paper.pdf p.7 Table 2）
```

禁止：

- 编造实验数据。
- 编造来源。
- 使用没有素材支持的具体数字。
- 把无法溯源的结论写成确定事实。

## Stage 1：主题定义 brief.json

`brief.json` 用于确定主题、受众、页数、语言、风格、目标和限制。

路径：

```text
outputs/{slug}/1-简报/brief.json
```

格式：

```json
{
  "topic": "演示主题",
  "audience": "目标受众",
  "slideCount": 12,
  "language": "zh-CN",
  "mode": "research-report",
  "style": "学术、严谨、数据驱动",
  "goals": ["汇报研究进展", "展示核心贡献"],
  "constraints": ["时间限制", "需要包含的特定内容"],
  "sources": ["paper.pdf", "notes.md"],
  "template": "templates/lab-report.pptx"
}
```

校验准则：

- 使用 `src/schemas/brief.ts` 中的 `briefSchema`。
- `topic` 不能为空。
- `audience` 不能为空。
- `slideCount` 在 1-40 之间。
- 默认语言为 `zh-CN`。
- `mode` 默认为 `general`；科研汇报必须使用 `research-report`。
- 风格必须能指导内容密度、配色、字体和版式。

科研汇报典型页数：

- 组会汇报：8-12 页。
- 学术会议：12-18 页。
- 毕业答辩：20-30 页。

商业汇报典型页数：

- 高管简报：6-10 页。
- 项目方案：8-15 页。
- 战略规划：12-20 页。

## Stage 2：大纲规划 outline.json

`outline.json` 用于规划每页标题、页面类型、关键点和视觉类型。

路径：

```text
outputs/{slug}/2-大纲/outline.json
```

格式：

```json
{
  "meta": {
    "title": "演示标题",
    "audience": "目标受众",
    "language": "zh-CN",
    "mode": "research-report",
    "slideCount": 12
  },
  "slides": [
    {
      "id": "slide-1",
      "layout": "cover",
      "researchRole": "cover",
      "title": "论文标题",
      "keyPoints": [],
      "visualType": "none"
    },
    {
      "id": "slide-2",
      "layout": "content",
      "researchRole": "problem",
      "title": "研究问题与动机",
      "keyPoints": ["领域现状与约束", "已有方法的具体不足", "本文要解决的核心问题"],
      "visualType": "none"
    }
  ]
}
```

页面结构规则：

- 第一页通常为 `cover`。
- 最后一页通常为 `closing`。
- 科研汇报遵循：背景 -> 问题 -> 方法 -> 实验 -> 结果 -> 分析 -> 结论 -> 未来工作。
- 科研汇报必须覆盖 `problem`、`method-overview`、`experiment-setup`、`main-results`、`conclusion`。
- 科研汇报正文页必须声明 `researchRole`，并至少包含 3 条具体 `keyPoints`。
- 商业汇报遵循：背景/机会 -> 痛点 -> 方案 -> 价值 -> 路线图 -> 资源需求 -> 风险 -> 下一步。
- 方法、结果、方案或价值部分应占主要篇幅。
- 每页 `keyPoints` 不超过 6 条。
- 需要展示数据时优先用 `table` 或 `chart`。
- 复杂结构、方法流程、系统架构使用 `diagram`。

允许的 `layout`：

- `cover`
- `section`
- `content`
- `two-column`
- `diagram`
- `table`
- `closing`

允许的 `visualType`：

- `none`
- `diagram`
- `chart`
- `table`
- `image`

如果用户要求封面或章节页有复杂背景图，`visualType` 可使用 `image`，但文字仍必须是 PPT 原生文本。

## Stage 3：内容撰写 content.json

`content.json` 用于填充每页具体文案、表格数据、图表数据和视觉描述。

路径：

```text
outputs/{slug}/3-内容/content.json
```

格式：

```json
{
  "meta": {
    "title": "演示标题",
    "audience": "目标受众",
    "language": "zh-CN",
    "mode": "research-report",
    "slideCount": 12
  },
  "slides": [
    {
      "id": "slide-1",
      "layout": "cover",
      "researchRole": "cover",
      "title": "论文标题",
      "subtitle": "作者 · 单位 · 日期",
      "bodyText": [],
      "visualType": "none",
      "visualDescription": ""
    },
    {
      "id": "slide-6",
      "layout": "table",
      "researchRole": "main-results",
      "title": "实验结果对比",
      "subtitle": "",
      "claim": "本文方法在核心指标上稳定优于基线。",
      "bodyText": [
        "在相同测试集和评估协议下比较 Baseline 与本文方法。",
        "本文方法在 Precision、Recall 和 F1 三个指标上均取得提升。",
        "F1 的提升说明方法在精确率与召回率之间取得更好的平衡。"
      ],
      "evidence": [
        {
          "claim": "本文方法 F1 优于 Baseline",
          "source": "paper.pdf p.7 Table 2",
          "detail": "Baseline F1 为 0.80，本文方法 F1 为 0.89",
          "metric": "F1"
        }
      ],
      "tableData": [
        ["方法", "Precision", "Recall", "F1"],
        ["Baseline", "0.82", "0.79", "0.80"],
        ["本文方法", "0.91", "0.88", "0.89"]
      ],
      "visualType": "table",
      "visualDescription": "",
      "visualSpec": {
        "purpose": "用表格承载主结果对比，突出本文方法相对基线的指标差异",
        "type": "table",
        "sourceRefs": ["paper.pdf p.7 Table 2"],
        "expectedElements": ["方法列", "Precision", "Recall", "F1", "最佳结果高亮"],
        "caption": "主结果对比"
      },
      "speakerNotes": "讲解时先说明实验协议保持一致，再强调表格中本文方法在三个指标上的稳定提升。重点解释 F1 提升为什么能支撑本文方法有效，而不是只读出表格数字。"
    },
    {
      "id": "slide-7",
      "layout": "diagram",
      "researchRole": "analysis",
      "title": "性能对比",
      "subtitle": "",
      "claim": "不同方法在核心指标上存在稳定差距。",
      "bodyText": [
        "柱状图用于比较不同方法在 F1 与 Precision 上的差异。",
        "本文方法在两个指标上均高于 Baseline 和方法 A。",
        "结果差异应结合数据集规模、实验重复次数和统计显著性说明。"
      ],
      "evidence": [
        {
          "claim": "本文方法在 F1 和 Precision 上最高",
          "source": "paper.pdf p.8 Figure 3",
          "detail": "图中本文方法 F1=0.89，Precision=0.91",
          "metric": "F1 / Precision"
        }
      ],
      "chartData": {
        "type": "bar",
        "categories": ["Baseline", "方法 A", "本文方法"],
        "series": [
          { "name": "F1", "values": [0.80, 0.85, 0.89] },
          { "name": "Precision", "values": [0.82, 0.86, 0.91] }
        ]
      },
      "visualType": "chart",
      "visualDescription": "",
      "visualSpec": {
        "purpose": "将结果差异转化为可比较图表，便于现场快速说明趋势",
        "type": "chart",
        "sourceRefs": ["paper.pdf p.8 Figure 3"],
        "expectedElements": ["方法类别", "F1 系列", "Precision 系列", "图例"],
        "caption": "核心指标对比"
      },
      "speakerNotes": "讲解时避免只说本文方法最好，需要解释比较条件、指标含义和差异幅度。如果原文没有统计显著性，不要额外声称显著。"
    }
  ]
}
```

内容规则：

- 每条 bullet 必须是完整短语或句子。
- 每页正文建议 3-6 条 bullet。
- 科研汇报正文页必须包含 `claim`、`evidence`、`speakerNotes` 和 `visualSpec`。
- 科研汇报正文页必须有可溯源证据，`evidence.source` 使用 `paper.pdf p.7 Table 2` 这类格式。
- 科研汇报的主结果页和消融实验页必须使用 `tableData` 或 `chartData` 承载数据。
- 禁止使用“待补充”“TODO”“XXX”等占位文本。
- 科研内容必须忠实于原始素材。
- 实验数据必须保留原文精度。
- 结论必须能在 `notes.md` 中找到来源。
- 公式可用文字描述，避免用图片承载公式说明。
- 数据图表优先放入 `chartData` 或 `tableData`，不要画成 SVG 截图。
- 复杂示意图才使用 `visualDescription` 生成 SVG 或图片 prompt。

中文写作风格：

- 标题短、准、信息明确。
- 正文避免口号化空话。
- 面向高管时强调结论、影响、投入和下一步。
- 面向科研听众时强调问题、方法、实验设计、对比结果和局限。
- 不在 PPT 中堆长段落；需要长解释时放入备注。

## Stage 4：版式设计 layout.json

`layout.json` 用于规划页面中每个元素的位置和角色。

路径：

```text
outputs/{slug}/4-版式/layout.json
```

坐标系统：

- 画布为 0-1000 归一化坐标。
- `x` 和 `y` 范围为 0-1000。
- `w` 和 `h` 范围为 1-1000。
- `x + w <= 1000`。
- `y + h <= 1000`。
- 渲染器按 16:9 映射到 PowerPoint。

格式：

```json
{
  "meta": {
    "title": "演示标题",
    "audience": "目标受众",
    "language": "zh-CN",
    "mode": "research-report",
    "slideCount": 12
  },
  "slides": [
    {
      "id": "slide-1",
      "layout": "cover",
      "researchRole": "cover",
      "title": "论文标题",
      "elements": [
        {
          "id": "s1-bg",
          "type": "shape",
          "role": "decoration",
          "box": { "x": 0, "y": 0, "w": 1000, "h": 1000 }
        },
        {
          "id": "s1-title",
          "type": "text",
          "role": "title",
          "box": { "x": 80, "y": 280, "w": 840, "h": 120 },
          "content": "论文标题"
        },
        {
          "id": "s1-subtitle",
          "type": "text",
          "role": "subtitle",
          "box": { "x": 80, "y": 420, "w": 840, "h": 50 },
          "content": "作者 · 单位"
        }
      ]
    }
  ]
}
```

元素类型：

- `text`：文本框，role 可为 `title`、`subtitle`、`body`、`caption`、`footer`、`label`。
- 科研汇报文本框可使用 `claim`、`evidence`、`metric` role，分别承载本页结论、证据说明和关键指标。
- `shape`：装饰形状或内容容器。
- `line`：分隔线或连接线。
- `visual-placeholder`：配图、图表、表格或示意图占位。

通用布局规则：

- 每页至少包含标题、正文或视觉元素、装饰/结构元素。
- 科研汇报正文页至少包含 `title`、`claim`、2 个 `body/evidence` 信息块。
- 科研汇报的方法、实验、结果、分析和案例页必须包含 `visual-placeholder` 或等价视觉元素。
- 相邻元素间距至少 20。
- 标题与正文间距建议 30-40。
- 图表与文字间距建议 40-50。
- 底部安全区为 `y = 900-1000`，不放正文，可放页码、Logo、页脚。
- 标题字号不低于 32。
- 正文字号不低于 18。
- 脚注字号不低于 9。
- 避免文本框之间明显重叠。
- 避免大面积空白；正文少于 3 条时补充结构图、关键数字卡片或说明性图形。

标准区域：

- 标题区域：`y: 30-50`，`h: 60-80`。
- 主体区域：`y: 140-900`，高度约 760。
- 标准左右边距：`x: 80`，`w: 840`。

按页面类型的布局规则：

- 封面页：标题居中，`y: 280-350`，`h: 100-120`；副标题紧随标题；可用全幅背景形状或图片。
- 章节页：使用大标题、短说明和强视觉分隔，文字仍为原生文本。
- 纯文字页：正文区 `y: 140-900`，高度不低于 500；添加装饰色块或分隔线。
- 图文页：左文右图时文字宽约 450，图区宽约 400；上文下图时图区高度不低于 350。
- 全幅图表页：图表区可占 `x: 80, y: 140, w: 840, h: 650-740`。
- 表格页：表格区不低于 400 x 300，表格上方可放一句结论。
- 结尾页：保留行动项、联系方式或 Q&A，不放复杂信息。

## Stage 5：资产生成

资产目录：

```text
outputs/{slug}/5-资产/
```

资产类型包括：

- SVG：流程图、架构图、图标、简单装饰。
- AI raster：复杂封面图、章节插画、抽象场景图。
- 普通图片：用户提供或外部已授权图片。
- 图片 prompt：尚未生成图片时保存生成意图。

### 图片生成强制规则

- 所有 AI 图片生成必须使用 OpenAI Image API。
- 图片模型固定为 `gpt-image-2`。
- 禁止使用其他图片生成模型。
- 图片 prompt 必须明确“不要在图片中出现任何文字、标题、表格、标签、数字、Logo 或水印”，除非用户明确要求图片内存在非正文性质的极少量符号。
- 图片只提供视觉背景或氛围，正文必须仍为 PPT 原生文本框。
- 封面图、章节插画、复杂抽象场景图可以使用 AI raster。
- 流程图、架构图、图标、简单装饰不能使用 AI raster，应使用 SVG 或 PowerPoint 原生形状。

AI raster 资产声明使用以下约束：

```json
{
  "kind": "ai-raster",
  "model": "gpt-image-2",
  "quality": "medium",
  "size": "1536x1024",
  "outputFormat": "png"
}
```

如果当前代码 schema 尚未支持 `ai-raster`，应先提出或实现 schema/资产管线对齐；不要把 `gpt-image-2` 生成图片伪装成 SVG。

### SVG 规则

- SVG 必须是纯 SVG。
- 禁止 `<script>`。
- 禁止 `<foreignObject>`。
- 禁止外链 `href`。
- 禁止 `data:` href。
- 禁止事件属性，例如 `onclick`、`onload`。
- 禁止 iframe、object、embed。
- SVG 必须经过 sanitizer。
- SVG 中只能包含少量标签文字，不能承载正文内容。
- 如果文字需要可编辑，应改用 PPT 原生 `text` 元素。
- 数据图表不应使用 SVG，优先使用 PPT 原生 chart/table。

SVG 适用场景：

- 模型架构。
- 算法流程。
- 技术路线。
- 系统组件关系。
- 概念示意。
- 图标和装饰。

如果用户要求“配图必须是 SVG”：

- 复杂插图降级为 SVG 模板风格。
- 或走 raster-to-vectorize 流程。
- 不得把 PNG 伪装为 SVG。

### 数据图表

数据图表优先使用 PPT 原生 chart。

适用场景：

- 实验结果对比。
- 性能趋势。
- 消融实验。
- 指标对比。
- 业务指标变化。

原则：

- 数据可编辑时使用原生 chart。
- 表格数据可编辑时使用原生 table。
- 只有高度示意化、不要求数据可编辑时才考虑 SVG。

如果当前 renderer 尚未支持 chart 元素，应优先实施 renderer/schema 扩展，或在无法改代码时用原生 table 与形状组合表达，不要用图片替代可编辑数据。

## Stage 6：组装 DeckSpec deck.json

`deck.json` 是唯一允许进入渲染器的数据结构。

路径：

```text
outputs/{slug}/6-渲染规格/deck.json
```

组装规则：

- 将 `layout.json` 的 `visual-placeholder` 替换为 `svg`、`image`、`table` 或 chart 元素。
- 所有 text 元素添加完整 `style`。
- 所有 asset 引用必须存在。
- 所有颜色使用 6 位 hex，建议不带 `#`。
- 所有文本仍为中文，除专有名词、指标名或用户要求保留英文。
- 页脚和页码使用原生对象或 renderer chrome。
- 每页必须有明确标题元素，封面和结尾页除外时也应有清晰主标题。
- 科研汇报 DeckSpec 必须保留 `meta.mode: "research-report"` 和每页 `researchRole`。
- 科研汇报正文页必须包含 `claim` 文本元素、足够的 `body/evidence` 文本元素，以及可用于讲解的 `notes`。

DeckSpec 示例：

```json
{
  "meta": {
    "title": "演示标题",
    "audience": "目标受众",
    "language": "zh-CN",
    "mode": "research-report",
    "slideCount": 12
  },
  "theme": {
    "fontFace": "Microsoft YaHei",
    "colors": {
      "background": "FFFFFF",
      "surface": "F8FAFC",
      "primary": "174A7C",
      "secondary": "0F766E",
      "accent": "F28C28",
      "text": "172033",
      "muted": "64748B",
      "border": "CBD5E1"
    },
    "footer": {
      "enabled": true,
      "text": ""
    }
  },
  "assets": [
    {
      "id": "s4-arch",
      "kind": "svg",
      "sourcePath": "outputs/{slug}/5-资产/s4-arch.svg",
      "alt": "方法架构图"
    }
  ],
  "slides": [
    {
      "id": "slide-1",
      "layout": "cover",
      "researchRole": "cover",
      "title": "演示标题",
      "elements": [
        {
          "id": "s1-title",
          "type": "text",
          "text": "演示标题",
          "role": "title",
          "box": { "x": 80, "y": 280, "w": 840, "h": 100 },
          "style": {
            "fontSize": 40,
            "color": "172033",
            "align": "center"
          }
        }
      ]
    }
  ]
}
```

质量门禁：

- JSON 可解析，无注释、无尾逗号、无 Markdown 代码块包裹。
- 通过 `src/schemas/deck.ts` schema。
- `slideCount` 与 slides 数量一致。
- slide id 唯一。
- asset id 唯一。
- element id 在每页内唯一。
- 元素不越界。
- 文本字号满足要求。
- 文本块之间无明显重叠。
- 图片和 SVG 引用的 asset 存在。
- SVG 通过安全检查。
- 中文文案没有明显错别字和占位符。
- 科研汇报模式下，过空正文页、缺少核心论点或缺少讲稿备注均视为错误，必须修复后再渲染。

## Stage 7：渲染 PPTX

渲染命令：

```bash
npm run render -- --spec outputs/{slug}/6-渲染规格/deck.json
```

可选参数：

```bash
npm run render -- \
  --spec outputs/{slug}/6-渲染规格/deck.json \
  --assets-dir outputs/{slug}/5-资产 \
  --out outputs/{slug}/7-输出/output.pptx
```

常用检查：

```bash
npm run typecheck
npm run build
```

渲染前流程：

1. 读取 `deck.json`。
2. 执行 schema 校验。
3. 执行布局修复或布局校验。
4. 解析并校验资产。
5. 调用 renderer 输出 `.pptx`。

如果渲染失败：

- 先读错误信息。
- 判断是 schema、布局、资产路径、SVG sanitizer、renderer 支持范围还是环境问题。
- 修复源 JSON、SVG 或代码。
- 重新校验后再渲染。

## 可编辑性要求

必须使用 PPT 原生元素：

- 标题。
- 副标题。
- 正文。
- 页脚。
- 标签。
- 备注。
- 表格文字。
- 数据图表。
- 页码。
- 简单形状和线条。

SVG 使用限制：

- 只用于复杂结构图、流程图、模型架构图和装饰。
- SVG 中只能包含少量标签文字。
- 禁止把整页内容放入 SVG。
- 禁止把大段正文放入 SVG。
- 禁止把数据表格放入 SVG。
- 禁止用 SVG 替代可用原生对象表达的表格和图表。

最终检查标准：

- 用户在 PowerPoint 中能单独编辑标题、正文、表格和可编辑图表。
- 不出现整页截图式图片。
- 不出现包含大量文字的主内容 SVG。
- 图片不承担信息正文，只承担视觉背景或插画。

## 版式与视觉规范

字体：

- 默认中文字体使用 `Microsoft YaHei`。
- 科研汇报可使用更克制的无衬线风格。
- 避免混用过多字体。

颜色：

- 颜色值使用 6 位 hex。
- 默认主题可使用蓝橙或蓝绿橙组合。
- 保持背景、正文、强调色之间有足够对比度。
- 不使用过多高饱和颜色。
- 数据图表颜色数量与系列数量匹配。

信息密度：

- 一页只表达一个中心结论。
- 标题应表达主题或结论，而不是空泛分类。
- 每页正文建议 3-5 条。
- 每条 bullet 尽量不超过两行。
- 复杂内容拆页，不压缩字号。

图文关系：

- 图服务于结论，不做无关装饰。
- 图表旁边应有一句结论性说明。
- 架构图和流程图应突出主路径。
- 封面和章节页可使用大图，但文字仍为 PPT 原生文本。

## 内容丰富度要求

- 每页 bullet 必须有实质信息。
- 禁止只写“背景”“方案”“价值”这类空标签。
- 科研 PPT 的实验页至少包含关键数据、对比对象和结论。
- 商业 PPT 的方案页至少包含目标用户、场景、能力和价值。
- 路线图页必须包含阶段、时间或里程碑。
- 风险页必须包含风险、影响和应对措施。
- 结论页必须包含可执行下一步。

## 禁止行为

内容生成禁止：

- 禁止编造实验数据、指标、结论。
- 禁止使用无法溯源的参考文献。
- 禁止使用占位符文本。
- 禁止在没有素材支持时生成具体数字。
- 禁止把不确定信息写成确定事实。

可编辑性禁止：

- 禁止生成整页截图式 PPT。
- 禁止用图片替代正文内容。
- 禁止把大段文字或数据表格放入 SVG。
- 禁止用 SVG 替代可用原生元素表示的图表。
- 禁止把正文烘焙到 AI 图片中。

图片生成禁止：

- 禁止使用非 `gpt-image-2` 的图片生成模型。
- 禁止在图片中生成标题、正文、表格、图表标签、水印或 Logo。
- 禁止把 PNG 改扩展名伪装成 SVG。
- 禁止生成不可追踪、不可复现的图片资产说明。

文件操作禁止：

- 禁止在没有用户确认的情况下删除阶段产物。
- 禁止覆盖用户原始素材。
- 禁止修改模板源文件。
- 禁止把临时调试文件混入阶段产物。

SVG 安全禁止：

- 禁止 `<script>`。
- 禁止 `<foreignObject>`。
- 禁止外链 `href`。
- 禁止 `data:` href。
- 禁止事件属性。
- 禁止 iframe、object、embed。

JSON 禁止：

- 禁止注释。
- 禁止尾逗号。
- 禁止 Markdown 代码块包裹实际文件内容。
- 禁止字段值使用“待补充”“TODO”“XXX”等占位符。

## 修改与回滚机制

当用户要求修改时，根据修改内容确定从哪个阶段重新开始：

- 修改主题、受众、页数、模板：从 Stage 1 重新开始。
- 修改大纲结构或页面顺序：从 Stage 2 重新开始。
- 修改某页内容或文案：从 Stage 3 重新开始。
- 修改排版或布局：从 Stage 4 重新开始。
- 修改图表、示意图或图片：从 Stage 5 重新开始。
- 修改字体、颜色或主题：从 Stage 6 重新开始。
- 修改渲染器能力：修改代码后重新运行校验和渲染。

原则：

- 只重新生成受影响阶段及其后续阶段。
- 保留未受影响中间产物。
- 修改前说明影响范围。
- 用户已有素材和模板永不自动覆盖。

## 当前仓库实现注意事项

以源码为准：

- `src/schemas/brief.ts` 定义 brief schema。
- `src/schemas/outline.ts` 定义 outline schema。
- `src/schemas/content.ts` 定义 content schema。
- `src/schemas/layout.ts` 定义 layout schema。
- `src/schemas/deck.ts` 定义 DeckSpec schema。
- `src/layout/validator.ts` 执行 DeckSpec 校验。
- `src/layout/repair.ts` 执行布局修复。
- `src/assets/svgSanitizer.ts` 执行 SVG 安全检查。
- `src/assets/assetPipeline.ts` 解析或生成资产。
- `src/renderer/pptxRenderer.ts` 渲染 PPTX。
- `src/cli/render.ts` 是渲染入口。

如果文档、样例和 schema 不一致：

- 优先判断用户目标。
- 修改 schema/renderer/asset pipeline 使其符合固定目标。
- 或在无法改代码时，把 DeckSpec 调整到当前 schema 可渲染范围。
- 不允许悄悄降级为不可编辑图片式 PPT。

## 完成前检查清单

交付前逐项检查：

- 阶段文件放在正确目录。
- 所有 JSON 可解析。
- `meta.language` 为 `zh-CN`，除非用户指定其他语言。
- 文案为中文。
- 每页有清晰标题或封面主标题。
- 正文字号不低于 18。
- 脚注不低于 9。
- 元素未越界。
- 主要文本未重叠。
- 每页正文不超过 5 条 bullet，除非用户要求。
- 图片 prompt 使用 `gpt-image-2`。
- 图片中不包含正文或标签。
- SVG 通过 sanitizer。
- DeckSpec 通过校验。
- 渲染命令成功输出 `.pptx`。
- 最终 PPT 可编辑性符合要求。
