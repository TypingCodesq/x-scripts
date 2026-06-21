import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const gs = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const gm = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "X Script",
  description:
    "Scripts for every game. One search. Zero hassle.",
  icons: {
    icon: "https://i.ibb.co/cKmbdG4K/image.png",
    apple: "https://i.ibb.co/cKmbdG4K/image.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#050810",
}

export default function RootLayout({
  children: kids,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${gs.variable} ${gm.variable}`}>
      <body className="font-sans antialiased bg-black text-foreground">{kids}</body>
    </html>
  )
}