import { ChatsSearch } from "@/components/chats-search"
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
        include: {
            users: {
                select: {
                    name: true,
                    username: true,
                    id: true,
                },
            },
        },
    })

    return (
        <aside
            className="sticky left-0 top-0 flex h-screen flex-col border-r 
     border-secondary/75 bg-accent px-5 pb-5 pt-5 md:w-[var(--chats-width)]"
        >
            <h2 className="text-3xl font-semibold">Chats</h2>
            <ChatsSearch
                existingChats={existingChats}
                session={session}
            />
            {/* {users.length < 1 && (
                <p className="mt-8 text-foreground/70">Nobody here yet.</p>
            )}
            {users
                .filter((u) => u.id !== session?.user.id)
                .map((user) => (
                    <UserButton
                        user={user}
                        key={user.id}
                    />
                ))} */}
        </aside>
    )
}
