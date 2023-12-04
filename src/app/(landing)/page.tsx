import Image from "next/image"
import Link from "next/link"
import search from "@public/images/search.png"
import reactions from "@public/images/reactions.png"
import replies from "@public/images/replies.png"
import { Button } from "@/components/ui/button"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Page() {
    const session = await getAuthSession()

    if (session) redirect("/chats")

    return (
        <section className="flex-1 px-10 py-10 md:grid md:place-content-center md:py-20">
            <h1 className="text-center text-4xl font-bold leading-tight md:text-5xl">
                Messaging has{" "}
                <span className="bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
                    never
                </span>
                <br />
                been easier.
            </h1>
            <p className="mx-auto mb-12 mt-6 max-w-3xl text-center text-primary-foreground/75">
                convo is a progressive messaging web app (you can download the
                site and use it as a native app), built with Next.js 14 &
                Typescript. Everything happens in real-time, with the help of{" "}
                <Link
                    className="font-semibold underline hover:no-underline"
                    href={"https://pusher.com/"}
                    target="_blank"
                >
                    Pusher
                </Link>
                .
            </p>
            <div className="flex flex-wrap items-start justify-center gap-5  md:gap-10">
                <Image
                    className="rounded-xl border border-secondary"
                    src={search}
                    alt="convo - search"
                />
                <Image
                    className="mx-auto rounded-xl border border-secondary"
                    src={reactions}
                    alt="convo - reactions"
                />
                <Image
                    className="rounded-xl border border-secondary"
                    src={replies}
                    alt="convo - replies"
                />
            </div>
            <p className="mx-auto mt-12 max-w-3xl text-center text-primary-foreground/75">
                convo has all the features a messaging app should have, as well
                as notifications, and some ui indicators, like unread messages
                count both on the site and in the browser tab, and if a person
                is currently online.
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-center text-primary-foreground/75">
                A comprehensive search where you can look not only for people,
                but also messages. <br /> Reactions, and replies.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                    variant={"secondary"}
                    asChild
                >
                    <Link href={"/sign-in"}>Sign in</Link>
                </Button>
            </div>
        </section>
    )
}
