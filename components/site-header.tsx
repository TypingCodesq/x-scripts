import { Dc } from "@/components/discord-icon"

const LOGO = "https://i.ibb.co/cKmbdG4K/image.png"
const DC_LINK = "https://discord.gg/Catw7XmZQp"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <img
            src={LOGO}
            alt="X Script logo"
            className="size-9 rounded-lg object-cover"
          />
          <div className="leading-tight">
            <span className="block text-base font-semibold tracking-tight">
              X Script
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Roblox Scripts
            </span>
          </div>
        </a>

        <nav className="flex items-center gap-1 text-sm">
          <a
            href={DC_LINK}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Dc className="size-4" />
            <span className="hidden sm:inline">Discord</span>
          </a>
        </nav>
      </div>
    </header>
  )
}
