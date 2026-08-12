import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const ALLOW = [
  "scriptblox.com",
  "rscripts.net",
  "rawscripts.net",
  "rbxcdn.com",
  "tr.rbxcdn.com",
  "roblox.com",
]
const MAX = 5_000_000
const RATE = new Map<string, { n: number; t: number }>()
const R_WIN = 60_000
const R_MAX = 60

function ip(r: Request) {
  return (
    r.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    r.headers.get("x-real-ip") ||
    "0"
  )
}

function limited(k: string) {
  const n = Date.now()
  const e = RATE.get(k)
  if (!e || n - e.t > R_WIN) {
    RATE.set(k, { n: 1, t: n })
    return false
  }
  e.n++
  return e.n > R_MAX
}

function ok(h: string) {
  return ALLOW.some((d) => h === d || h.endsWith(`.${d}`))
}

function ref(h: string) {
  if (h.includes("scriptblox.com")) return "https://scriptblox.com/"
  if (h.includes("rscripts.net") || h.includes("rawscripts.net"))
    return "https://rscripts.net/"
  if (h.includes("rbxcdn.com") || h.includes("roblox.com"))
    return "https://www.roblox.com/"
  return undefined
}

export async function GET(req: Request) {
  if (limited(ip(req))) {
    return NextResponse.json({ error: "rate" }, { status: 429 })
  }

  const raw = new URL(req.url).searchParams.get("url")
  if (!raw || raw.length > 500) {
    return NextResponse.json({ error: "bad" }, { status: 400 })
  }

  let p: URL
  try {
    p = new URL(raw)
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 })
  }

  if (p.protocol !== "https:" && p.protocol !== "http:") {
    return NextResponse.json({ error: "denied" }, { status: 403 })
  }
  if (p.username || p.password) {
    return NextResponse.json({ error: "denied" }, { status: 403 })
  }
  if (!ok(p.hostname)) {
    return NextResponse.json({ error: "denied" }, { status: 403 })
  }
  if (
    /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[::)/i.test(
      p.hostname,
    )
  ) {
    return NextResponse.json({ error: "denied" }, { status: 403 })
  }

  try {
    const rf = ref(p.hostname)
    const r = await fetch(raw, {
      headers: {
        "User-Agent": UA,
        Accept: "image/*,*/*",
        ...(rf ? { Referer: rf } : {}),
      },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    })

    if (!r.ok) {
      return NextResponse.json({ error: "up" }, { status: 502 })
    }

    const ct = (r.headers.get("content-type") || "").toLowerCase()
    if (!ct.startsWith("image/")) {
      return NextResponse.json({ error: "type" }, { status: 415 })
    }

    const cl = Number(r.headers.get("content-length") || 0)
    if (cl > MAX) {
      return NextResponse.json({ error: "size" }, { status: 413 })
    }

    const buf = await r.arrayBuffer()
    if (buf.byteLength > MAX) {
      return NextResponse.json({ error: "size" }, { status: 413 })
    }

    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return NextResponse.json({ error: "fail" }, { status: 502 })
  }
}
