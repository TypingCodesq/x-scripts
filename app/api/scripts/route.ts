import { NextResponse } from "next/server"
import type { NormalizedScript } from "@/lib/types"
import { seal } from "@/lib/crypt"

export const dynamic = "force-dynamic"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const CDN = "https://micdn"
const MAX_Q = 80
const MAX_PAGE = 50
const RATE = new Map<string, { n: number; t: number }>()
const R_WIN = 60_000
const R_MAX = 45

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

function clean(s: string | null | undefined) {
  if (!s) return null
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
  return o.replace(/^\s*--\s*$/gm, "").slice(0, 1_500_000)
}

function proxImg(real: string | null) {
  if (!real) return null
  return `/api/image?t=${seal(real)}`
}

function toRaw(o: string | null | undefined, id: string) {
  if (!o) return null
  try {
    const u = new URL(o)
    const p = u.pathname.startsWith("/raw/")
      ? u.pathname
      : `/raw/${id}`
    return `${CDN}${p.replace(/[^a-zA-Z0-9/_-]/g, "")}`
  } catch {
    return `${CDN}/raw/${id.replace(/[^a-zA-Z0-9_-]/g, "")}`
  }
}

function hid(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return "x" + Math.abs(h).toString(36) + s.slice(-6).replace(/[^a-zA-Z0-9]/g, "")
}

function sbImg(im?: string | null) {
  if (!im) return null
  if (im.startsWith("http")) return im
  return `https://scriptblox.com${im}`
}

function sbMap(s: Record<string, unknown>): NormalizedScript {
  const g = s.game as Record<string, unknown> | undefined
  const im = (s.image as string) || (g?.imageUrl as string)
  const rawId = String(s._id).replace(/[^a-zA-Z0-9]/g, "")
  const id = hid("sb" + rawId)
  const realImg = sbImg(im)
  return {
    id,
    source: "xscript",
    title: String(s.title ?? "Untitled").slice(0, 200),
    game: String(g?.name ?? "Unknown Game").slice(0, 120),
    image: proxImg(realImg),
    views: Number(s.views) || 0,
    likes: 0,
    verified: Boolean(s.verified),
    keySystem: Boolean(s.key),
    paid: s.scriptType === "paid",
    scriptType: String(s.scriptType ?? "free").slice(0, 20),
    createdAt: null,
    script: clean(s.script as string),
    rawUrl: null,
    link: null,
  }
}

async function sbGet(q: string, p: number) {
  const u = q
    ? `https://scriptblox.com/api/script/search?q=${encodeURIComponent(q)}&page=${p}`
    : `https://scriptblox.com/api/script/fetch?page=${p}`
  try {
    const r = await fetch(u, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return []
    const d = await r.json()
    return (d?.result?.scripts ?? []).map(sbMap)
  } catch {
    return []
  }
}

function rsImg(im?: string | null) {
  if (!im) return null
  if (im.startsWith("http")) return im
  if (im.startsWith("//")) return `https:${im}`
  return `https://rscripts.net${im.startsWith("/") ? im : `/${im}`}`
}

function rsMap(s: Record<string, unknown>): NormalizedScript {
  const u = s.user as Record<string, unknown> | undefined
  const rawId = String(s._id).replace(/[^a-zA-Z0-9]/g, "")
  const id = hid("rs" + rawId)
  const realImg = rsImg(s.image as string)
  return {
    id,
    source: "xscript",
    title: String(s.title ?? "Untitled").slice(0, 200),
    game: u?.username ? `by ${String(u.username).slice(0, 40)}` : "Unknown",
    image: proxImg(realImg),
    views: Number(s.views) || 0,
    likes: Number(s.likes) || 0,
    verified: false,
    keySystem: Boolean(s.keySystem),
    paid: Boolean(s.paid),
    scriptType: s.paid ? "paid" : "free",
    createdAt: null,
    script: null,
    rawUrl: toRaw(s.rawScript as string, id),
    link: null,
  }
}

async function rsGet(q: string, p: number) {
  const u = q
    ? `https://rscripts.net/api/v2/scripts?q=${encodeURIComponent(q)}&page=${p}&orderBy=date&sort=desc`
    : `https://rscripts.net/api/v2/scripts?page=${p}&orderBy=date&sort=desc`
  try {
    const r = await fetch(u, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return []
    const d = await r.json()
    return (d?.scripts ?? []).map(rsMap)
  } catch {
    return []
  }
}

function mix(a: NormalizedScript[], b: NormalizedScript[]) {
  const n = Math.max(a.length, b.length)
  const r: NormalizedScript[] = []
  for (let i = 0; i < n; i++) {
    if (a[i]) r.push(a[i])
    if (b[i]) r.push(b[i])
  }
  return r
}

export async function GET(req: Request) {
  if (limited(ip(req))) {
    return NextResponse.json({ error: "rate" }, { status: 429 })
  }

  const sp = new URL(req.url).searchParams
  let q = (sp.get("q") ?? "").trim().slice(0, MAX_Q)
  q = q.replace(/[<>"'`\\]/g, "")
  const p = Math.min(MAX_PAGE, Math.max(1, Number(sp.get("page") ?? "1") || 1))

  const [a, b] = await Promise.all([sbGet(q, p), rsGet(q, p)])
  return NextResponse.json(
    { scripts: mix(a, b), page: p },
    {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    },
  )
}
