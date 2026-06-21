import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const ua =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const hosts = ["rscripts.net", "rawscripts.net", "scriptblox.com"]

function ok(h: string): boolean {
  return hosts.some((d) => h === d || h.endsWith(`.${d}`))
}

export async function GET(req: Request) {
  const { searchParams: sp } = new URL(req.url)
  const u = sp.get("url")
  if (!u) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  let h = ""
  try {
    h = new URL(u).hostname
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (!ok(h)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
  }

  try {
    const r = await fetch(u, { headers: { "User-Agent": ua }, cache: "no-store" })
    if (!r.ok) {
      return NextResponse.json({ error: `Upstream returned ${r.status}` }, { status: 502 })
    }
    const t = await r.text()
    return NextResponse.json({ content: t })
  } catch {
    return NextResponse.json({ error: "Failed to fetch script" }, { status: 502 })
  }
}
