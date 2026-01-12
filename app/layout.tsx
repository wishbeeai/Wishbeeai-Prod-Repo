import type React from "react"
import type { Metadata } from "next"
import { Poppins, Inter, Shadows_Into_Light, Kalam, Dancing_Script, Pacifico } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-shadows",
})

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kalam",
})

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-dancing",
})

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

export const metadata: Metadata = {
  title: "Wishbee.ai - Gift Together. Give Better.",
  description: "The modern wishlist that pools money for the perfect group gift",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} ${shadowsIntoLight.variable} ${kalam.variable} ${dancingScript.variable} ${pacifico.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
          <SonnerToaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                background: '#F5F1E8',
                border: '1px solid #DAA520',
              },
            }}
          />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
