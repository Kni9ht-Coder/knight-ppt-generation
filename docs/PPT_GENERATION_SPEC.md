# PPT Generation Spec

## 1. 数据边界

系统中最重要的边界是 `DeckSpec`：

```text
用户需求 -> DeckSpec JSON -> PPTX renderer -> .pptx
```

`DeckSpec` 是唯一允许进入渲染器的数据结构。agent 不能绕过它直接写 PPTX。

## 2. DeckSpec 结构

核心字段：

- `meta`：标题、受众、语言、页数。
- `meta.mode`：生成模式，默认 `general`；科研汇报使用 `research-report`。
- `theme`：字体、颜色、页眉页脚策略。
- `assets`：SVG、AI raster、普通图片等资产声明。
- `slides`：页面列表，每页包含布局、备注和元素。

所有元素使用 0-1000 坐标：

```json
{
  "box": { "x": 80, "y": 120, "w": 420, "h": 180 }
}
```

渲染器会把它转换为 PowerPoint 的英寸坐标。

## 3. 元素类型

当前固定支持：

- `text`：PPT 原生文本框。
- `shape`：PPT 原生形状。
- `line`：PPT 原生线条。
- `svg`：SVG 图片资产。
- `image`：AI raster 或外部图片资产。
- `table`：PPT 原生表格。

科研汇报正文页应使用更细的文本角色：

- `title`：页面标题。
- `claim`：本页核心结论句。
- `body`：方法、实验、结果等正文信息。
- `evidence`：可溯源证据或数据说明。
- `metric`：关键指标或数值卡片。

## 4. 科研汇报模式

当 `meta.mode` 为 `research-report` 时，生成链路必须满足更高的信息密度要求。

大纲阶段：

- 非封面、章节、结尾页必须声明 `researchRole`。
- 必须覆盖 `problem`、`method-overview`、`experiment-setup`、`main-results`、`conclusion`。
- 正文页至少需要 3 条具体 `keyPoints`。

内容阶段：

- 正文页必须包含 `claim`、`evidence`、`speakerNotes`、`visualSpec`。
- 正文页需要 3-6 条有信息量的 `bodyText`。
- `evidence.source` 必须能指向素材位置，例如 `paper.pdf p.7 Table 2`。
- `main-results` 与 `ablation` 页必须使用 `table` 或 `chart`。

DeckSpec 阶段：

- 正文页必须包含 `title` 和 `claim` 文本元素。
- 正文页必须有足够正文信息，或用表格/图像/SVG 承载实质内容。
- 正文页必须有不少于 60 字符的 `notes`，用于讲稿和讲解上下文。

## 5. 资产类型

### svg

用于流程图、架构图、图标、装饰图形。

要求：

- 必须是纯 SVG。
- 不允许外链资源。
- 不允许脚本和事件属性。
- 文本标签如果需要编辑，应改用 PPT 原生 text 元素，不放进 SVG。

### ai-raster

用于复杂插画和封面图。

固定使用：

```json
{
  "kind": "ai-raster",
  "model": "gpt-image-2",
  "quality": "medium",
  "size": "1536x1024",
  "outputFormat": "png"
}
```

注意：`gpt-image-2` 生成的是图片资产，不是原生 SVG。需要 SVG 时，应使用 SVG 模板或矢量化流程。

## 6. 质量门禁

渲染前必须检查：

- JSON 是否满足 schema。
- slide id 是否唯一。
- asset id 是否唯一。
- 元素是否越界。
- 元素是否引用不存在的 asset。
- 关键文本字号是否过小。
- 文本块之间是否明显重叠。
- SVG 是否含危险标签或外链。

校验失败时，修复 `DeckSpec` 后再渲染。
