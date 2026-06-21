"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"
import { Loader2, Search, X } from "lucide-react"
import { ScriptCard } from "@/components/script-card"
import { ScriptModal } from "@/components/script-modal"
import { Button } from "@/components/ui/button"
import type { NormalizedScript } from "@/lib/types"

type Page = { scripts: NormalizedScript[] }

const get = (u: string) => fetch(u).then((r) => r.json())

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

function dedupe(pages: Page[] | undefined, seed: number, q: string): NormalizedScript[] {
  const sn = new Set<string>()
  const arr: NormalizedScript[] = []
  for (const pg of pages ?? []) {
    const items = pg?.scripts ?? []
    const ordered = q ? items : [...items].sort((a, b) => hash(a.id + seed) - hash(b.id + seed))
    for (const s of ordered) {
      if (!sn.has(s.id)) {
        sn.add(s.id)
        arr.push(s)
      }
    }
  }
  return arr
}

function buildKey(q: string) {
  return (i: number, prev: Page | null) => {
    if (prev && prev.scripts.length === 0) return null
    const sp = new URLSearchParams({ page: String(i + 1), source: "all" })
    if (q) sp.set("q", q)
    return `/api/scripts?${sp.toString()}`
  }
}

function exhausted(pages: Page[] | undefined): boolean {
  if (!pages || pages.length === 0) return false
  const last = pages[pages.length - 1]
  if (!last || last.scripts.length === 0) return true
  const seen = new Set<string>()
  for (let i = 0; i < pages.length - 1; i++) {
    for (const s of pages[i]?.scripts ?? []) seen.add(s.id)
  }
  return last.scripts.every((s) => seen.has(s.id))
}

export function ScriptsExplorer() {
  const [v, setV] = useState("")
  const [q, setQ] = useState("")
  const [sel, setSel] = useState<NormalizedScript | null>(null)
  const [seed] = useState(() => Math.random())

  useEffect(() => {
    const t = setTimeout(() => setQ(v.trim()), 450)
    return () => clearTimeout(t)
  }, [v])

  const {
    data: pages,
    size: sz,
    setSize: setSz,
    isValidating: val,
    isLoading: ld,
  } = useSWRInfinite<Page>(buildKey(q), get, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  })

  const list = useMemo(() => dedupe(pages, seed, q), [pages, seed, q])

  const end = exhausted(pages)
  const more = val && (pages?.length ?? 0) > 0
  const empty = !ld && list.length === 0

  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
      <section className="py-10 text-center md:py-16">
        <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl">
          <span className="tw-type">
            Welcome to <span className="text-primary">X Script</span>
          </span>
        </h1>
        <style>{`
          .tw-type {
            display: inline-block;
            max-width: 100%;
            overflow: hidden;
            white-space: nowrap;
            vertical-align: bottom;
            border-right: 3px solid var(--primary);
            width: 0;
            animation:
              tw-w 1.4s steps(19, end) .15s forwards,
              tw-c .35s step-end 4 .15s forwards;
          }
          @keyframes tw-w {
            from { width: 0; }
            to { width: 100%; }
          }
          @keyframes tw-c {
            0%, 100% { border-color: transparent; }
            50% { border-color: var(--primary); }
          }
          @media (prefers-reduced-motion: reduce) {
            .tw-type {
              animation: none;
              width: 100%;
              border-right: none;
            }
          }
        `}</style>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
          Scripts for every game. One search. Zero hassle..
        </p>

        <div className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/60">
          <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
          <input
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder="Search scripts, games… (e.g. Blox Fruits, Pet Sim)"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search scripts"
          />
          {v && (
            <button
              type="button"
              onClick={() => setV("")}
              aria-label="Clear search"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </section>

      <div ref={ref}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {q ? (
              <>
                Results for{" "}
                <span className="text-foreground">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              "Trending scripts"
            )}
          </h2>
          {list.length > 0 && (
            <span className="text-xs text-muted-foreground">{list.length} shown</span>
          )}
        </div>

        {ld ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="aspect-video w-full animate-pulse bg-muted" />
                <div className="space-y-2 p-3.5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <Search className="size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No scripts found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search term or source.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((s) => (
              <ScriptCard key={s.id} script={s} onSelect={setSel} />
            ))}
          </div>
        )}

        {!empty && !ld && !end && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setSz(sz + 1)}
              disabled={more}
              className="min-w-40 bg-transparent"
            >
              {more ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </div>

      <ScriptModal script={sel} onClose={() => setSel(null)} />
    </div>
  )
}