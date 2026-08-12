import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const CDN = "micdn"
const MAX = 1_500_000
const RATE = new Map<string, { n: number; t: number }>()
const R_WIN = 60_000
const R_MAX = 30

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

function clean(s: string) {
  let o = s
  const r: [RegExp, string][] = [
    [/https?:\/\/(?:www\.)?rawscripts\.net/gi, "https://micdn"],
    [/https?:\/\/(?:www\.)?rscripts\.net/gi, "https://micdn"],
    [/https?:\/\/(?:www\.)?scriptblox\.com/gi, "https://micdn"],
    [/--\s*script\s*from\s*(?:rscripts|rawscripts|scriptblox)\.net/gi, ""],
    [/--\s*script\s*from\s*scriptblox\.com/gi, ""],
    [/--\s*get\s*key\s*from\s*rscripts/gi, ""],
    [/rscripts\.net/gi, "micdn"],
    [/rawscripts\.net/gi, "micdn"],
    [/scriptblox\.com/gi, "micdn"],
  ]
  for (const [a, b] of r) o = o.replace(a, b)
  return o.replace(/^\s*--\s*$/gm, "").slice(0, MAX)
}

function resolve(pub: string) {
  let u: URL
  try {
    u = new URL(pub)
  } catch {
    return null
  }
  if (u.protocol !== "https:") return null
  if (u.hostname !== CDN && !u.hostname.endsWith(`.${CDN}`)) return null
  if (u.username || u.password) return null
  if (u.port && u.port !== "443") return null

  const path = u.pathname
  if (!/^\/raw\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,120}$/.test(path)) return null
  if (u.search || u.hash) return null

  return `https://rawscripts.net${path}`
}

export async function GET(req: Request) {
  if (limited(ip(req))) {
    return NextResponse.json({ error: "rate" }, { status: 429 })
  }

  const u = new URL(req.url).searchParams.get("url")
  if (!u || u.length > 300) {
    return NextResponse.json({ error: "bad" }, { status: 400 })
  }

  const up = resolve(u)
  if (!up) {
    return NextResponse.json({ error: "denied" }, { status: 403 })
  }

  try {
    const r = await fetch(up, {
      headers: { "User-Agent": UA, Accept: "text/plain,*/*" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    })
    if (!r.ok) {
      return NextResponse.json({ error: "up" }, { status: 502 })
    }
    const ct = (r.headers.get("content-type") || "").toLowerCase()
    if (ct.includes("html") || ct.includes("xml") || ct.includes("json")) {
      return NextResponse.json({ error: "type" }, { status: 415 })
    }
    const cl = Number(r.headers.get("content-length") || 0)
    if (cl > MAX) {
      return NextResponse.json({ error: "size" }, { status: 413 })
    }
    const raw = await r.text()
    if (raw.length > MAX) {
      return NextResponse.json({ error: "size" }, { status: 413 })
    }
    return NextResponse.json(
      { content: clean(raw) },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store",
        },
      },
    )
  } catch {
    return NextResponse.json({ error: "fail" }, { status: 502 })
  }
}
