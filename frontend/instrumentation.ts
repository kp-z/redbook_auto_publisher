export async function register() {
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { default: cron } = await import("node-cron")
    const { syncProfile } = await import("@/lib/profile-sync")
    const { ensureProfileSyncTask, ensureDevDailyTask } = await import("@/lib/store")
    const { runDevDaily } = await import("@/lib/dev-daily")

    // 确保 Profile 数据同步任务存在于任务列表
    ensureProfileSyncTask()

    // 每天 20:00 同步
    cron.schedule("0 20 * * *", syncProfile, { timezone: "Asia/Shanghai" })
    console.log("[profile-sync] 已注册定时任务：每天 20:00 同步小红书 profile")

    // 确保 AI 开发日报任务存在于任务列表
    ensureDevDailyTask()

    // 每天 21:00 生成并发布 AI 开发日报
    cron.schedule("0 21 * * *", runDevDaily, { timezone: "Asia/Shanghai" })
    console.log("[dev-daily] 已注册定时任务：每天 21:00 生成 AI 开发日报")

    // 服务启动时立即同步一次
    syncProfile()
  }
}
