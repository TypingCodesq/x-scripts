import { SiteHeader } from "@/components/site-header"
import { ScriptsExplorer } from "@/components/scripts-explorer"

export default function Page() {
  return (
    <main className="aurora-bg min-h-screen">
      <SiteHeader />
      <ScriptsExplorer />
    </main>
  )
}
