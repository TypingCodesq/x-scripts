import { NextResponse } from "next/server"
import type { NormalizedScript } from "@/lib/types"

export const dynamic = "force-dynamic"

const ua =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

function sbImg(im?: string | null): string | null {
  if (!im) return null
  if (im.startsWith("http")) return im
  return `https://scriptblox.com${im}`
}

function sbMap(s: Record<string, unknown>): NormalizedScript {
  const g = s.game as Record<string, unknown> | undefined
  const im = (s.image as string) || (g?.imageUrl as string)
  return {
    id: `sb_${s._id}`,
    source: "scriptblox",
    title: (s.title as string) ?? "Untitled",
    game: (g?.name as string) ?? "Unknown Game",
    image: sbImg(im),
    views: (s.views as number) ?? 0,
    likes: 0,
    verified: Boolean(s.verified),
    keySystem: Boolean(s.key),
    paid: s.scriptType === "paid",
    scriptType: (s.scriptType as string) ?? "free",
    createdAt: (s.createdAt as string) ?? null,
    script: (s.script as string) ?? null,
    rawUrl: null,
    link: s.slug ? `https://scriptblox.com/script/${s.slug}` : null,
  }
}

async function sbGet(q: string, p: number): Promise<NormalizedScript[]> {
  const u = q
    ? `https://scriptblox.com/api/script/search?q=${encodeURIComponent(q)}&page=${p}`
    : `https://scriptblox.com/api/script/fetch?page=${p}`
  try {
    const r = await fetch(u, {
      headers: { "User-Agent": ua, Accept: "application/json" },
      cache: "no-store",
    })
    if (!r.ok) return []
    const d = await r.json()
    const arr = d?.result?.scripts ?? []
    return arr.map(sbMap)
  } catch {
    return []
  }
}

function rsImg(im?: string | null): string | null {
  if (!im) return null
  if (im.startsWith("http")) return im
  if (im.startsWith("//")) return `https:${im}`
  return `https://rscripts.net${im.startsWith("/") ? im : `/${im}`}`
}

function rsMap(s: Record<string, unknown>): NormalizedScript {
  const u = s.user as Record<string, unknown> | undefined
  return {
    id: `rs_${s._id}`,
    source: "rscripts",
    title: (s.title as string) ?? "Untitled",
    game: u?.username ? `by ${u.username}` : "RScripts",
    image: rsImg(s.image as string),
    views: (s.views as number) ?? 0,
    likes: (s.likes as number) ?? 0,
    verified: false,
    keySystem: Boolean(s.keySystem),
    paid: Boolean(s.paid),
    scriptType: s.paid ? "paid" : "free",
    createdAt: (s.createdAt as string) ?? null,
    script: null,
    rawUrl: (s.rawScript as string) ?? null,
    link: s.slug ? `https://rscripts.net/script/${s.slug}` : null,
  }
}

async function rsGet(q: string, p: number): Promise<NormalizedScript[]> {
  const u = q
    ? `https://rscripts.net/api/v2/scripts?q=${encodeURIComponent(q)}&page=${p}&orderBy=date&sort=desc`
    : `https://rscripts.net/api/v2/scripts?page=${p}&orderBy=date&sort=desc`
  try {
    const r = await fetch(u, {
      headers: { "User-Agent": ua, Accept: "application/json" },
      cache: "no-store",
    })
    if (!r.ok) return []
    const d = await r.json()
    const arr = d?.scripts ?? []
    return arr.map(rsMap)
  } catch {
    return []
  }
}

function mix(a: NormalizedScript[], b: NormalizedScript[]): NormalizedScript[] {
  const n = Math.max(a.length, b.length)
  const r: NormalizedScript[] = []
  for (let i = 0; i < n; i++) {
    if (a[i]) r.push(a[i])
    if (b[i]) r.push(b[i])
  }
  return r
}

export async function GET(req: Request) {
  const { searchParams: sp } = new URL(req.url)
  const q = sp.get("q")?.trim() ?? ""
  const p = Math.max(1, Number(sp.get("page") ?? "1") || 1)
  const src = sp.get("source") ?? "all"

  const jobs: Promise<NormalizedScript[]>[] = []
  if (src === "all" || src === "scriptblox") jobs.push(sbGet(q, p))
  if (src === "all" || src === "rscripts") jobs.push(rsGet(q, p))

  const out = await Promise.all(jobs)
  let list = out.flat()

  if (src === "all" && out.length === 2) {
    list = mix(out[0], out[1])
  }

  return NextResponse.json({ scripts: list, page: p })
}
