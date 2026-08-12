export function getScriptImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("/api/image")) return url
  return url
}
