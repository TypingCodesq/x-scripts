import { SiteHeader } from "@/components/site-header"
import { ScriptsExplorer } from "@/components/scripts-explorer"

export default function Home() {
  return (
    <div className="aurora-bg min-h-screen">
      <SiteHeader />
      <ScriptsExplorer />
    </div>
  )
}
