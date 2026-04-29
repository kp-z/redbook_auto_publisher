import Anthropic from "@anthropic-ai/sdk"
import { getConfig } from "./config-store"

function getClient(): Anthropic {
  const config = getConfig()
  const apiKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("Anthropic API Key 未配置，请在设置页面配置")
  }
  return new Anthropic({ apiKey })
}

export interface GeneratedContent {
  title: string
  content: string
}

export async function generateXhsContent(topicPrompt: string): Promise<GeneratedContent> {
  const client = getClient()
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `你是一位小红书内容创作者。请根据以下主题，生成一篇小红书帖子。

主题：${topicPrompt}

要求：
- 标题：不超过20个字，吸引眼球，可以用emoji
- 正文：不超过1000字，口语化，有感染力，适当使用emoji和换行
- 输出格式必须严格为 JSON：{"title": "...", "content": "..."}
- 只输出 JSON，不要其他内容`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  // 提取 JSON
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("Claude 返回格式异常：" + text)
  const parsed = JSON.parse(match[0])
  return {
    title: String(parsed.title ?? "").slice(0, 20),
    content: String(parsed.content ?? "").slice(0, 1000),
  }
}
