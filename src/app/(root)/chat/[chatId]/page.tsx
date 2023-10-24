import { Chat } from "@/components/chat"
import { MessageForm } from "@/components/forms/message-form"
import { ChatHeader } from "@/components/layout/chat-header"
import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { addDisplaySender, reverseArray } from "@/lib/utils"
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
            users: {
                select: USERS_SELECT,
            },
            messages: {
                include: {
                    sender: {
                        select: USERS_SELECT,
                    },
                    seenBy: {
                        select: USERS_SELECT,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
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
