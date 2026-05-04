import "dotenv/config";

export const GPT_IMAGE_MODEL = "gpt-image-2";

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
