export function getScriptImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return `/api/image?url=${encodeURIComponent(url)}`
}
