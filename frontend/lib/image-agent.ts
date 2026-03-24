import Anthropic from "@anthropic-ai/sdk"
import {
  generateWithFluxPro,
  generateWithFluxDev,
  generateWithSD35,
  type ImageResult,
} from "./image-api-clients"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4"

const tools: Anthropic.Tool[] = [
  {
    name: "generate_flux_pro",
    description:
      "使用 FLUX 1.1 Pro 生成高质量图片。适合需要最高质量输出的场景，支持多种宽高比。每张约 $0.04，生成时间 15-30 秒。",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description: "英文图片生成 prompt，越详细越好",
        },
        aspect_ratio: {
          type: "string",
          enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
          description: "图片宽高比，默认 1:1",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_flux_dev",
    description:
      "使用 FLUX Dev 快速生成图片。质量略低于 Pro 但速度更快、价格更低。适合快速预览或批量生成。每张约 $0.025，生成时间 10-20 秒。",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description: "英文图片生成 prompt",
        },
        aspect_ratio: {
          type: "string",
          enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
          description: "图片宽高比，默认 1:1",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_sd35",
    description:
      "使用 Stable Diffusion 3.5 Large 生成图片。风格多样，适合艺术创作类图片。每张约 $0.065。",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description: "英文图片生成 prompt，可以包含风格描述",
        },
      },
      required: ["prompt"],
    },
  },
]

const SYSTEM_PROMPT = `你是一个专业的 AI 图片生成助手，可以调用多个图片生成 API 帮用户创作图片。

## 你的工具
1. **generate_flux_pro** - FLUX 1.1 Pro，最高质量，$0.04/张，15-30秒
2. **generate_flux_dev** - FLUX Dev，速度更快，$0.025/张，10-20秒
3. **generate_sd35** - Stable Diffusion 3.5，风格多样，$0.065/张

## 工作流程
1. 理解用户需求（主题、风格、氛围、用途）
2. 将中文描述翻译并优化成详细的英文 prompt
3. 根据需求选择合适的工具：
   - 追求最高质量 → generate_flux_pro
   - 快速预览/批量 → generate_flux_dev
   - 艺术/插画风格 → generate_sd35
4. 调用工具生成图片
5. 告诉用户图片已生成

## Prompt 优化规则
- 始终用英文生成 prompt
- 加入风格关键词（photorealistic / illustration / oil painting / watercolor 等）
- 加入光线描述（golden hour / soft lighting / dramatic shadows 等）
- 加入构图描述（close-up / wide angle / aerial view 等）
- 避免负面词汇

## 沟通规则
- 始终用中文与用户沟通
- 生成前告知用户你选择的模型和原因
- 生成后说明图片信息（模型、费用）
- 如果失败，尝试修改 prompt 重试`

export interface AgentMessage {
  role: "user" | "assistant"
  text: string
  images?: string[]
  model?: string
  cost?: string
}

export async function runImageAgent(
  userInput: string,
  history: Anthropic.MessageParam[] = []
): Promise<{ messages: AgentMessage[]; updatedHistory: Anthropic.MessageParam[] }> {
  const newMessages: AgentMessage[] = []
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: userInput },
  ]

  let response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  })

  // Agent 循环
  while (response.stop_reason === "tool_use") {
    const toolUseBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    )
    if (!toolUseBlock) break

    // 提取 assistant 文字说明（调用工具前的说明）
    const assistantText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
    if (assistantText) {
      newMessages.push({ role: "assistant", text: assistantText })
    }

    // 执行工具
    let result: ImageResult | null = null
    let toolError: string | null = null

    try {
      const input = toolUseBlock.input as {
        prompt: string
        aspect_ratio?: AspectRatio
      }
      switch (toolUseBlock.name) {
        case "generate_flux_pro":
          result = await generateWithFluxPro(input.prompt, input.aspect_ratio)
          break
        case "generate_flux_dev":
          result = await generateWithFluxDev(input.prompt, input.aspect_ratio)
          break
        case "generate_sd35":
          result = await generateWithSD35(input.prompt)
          break
        default:
          toolError = `未知工具：${toolUseBlock.name}`
      }
    } catch (err) {
      toolError = err instanceof Error ? err.message : String(err)
    }

    // 如果成功，记录图片结果
    if (result) {
      newMessages.push({
        role: "assistant",
        text: `图片生成成功（${result.model}，${result.cost}）`,
        images: result.imageUrls,
        model: result.model,
        cost: result.cost,
      })
    }

    // 继续 agent 循环
    messages.push({ role: "assistant", content: response.content })
    messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUseBlock.id,
          content: toolError
            ? `Error: ${toolError}`
            : JSON.stringify(result),
          is_error: !!toolError,
        },
      ],
    })

    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    })
  }

  // 最终文字回复
  const finalText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
  if (finalText) {
    newMessages.push({ role: "assistant", text: finalText })
  }

  // 更新历史（只保留最近 10 轮）
  messages.push({ role: "assistant", content: response.content })
  const updatedHistory = messages.slice(-20)

  return { messages: newMessages, updatedHistory }
}
