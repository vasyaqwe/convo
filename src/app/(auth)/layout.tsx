import "@app/globals.css"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { TanstackProvider } from "@/components/tanstack-provider"
import SessionProvider from "@/components/session-provider"
import { cn } from "@/lib/utils"
import { metadataConfig, viewportConfig } from "@/config"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = viewportConfig
export const metadata: Metadata = metadataConfig

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SessionProvider>
            <TanstackProvider>
                <html
                    lang="en"
                    className="dark"
                >
                    <body className={cn("", inter.className)}>
                        <main>
                            <Toaster
                                theme="dark"
                                position={"top-center"}
                                richColors
                                style={{ font: "inherit" }}
                            />
                            {children}
                        </main>
                    </body>
                </html>
            </TanstackProvider>
        </SessionProvider>
    )
}
