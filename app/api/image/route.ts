import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const ua =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const hosts = ["scriptblox.com", "rscripts.net", "rbxcdn.com", "tr.rbxcdn.com", "roblox.com"]

function ok(h: string): boolean {
  return hosts.some((d) => h === d || h.endsWith(`.${d}`))
}

function ref(h: string): string | undefined {
  if (h.includes("scriptblox.com")) return "https://scriptblox.com/"
  if (h.includes("rscripts.net")) return "https://rscripts.net/"
  if (h.includes("rbxcdn.com")) return "https://www.roblox.com/"
  return undefined
}

export async function GET(req: Request) {
  const { searchParams: sp } = new URL(req.url)
  const u = sp.get("url")
  if (!u) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  let p: URL
  try {
    p = new URL(u)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (!ok(p.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
  }

  try {
    const rf = ref(p.hostname)
    const r = await fetch(u, {
      headers: {
        "User-Agent": ua,
        Accept: "image/*,*/*",
        ...(rf ? { Referer: rf } : {}),
      },
      cache: "no-store",
    })

    if (!r.ok) {
      return NextResponse.json({ error: `Upstream returned ${r.status}` }, { status: 502 })
    }

    const buf = await r.arrayBuffer()
    const ct = r.headers.get("content-type") ?? "image/jpeg"

    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 })
  }
}