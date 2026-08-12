import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto"

const SECRET = "xscript-micdn-k9f2m7q1w8e4r6t0y3u5i7o9p1a3s5d"
const KEY = createHash("sha256").update(SECRET).digest()

export function seal(plain: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", KEY, iv)
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()])
  const tag = c.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64url")
}

export function open(tok: string): string | null {
  try {
    const buf = Buffer.from(tok, "base64url")
    if (buf.length < 28) return null
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const d = createDecipheriv("aes-256-gcm", KEY, iv)
    d.setAuthTag(tag)
    return Buffer.concat([d.update(data), d.final()]).toString("utf8")
  } catch {
    return null
  }
}
