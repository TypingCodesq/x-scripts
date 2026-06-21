export type ScriptSource = "scriptblox" | "rscripts"

export interface NormalizedScript {
  id: string
  source: ScriptSource
  title: string
  game: string
  image: string | null
  views: number
  likes: number
  verified: boolean
  keySystem: boolean
  paid: boolean
  scriptType: string
  createdAt: string | null
  script: string | null
  rawUrl: string | null
  link: string | null
}
