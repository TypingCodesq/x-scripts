"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Copy, Download, Loader2, X } from "lucide-react"
import type { NormalizedScript } from "@/lib/types"

async function load(u: string): Promise<{ content?: string; error?: string }> {
  try {
    const r = await fetch(`/api/script-content?url=${encodeURIComponent(u)}`)
    return await r.json()
  } catch {
    return { error: "Failed to load script." }
  }
}

function slug(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "script"
}

export function ScriptModal({
  script: s,
  onClose: close,
}: {
  script: NormalizedScript | null
  onClose: () => void
}) {
  const [c, setC] = useState<string | null>(null)
  const [ld, setLd] = useState(false)
  const [er, setEr] = useState<string | null>(null)
  const [cp, setCp] = useState(false)
  const [dl, setDl] = useState(false)

  useEffect(() => {
    if (!s) {
      setC(null)
      setEr(null)
      setCp(false)
      setDl(false)
      return
    }

    if (s.script) {
      setC(s.script)
      setEr(null)
      setLd(false)
      return
    }

    if (!s.rawUrl) {
      setC(null)
      setEr("No script content available.")
      setLd(false)
      return
    }

    setLd(true)
    setEr(null)
    setC(null)

    load(s.rawUrl).then((d) => {
      if (d.content) setC(d.content)
      else setEr(d.error ?? "Failed to load script.")
      setLd(false)
    })
  }, [s])

  useEffect(() => {
    if (!s) return
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [s, close])

  const lines = useMemo(() => (c ?? "").split("\n"), [c])
  const pad = String(lines.length).length

  if (!s) return null

  const title = s.title
  const game = s.game

  async function copy() {
    if (!c) return
    await navigator.clipboard.writeText(c)
    setCp(true)
    setTimeout(() => setCp(false), 2000)
  }

  function dload() {
    if (!c) return
    const blob = new Blob([c], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slug(title)}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setDl(true)
    setTimeout(() => setDl(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={close}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{game}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <div className="flex h-full max-h-[64vh] flex-col overflow-hidden rounded-lg border border-border bg-[#0a0f1a]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-500/70" />
                  <span className="size-2.5 rounded-full bg-amber-500/70" />
                  <span className="size-2.5 rounded-full bg-emerald-500/70" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">script.lua</span>
              </div>

              <div className="flex items-center gap-2">
                {c && (
                  <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                    {lines.length} lines
                  </span>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={copy}
                    disabled={!c || ld}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {cp ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">{cp ? "Copied" : "Copy"}</span>
                  </button>
                  {cp && (
                    <span className="copy-pop pointer-events-none absolute -top-8 left-1/2 whitespace-nowrap rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-black">
                      Copied to clipboard
                    </span>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={dload}
                    disabled={!c || ld}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {dl ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">{dl ? "Saved" : "Download"}</span>
                  </button>
                  {dl && (
                    <span className="copy-pop pointer-events-none absolute -top-8 left-1/2 whitespace-nowrap rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-black">
                      File downloaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {ld ? (
                <div className="flex h-full items-center justify-center gap-2 py-16 font-mono text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading script…
                </div>
              ) : er ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
                  <AlertTriangle className="size-6 text-destructive" />
                  <p className="text-sm text-destructive">{er}</p>
                </div>
              ) : (
                <div className="min-w-max font-mono text-[12.5px] leading-6">
                  {lines.map((ln, i) => (
                    <div key={i} className="flex hover:bg-white/[0.03]">
                      <span
                        className="sticky left-0 z-10 shrink-0 select-none bg-[#0a0f1a] px-3 text-right text-muted-foreground/40"
                        style={{ minWidth: `${pad + 2}ch` }}
                      >
                        {i + 1}
                      </span>
                      <span className="whitespace-pre pr-4 text-foreground/90">{ln || " "}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .copy-pop {
            animation: copy-pop 1.7s ease forwards;
          }
          @keyframes copy-pop {
            0% { opacity: 0; transform: translate(-50%, 4px) scale(.92); }
            14% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            82% { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%, -3px) scale(.96); }
          }
        `}</style>
      </div>
    </div>
  )
}
