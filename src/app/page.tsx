import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/layout/header"

export default async function Home() {
    const session = await getAuthSession()

    if (!session) redirect("/sign-in")

    return (
        <>
            <h1>Hello.</h1>
            {session.user.username}
            <Header />
        </>
    )
}
