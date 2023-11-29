import { ChatsList } from "@/components/chats-list"

import { cn, reverseArray } from "@/lib/utils"
import type { Session } from "next-auth"
import {
    MESSAGES_INFINITE_SCROLL_COUNT,
    MESSAGE_INCLUDE,
    USERS_SELECT,
} from "@/config"
import { db } from "@/lib/db"

export async function Chats({
    className,
    session,
    ...props
}: React.ComponentProps<"aside"> & {
    session: Session
}) {
    const chats = await db.chat.findMany({
        where: {
            userIds: {
                has: session.user.id,
            },
        },
        include: {
            users: {
                select: USERS_SELECT,
            },
            messages: {
                include: MESSAGE_INCLUDE,
                orderBy: {
                    createdAt: "desc",
                },
                take: MESSAGES_INFINITE_SCROLL_COUNT,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return (
        <aside
            className={cn(
                "sticky left-0 top-0 flex h-[100svh] flex-col border-r border-secondary bg-accent md:w-[var(--chats-width)] md:pb-5",
                className
            )}
            {...props}
        >
            <header className="flex h-[var(--header-height)] flex-shrink-0 items-center border-b border-secondary px-4 ">
                <h2 className="text-3xl font-semibold">Chats</h2>
            </header>
            <ChatsList
                session={session}
                initialChats={chats.map((chat) => ({
                    ...chat,
                    messages: reverseArray(chat.messages ?? []),
                }))}
            />
        </aside>
    )
}
