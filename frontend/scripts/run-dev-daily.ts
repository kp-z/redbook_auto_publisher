#!/usr/bin/env tsx
import { runDevDaily } from "../lib/dev-daily"

runDevDaily()
  .then(() => {
    console.log("✅ AI 开发日报执行完成")
    process.exit(0)
  })
  .catch((err) => {
    console.error("❌ AI 开发日报执行失败:", err)
    process.exit(1)
  })
