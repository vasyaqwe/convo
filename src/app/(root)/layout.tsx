import "../globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { TanstackProvider } from "@/components/tanstack-provider"
import SessionProvider from "@/components/session-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { Chats } from "@/components/layout/chats"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ActiveUsers } from "@/components/active-users"

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

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getAuthSession()

    if (!session) redirect("/sign-in")

    return (
        <SessionProvider>
            <TanstackProvider>
                <html
                    lang="en"
                    className="dark [--avatar-size:40px] [--chats-width:320px] [--header-height:73px] [--message-form-height:61px]
               [--message-form-image-height:0px] [--sidebar-width:65px] md:[--avatar-size:45px]"
                >
                    <body className={cn("flex", inter.className)}>
                        <Sidebar session={session} />
                        <main className="flex flex-1">
                            <Chats
                                session={session}
                                className="max-md:hidden"
                            />
                            {children}
                        </main>
                        <Toaster
                            theme="dark"
                            position={"top-center"}
                            richColors
                            style={{ font: "inherit" }}
                        />
                        <ActiveUsers />
                    </body>
                </html>
            </TanstackProvider>
        </SessionProvider>
    )
}
