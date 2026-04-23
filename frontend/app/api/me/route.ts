import { NextResponse } from "next/server"

const XHS_BASE = process.env.XHS_API_BASE ?? "http://localhost:18060"

export async function GET() {
  try {
    const res = await fetch(`${XHS_BASE}/api/v1/user/me`, { cache: "no-store" })
    const json = await res.json()
    const basicInfo = json?.data?.data?.userBasicInfo ?? {}
    const loggedIn = !!basicInfo.nickname
    return NextResponse.json({
      avatar: basicInfo.images ?? "",
      nickname: basicInfo.nickname ?? "用户",
      loggedIn,
    })
  } catch {
    return NextResponse.json({ avatar: "", nickname: "用户", loggedIn: false })
  }
}
