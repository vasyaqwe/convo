import "../globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { TanstackProvider } from "@/components/tanstack-provider"
import SessionProvider from "@/components/session-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "convo.",
    description: "convo is a modern messaging app. Built with Next.js 13.",
    viewport:
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
    themeColor: "#fff",
    manifest: "/manifest.json",
    icons: {
        apple: "/apple-touch-icon.png",
    },
}

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
