import { Chats } from "@/components/layout/chats"
import { MobileNav } from "@/components/layout/mobile-nav"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default async function Page() {
    const session = await getAuthSession()

    if (!session) redirect("/")

    return (
        <div className="flex-1 md:grid md:place-content-center">
            <Chats
                session={session}
                className="md:hidden"
            />
            <h1 className="rounded-full border border-primary/75 bg-secondary px-3 py-1 text-lg font-semibold max-md:hidden">
                Select or search for a chat to start messaging
            </h1>
            <MobileNav session={session} />
        </div>
    )
}
