# knight-ppt-generation

通过 AI Agent（Kiro CLI / Claude Code / Codex）交互式生成可编辑 PPTX 的工程模板。

## 核心思路

**人 ↔ Agent 对话协作**，按阶段生成中间产物文件，每步可审阅/修改，最终渲染为 PowerPoint。

支持从论文 PDF、报告、Word、已有 PPT 等素材中提取内容，Agent 负责聚合主题、规划结构和设计版式，渲染器负责确定性地将 DeckSpec JSON 转为 .pptx。

## 快速开始

```bash
npm install
```

在 Kiro CLI 中开始对话，Agent 会自动加载 PPT 生成 Skill：

```
你: 帮我做一个关于企业 AI 助手的 PPT，给 CEO 看，8 页，蓝橙配色
Agent: [生成 brief.json] 主题定义已保存，请确认...
```

## 工作流程（8 阶段）

| 阶段 | 产物 | 说明 |
|------|------|------|
| 0. 素材导入 | `outputs/{slug}/0-sources/` | 放入论文 PDF、报告、Word 等素材 |
| 1. 主题定义 | `outputs/{slug}/1-brief/brief.json` | 确定主题、受众、风格 |
| 2. 大纲规划 | `outputs/{slug}/2-outline/outline.json` | 每页标题和要点 |
| 3. 内容撰写 | `outputs/{slug}/3-content/content.json` | 详细文案 |
| 4. 版式设计 | `outputs/{slug}/4-layout/layout.json` | 元素坐标布局 |
| 5. 配图生成 | `outputs/{slug}/5-assets/*.svg` | SVG 配图 |
| 6. 组装 DeckSpec | `outputs/{slug}/6-deck/deck.json` | 最终渲染规格 |
| 7. 渲染 PPTX | `outputs/{slug}/7-output/output.pptx` | 可编辑 PowerPoint |

每个阶段完成后 Agent 会暂停等待你确认，你可以随时要求修改。

## 渲染命令

当 deck.json 准备好后，运行：

```bash
npm run render -- --spec outputs/my-deck/6-deck/deck.json
```

可选参数：
- `--template <file>` — PPT 模板文件（默认无，使用空白样式）
- `--assets-dir <dir>` — 资产目录（默认 `outputs/{slug}/5-assets`）
- `--out <file>` — 输出路径（默认 `outputs/{slug}/7-output/output.pptx`）

## 核心约束

- PPT 文本必须是原生文本框，不能烘焙到图片里
- 坐标系统：0-1000 归一化画布，渲染器转为 16:9
- SVG 用于流程图、架构图、图标
- 颜色值为 6 位 hex（不带 #）

## 项目结构

```
.kiro/skills/ppt-generation/SKILL.md  — Agent 工作流定义
templates/                             — 用户的固定 PPT 模板
src/cli/render.ts                      — 渲染 CLI 入口
src/schemas/deck.ts                    — DeckSpec Zod schema
src/renderer/                          — PptxGenJS 渲染器
src/layout/                            — 布局校验与修复
src/assets/                            — SVG 模板、资产管线
outputs/                               — 所有中间产物和最终输出
```

## 相关文档

- [AGENTS.md](./AGENTS.md) — Agent 行为规范
- [docs/PPT_GENERATION_SPEC.md](./docs/PPT_GENERATION_SPEC.md) — DeckSpec 详细规格
