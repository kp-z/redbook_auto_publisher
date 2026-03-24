import { NextResponse } from "next/server"
import { getHistory } from "@/lib/store"

export async function GET() {
  return NextResponse.json(getHistory())
}
