import "../globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { TanstackProvider } from "@/components/tanstack-provider"
import SessionProvider from "@/components/session-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Chats } from "@/components/layout/chats"

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
        <SessionProvider>
            <TanstackProvider>
                <html
                    lang="en"
                    className="dark [--avatar-size:45px] [--chats-width:320px]
               [--header-height:73px] [--message-form-height:61px] [--sidebar-width:57px]"
                >
                    <body className={cn("flex", inter.className)}>
                        <Sidebar />
                        <main className="flex flex-1">
                            <Chats />
                            {children}
                        </main>
                        <MobileNav />
                        <Toaster
                            theme="dark"
                            position={"top-center"}
                            richColors
                            style={{ font: "inherit" }}
                        />
                    </body>
                </html>
            </TanstackProvider>
        </SessionProvider>
    )
}
