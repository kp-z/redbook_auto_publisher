import Replicate from "replicate"
import { getConfig } from "./config-store"

function getReplicateClient(): Replicate {
  const config = getConfig()
  const token = config.replicateApiToken || process.env.REPLICATE_API_TOKEN
  if (!token) {
    throw new Error("Replicate API Token 未配置，请在设置页面配置")
  }
  return new Replicate({ auth: token })
}

export interface ImageResult {
  provider: string
  imageUrls: string[]
  cost: string
  model: string
}

/**
 * Replicate FLUX 1.1 Pro - 高质量，$0.04/张
 */
export async function generateWithFluxPro(
  prompt: string,
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1"
): Promise<ImageResult> {
  const replicate = getReplicateClient()
  const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      num_outputs: 1,
      output_format: "webp",
      output_quality: 90,
    },
  })

  const urls = Array.isArray(output) ? output.map(String) : [String(output)]
  return {
    provider: "Replicate",
    model: "FLUX 1.1 Pro",
    imageUrls: urls,
    cost: "$0.04",
  }
}

/**
 * Replicate FLUX Dev - 更快更便宜，$0.025/张
 */
export async function generateWithFluxDev(
  prompt: string,
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1"
): Promise<ImageResult> {
  const replicate = getReplicateClient()
  const output = await replicate.run("black-forest-labs/flux-dev", {
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      num_outputs: 1,
      output_format: "webp",
    },
  })

  const urls = Array.isArray(output) ? output.map(String) : [String(output)]
  return {
    provider: "Replicate",
    model: "FLUX Dev",
    imageUrls: urls,
    cost: "$0.025",
  }
}

/**
 * Replicate Stable Diffusion 3.5 - 备用方案
 */
export async function generateWithSD35(prompt: string): Promise<ImageResult> {
  const replicate = getReplicateClient()
  const output = await replicate.run(
    "stability-ai/stable-diffusion-3.5-large",
    {
      input: {
        prompt,
        num_outputs: 1,
        output_format: "webp",
      },
    }
  )

  const urls = Array.isArray(output) ? output.map(String) : [String(output)]
  return {
    provider: "Replicate",
    model: "Stable Diffusion 3.5",
    imageUrls: urls,
    cost: "$0.065",
  }
}
