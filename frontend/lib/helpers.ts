import fs from "fs"
import path from "path"
import crypto from "crypto"

const SUPPORTED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]

/**
 * 从目录中随机选取一张图片，返回绝对路径
 */
export function pickRandomImage(imageDir: string): string | null {
  if (!imageDir || !fs.existsSync(imageDir)) return null
  const files = fs.readdirSync(imageDir).filter((f) =>
    SUPPORTED_EXTS.includes(path.extname(f).toLowerCase())
  )
  if (files.length === 0) return null
  const picked = files[Math.floor(Math.random() * files.length)]
  return path.join(imageDir, picked)
}

/**
 * 生成随机 webhook token
 */
export function generateWebhookToken(): string {
  return crypto.randomBytes(16).toString("hex")
}
