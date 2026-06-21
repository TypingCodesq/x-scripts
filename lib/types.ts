export type NormalizedScript = {
  id: string
  source: "scriptblox" | "rscripts"
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
