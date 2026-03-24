const XHS_BASE = process.env.XHS_API_BASE ?? "http://localhost:18060"

export interface PublishRequest {
  title: string
  content: string
  images: string[]
  tags?: string[]
  visibility?: string
  is_original?: boolean
}

export interface PublishResponse {
  success: boolean
  data?: {
    title: string
    content: string
    images: number
    status: string
    post_id: string
  }
  error?: string
}

export async function checkLoginStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${XHS_BASE}/api/v1/login/status`)
    const json = await res.json()
    return json?.data?.is_logged_in === true
  } catch {
    return false
  }
}

export async function publishContent(req: PublishRequest): Promise<PublishResponse> {
  const res = await fetch(`${XHS_BASE}/api/v1/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  const json = await res.json()
  if (!res.ok) {
    return { success: false, error: json.error ?? `HTTP ${res.status}` }
  }
  return { success: true, data: json.data }
}
