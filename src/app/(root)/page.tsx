import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
    const session = await getAuthSession()

    if (!session) redirect("/sign-in")

    return (
        <div className="grid flex-1 place-content-center">
            <h1 className="text-2xl font-semibold">
                Select a chat or create a new group
            </h1>
        </div>
    )
}
