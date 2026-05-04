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

## 4. 资产类型

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

## 5. 质量门禁

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
