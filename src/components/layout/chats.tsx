import { ChatsList } from "@/components/chats-list"
import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function Chats() {
    const session = await getAuthSession()

    const existingChats = await db.chat.findMany({
        where: {
            userIds: {
                has: session?.user.id,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            users: {
                select: USERS_SELECT,
            },
            messages: {
                include: {
                    seenBy: {
                        select: USERS_SELECT,
                    },
                },
            },
        },
    })

    return (
        <aside
            className="sticky left-0 top-0 flex h-screen flex-col border-r 
     border-secondary/75 bg-accent px-4 pb-5 pt-5 md:w-[var(--chats-width)]"
        >
            <h2 className="text-3xl font-semibold">Chats</h2>
            <ChatsList
                existingChats={existingChats}
                session={session}
            />
        </aside>
    )
}
