"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Check, Copy, Download, Loader2, X, Lock } from "lucide-react"
import type { NormalizedScript } from "@/lib/types"

const MIN_WAIT = 7
const PLACEMENT = "BqdU4pjwE"

function clean(s: string) {
  let o = s
  const r: [RegExp, string][] = [
    [/https?:\/\/(?:www\.)?rawscripts\.net/gi, "https://micdn"],
    [/https?:\/\/(?:www\.)?rscripts\.net/gi, "https://micdn"],
    [/https?:\/\/(?:www\.)?scriptblox\.com/gi, "https://micdn"],
    [/--\s*script\s*from\s*(?:rscripts|rawscripts|scriptblox)\.net/gi, ""],
    [/--\s*script\s*from\s*scriptblox\.com/gi, ""],
    [/rscripts\.net/gi, "micdn"],
    [/rawscripts\.net/gi, "micdn"],
    [/scriptblox\.com/gi, "micdn"],
  ]
  for (const [a, b] of r) o = o.replace(a, b)
  return o.replace(/^\s*--\s*$/gm, "")
}

async function load(u: string) {
  try {
    const r = await fetch(`/api/script-content?url=${encodeURIComponent(u)}`)
    const d = await r.json()
    if (d.content) d.content = clean(d.content)
    return d as { content?: string; error?: string }
  } catch {
    return { error: "Failed to load script." }
  }
}

function slug(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "script"
}

export function ScriptModal({
  script: s,
  onClose: close,
}: {
  script: NormalizedScript | null
  onClose: () => void
}) {
  const [phase, setPhase] = useState<"ad" | "load" | "ok" | "err">("ad")
  const [c, setC] = useState<string | null>(null)
  const [er, setEr] = useState<string | null>(null)
  const [cp, setCp] = useState(false)
  const [dl, setDl] = useState(false)
  const [left, setLeft] = useState(MIN_WAIT)
  const [clicked, setClicked] = useState(false)
  const [token, setToken] = useState("")
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const unlocked = useRef(false)
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    unlocked.current = false
    setPhase("ad")
    setC(null)
    setEr(null)
    setCp(false)
    setDl(false)
    setLeft(MIN_WAIT)
    setClicked(false)
    setToken(Math.random().toString(36).slice(2) + Date.now().toString(36))

    if (!s) return

    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          if (timer.current) clearInterval(timer.current)
          return 0
        }
        return v - 1
      })
    }, 1000)

    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [s])

  useEffect(() => {
    if (!s) return
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && unlocked.current) close()
    }
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [s, close])

  useEffect(() => {
    if (phase !== "ad" || !adRef.current) return
    const el = adRef.current
    const onInt = () => setClicked(true)
    el.addEventListener("click", onInt, true)
    el.addEventListener("pointerdown", onInt, true)
    return () => {
      el.removeEventListener("click", onInt, true)
      el.removeEventListener("pointerdown", onInt, true)
    }
  }, [phase])

  function unlock() {
    if (!s || unlocked.current) return
    if (left > 0 || !clicked) return
    unlocked.current = true
    setPhase("load")

    if (s.script) {
      setC(clean(s.script))
      setPhase("ok")
      return
    }
    if (!s.rawUrl) {
      setEr("No script content available.")
      setPhase("err")
      return
    }
    load(s.rawUrl).then((d) => {
      if (d.content) {
        setC(d.content)
        setPhase("ok")
      } else {
        setEr(d.error ?? "Failed to load script.")
        setPhase("err")
      }
    })
  }

  const lines = useMemo(() => (c ?? "").split("\n"), [c])
  const pad = String(lines.length).length
  const canUnlock = left === 0 && clicked

  if (!s) return null

  async function copy() {
    if (!c || !unlocked.current) return
    await navigator.clipboard.writeText(c)
    setCp(true)
    setTimeout(() => setCp(false), 2000)
  }

  function dload() {
    if (!c || !unlocked.current) return
    const blob = new Blob([c], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slug(s!.title)}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setDl(true)
    setTimeout(() => setDl(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => {
        if (unlocked.current) close()
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-gate={token}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{s.title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{s.game}</p>
          </div>
          {unlocked.current && (
            <button
              type="button"
              onClick={close}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {phase === "ad" && (
          <div className="flex flex-1 flex-col items-center gap-5 p-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/15">
              <Lock className="size-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">Sponsored Content</p>
              <p className="mt-1 text-sm text-muted-foreground">
                View the ad below, then continue to unlock the script.
              </p>
            </div>

            <div
              ref={adRef}
              className="relative w-full min-h-[220px] overflow-hidden rounded-lg border border-border bg-[#0a0f1a]"
              data-admaven={PLACEMENT}
            >
              <div
                id="admaven-ad"
                className="flex h-full min-h-[220px] w-full items-center justify-center"
              >
                <div className="px-4 text-center">
                  <p className="text-sm text-muted-foreground">Advertisement</p>
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    Click the ad area to continue
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-3">
              <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000"
                  style={{
                    width: `${((MIN_WAIT - left) / MIN_WAIT) * 100}%`,
                  }}
                />
              </div>
              <button
                type="button"
                disabled={!canUnlock}
                onClick={unlock}
                className="flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {left > 0
                  ? `Wait ${left}s…`
                  : !clicked
                    ? "Click the ad first"
                    : "Continue to Script"}
              </button>
            </div>
          </div>
        )}

        {(phase === "load" || phase === "ok" || phase === "err") && (
          <div className="flex-1 overflow-hidden p-4">
            <div className="flex h-full max-h-[64vh] flex-col overflow-hidden rounded-lg border border-border bg-[#0a0f1a]">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-white/[0.02] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-500/70" />
                    <span className="size-2.5 rounded-full bg-amber-500/70" />
                    <span className="size-2.5 rounded-full bg-emerald-500/70" />
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    script.lua
                  </span>
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
                      disabled={!c || phase === "load"}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {cp ? (
                        <Check className="size-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {cp ? "Copied" : "Copy"}
                      </span>
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
                      disabled={!c || phase === "load"}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {dl ? (
                        <Check className="size-3.5 text-emerald-400" />
                      ) : (
                        <Download className="size-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {dl ? "Saved" : "Download"}
                      </span>
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
                {phase === "load" ? (
                  <div className="flex h-full items-center justify-center gap-2 py-16 font-mono text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading script…
                  </div>
                ) : phase === "err" ? (
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
                        <span className="whitespace-pre pr-4 text-foreground/90">
                          {ln || " "}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
