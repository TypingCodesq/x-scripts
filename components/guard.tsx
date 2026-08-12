"use client"

import { useEffect } from "react"

export function Guard() {
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === "U")
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    const ctx = (e: MouseEvent) => e.preventDefault()
    document.addEventListener("keydown", block, true)
    document.addEventListener("contextmenu", ctx)

    const n = setInterval(() => {
      const s = new Date()
      debugger
      if (new Date().getTime() - s.getTime() > 100) {
        document.body.innerHTML = ""
      }
    }, 1500)

    return () => {
      document.removeEventListener("keydown", block, true)
      document.removeEventListener("contextmenu", ctx)
      clearInterval(n)
    }
  }, [])
  return null
}
