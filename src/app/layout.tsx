import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { TanstackProvider } from "@/components/tanstack-provider"
import SessionProvider from "@/components/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "convo.",
    description: "convo is a modern messaging app. Built with Next.js 13.",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html
            lang="en"
            className="dark"
        >
            <body className={inter.className}>
                <SessionProvider>
                    <TanstackProvider>
                        <main>
                            <Toaster
                                theme="dark"
                                position={"top-center"}
                                richColors
                                style={{ font: "inherit" }}
                            />
                            {children}
                        </main>
                    </TanstackProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
