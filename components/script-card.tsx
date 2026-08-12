"use client"

import { useState } from "react"
import { Eye, KeyRound, ShieldCheck, Gamepad2 } from "lucide-react"
import { getScriptImageUrl } from "@/lib/image-url"
import type { NormalizedScript } from "@/lib/types"

function views(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function ScriptCard({
  script: s,
  onSelect: pick,
}: {
  script: NormalizedScript
  onSelect: (s: NormalizedScript) => void
}) {
  const [bad, setBad] = useState(false)
  const src = getScriptImageUrl(s.image)
  const show = Boolean(src) && !bad

  return (
    <button
      type="button"
      onClick={() => pick(s)}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {show ? (
          <img
            src={src!}
            alt={`${s.game} thumbnail`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setBad(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Gamepad2 className="size-10" />
          </div>
        )}

        <div className="absolute right-2 top-2 flex gap-1.5">
          {s.paid && (
            <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-black">
              Paid
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <Eye className="size-3" />
          {views(s.views)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">
          {s.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{s.game}</p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {s.verified && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <ShieldCheck className="size-3" />
              Verified
            </span>
          )}
          {s.keySystem ? (
            <span className="flex items-center gap-1 rounded-md bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
              <KeyRound className="size-3" />
              Key
            </span>
          ) : (
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              No Key
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
