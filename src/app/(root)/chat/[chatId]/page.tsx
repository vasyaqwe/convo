import { Chat } from "@/components/chat"
import { MessageForm } from "@/components/forms/message-form"
import { ChatHeader } from "@/components/layout/chat-header"
import { MESSAGES_INFINITE_SCROLL_COUNT, USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { addDisplaySender, reverseArray } from "@/lib/utils"
import { notFound } from "next/navigation"

type PageProps = {
    params: {
        chatId: string
    }
}

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

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
                    sender: {
                        select: USERS_SELECT,
                    },
                    seenBy: {
                        select: USERS_SELECT,
                    },
                },
                take: MESSAGES_INFINITE_SCROLL_COUNT,
            },
        },
    })

    if (!chat) notFound()

    return (
        <div className="flex flex-1 flex-col bg-accent">
            <ChatHeader
                chat={chat}
                user={session!.user}
            />

            <Chat
                initialMessages={addDisplaySender(reverseArray(chat.messages))}
                session={session}
                chatId={chatId}
            />

            <MessageForm chatId={chatId} />
        </div>
    )
}
