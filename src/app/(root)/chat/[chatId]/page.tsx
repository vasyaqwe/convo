import { Chat } from "@/components/chat"
import { MessageForm } from "@/components/forms/message-form"
import { UserAvatar } from "@/components/ui/user-avatar"
import { MESSAGES_INFINITE_SCROLL_COUNT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { addDisplaySender, reverseArray } from "@/lib/utils"
import { User } from "@prisma/client"
import { notFound } from "next/navigation"

type PageProps = {
    params: {
        chatId: string
    }
}

export default async function Page({ params: { chatId } }: PageProps) {
    const session = await getAuthSession()

    const chat = await db.chat.findFirst({
        where: { id: chatId },
        include: {
            users: true,
            messages: {
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    sender: true,
                    seenBy: true,
                },
                take: MESSAGES_INFINITE_SCROLL_COUNT,
            },
        },
    })

    if (!chat) notFound()

    const chatPartner = chat.users.find(
        (u) => u.id !== session?.user.id
    ) as User
    // casting because I know better

    return (
        <div className="flex flex-1 flex-col bg-accent">
            <header className="flex h-[var(--header-height)] items-center gap-3 border-b border-secondary/75 p-4 ">
                <UserAvatar user={chatPartner} />
                <p>{chatPartner.name}</p>
            </header>

            <Chat
                initialMessages={addDisplaySender(reverseArray(chat.messages))}
                session={session}
                chatId={chatId}
            />
            <MessageForm chatId={chatId} />
        </div>
    )
}
