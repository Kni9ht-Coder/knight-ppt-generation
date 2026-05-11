# Usage

## 安装

```bash
npm install
```

## 离线演示

```bash
npm run generate:demo
```

输出：

```text
outputs/specs/ai-knowledge-assistant.deck.json
outputs/assets/ai-knowledge-assistant/*
outputs/pptx/ai-knowledge-assistant.pptx
```

## 使用 OpenAI 生成

```bash
cp .env.example .env
```

填写：

```env
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-5
OPENAI_IMAGE_MODEL=gpt-image-2
```

运行：

```bash
npm run generate -- \
  --topic "企业知识库 AI 助手" \
  --audience "CEO 和业务负责人" \
  --slides 8 \
  --style "专业、简洁、蓝橙配色"
```

## 科研汇报

科研汇报使用 `mode: "research-report"`。示例 brief：

```text
examples/briefs/research-report.zh.json
```

该模式会要求内容页包含核心论点、可溯源证据、讲稿备注和方法/实验/结果页的结构化视觉说明；最终渲染仍使用 `npm run render -- --spec outputs/{slug}/6-渲染规格/deck.json`。

## 常用参数

- `--brief <path>`：读取 JSON brief。
- `--topic <text>`：PPT 主题。
- `--audience <text>`：目标受众。
- `--slides <number>`：页数。
- `--style <text>`：风格描述。
- `--offline`：不调用 OpenAI，使用本地 fallback。
- `--out <path>`：指定 PPTX 输出路径。
- `--spec-out <path>`：指定 DeckSpec 输出路径。
- `--assets-dir <path>`：指定资产输出目录。

## 校验 DeckSpec

```bash
npm run validate -- --spec outputs/specs/ai-knowledge-assistant.deck.json
```
