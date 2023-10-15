import { Chat } from "@/components/chat"
import { MessageForm } from "@/components/forms/message-form"
import { ChatHeader } from "@/components/layout/chat-header"
import { MESSAGES_INFINITE_SCROLL_COUNT } from "@/config"
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

    return (
        <div className="flex flex-1 flex-col bg-accent">
            <ChatHeader
                chat={chat}
                user={session!.user}
            />
            {chat.messages.length < 1 ? (
                <p className="my-auto self-center text-2xl font-semibold">
                    No history yet.
                </p>
            ) : (
                <Chat
                    initialMessages={addDisplaySender(
                        reverseArray(chat.messages)
                    )}
                    session={session}
                    chatId={chatId}
                />
            )}

            <MessageForm chatId={chatId} />
        </div>
    )
}
