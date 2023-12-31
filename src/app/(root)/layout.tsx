import "../globals.css"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"

import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { Chats } from "@/components/layout/chats"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ActiveUsers } from "@/components/active-users"
import { Notifications } from "@/components/notifications"
import { metadataConfig, viewportConfig } from "@/config"
import { TanstackProvider } from "@/components/tanstack-provider"
import SessionProvider from "@/components/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const dynamic = "force-dynamic"

export const viewport: Viewport = viewportConfig
export const metadata: Metadata = metadataConfig

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getAuthSession()

    if (!session) redirect("/")

    return (
        <SessionProvider>
            <TanstackProvider>
                <html
                    lang="en"
                    className={cn(
                        `dark [--avatar-size:45px] [--chats-width:340px] [--header-height:73px] [--message-form-height:60px]
                         [--message-form-image-height:0px] [--message-form-reply-height:0px] [--sidebar-width:65px]`
                    )}
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
                        <Notifications session={session} />
                    </body>
                </html>
            </TanstackProvider>
        </SessionProvider>
    )
}
