import "../globals.css"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { metadataConfig, viewportConfig } from "@/config"
import Image from "next/image"
import logo from "@public/logo.svg"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAuthSession } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = viewportConfig
export const metadata: Metadata = metadataConfig

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getAuthSession()

    return (
        <html
            lang="en"
            className={cn(`dark`)}
        >
            <body className={cn(inter.className)}>
                <header className=" border-b border-secondary bg-accent py-4">
                    <div className="container flex items-center justify-between">
                        <div className="flex w-fit items-center justify-center gap-2">
                            <Image
                                src={logo}
                                alt="Discusst"
                                className="mx-auto max-w-[35px]"
                            />
                            <p className="bg-gradient-to-r from-primary to-white bg-clip-text text-3xl font-semibold text-transparent max-sm:hidden">
                                {" "}
                                convo.
                            </p>
                        </div>
                        <nav className="flex items-center gap-4">
                            {!session && (
                                <Button
                                    variant={"secondary"}
                                    asChild
                                >
                                    <Link href={"/sign-in"}>Sign in</Link>
                                </Button>
                            )}
                            <Button asChild>
                                <Link href={session ? "/chats" : "/sign-up"}>
                                    Start messaging
                                </Link>
                            </Button>
                        </nav>
                    </div>
                </header>
                <main>{children}</main>
                <footer className="border-t border-secondary py-10">
                    <p className="container text-primary-foreground/80">
                        Built by{" "}
                        <Link
                            target="_blank"
                            className="font-semibold underline hover:no-underline"
                            href={"https://github.com/vasyaqwe"}
                        >
                            Vasyl Polishchuk
                        </Link>
                        . Source code is available on{" "}
                        <Link
                            href={"https://github.com/vasyaqwe/convo"}
                            className="font-semibold underline hover:no-underline"
                            target="_blank"
                        >
                            Github
                        </Link>
                        .
                    </p>
                </footer>
            </body>
        </html>
    )
}
