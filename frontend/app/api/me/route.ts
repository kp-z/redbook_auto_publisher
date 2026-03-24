import { NextResponse } from "next/server"

const XHS_BASE = process.env.XHS_API_BASE ?? "http://localhost:18060"

export async function GET() {
  try {
    const res = await fetch(`${XHS_BASE}/api/v1/user/me`, { cache: "no-store" })
    const json = await res.json()
    const basicInfo = json?.data?.userBasicInfo ?? {}
    return NextResponse.json({
      avatar: basicInfo.images ?? "",
      nickname: basicInfo.nickname ?? "用户",
    })
  } catch {
    return NextResponse.json({ avatar: "", nickname: "用户" })
  }
}
