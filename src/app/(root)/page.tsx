import { Chats } from "@/components/layout/chats"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
    const session = await getAuthSession()

    if (!session) redirect("/sign-in")

    return (
        <div className="flex-1 md:grid md:place-content-center">
            <Chats className="md:hidden" />
            <h1 className="text-2xl font-semibold max-md:hidden">
                Select a chat or create a new group
            </h1>
        </div>
    )
}
