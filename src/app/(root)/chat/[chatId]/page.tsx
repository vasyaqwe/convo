import { Chat } from "@/components/chat"
import { MessageForm } from "@/components/forms/message-form"
import { ChatHeader } from "@/components/layout/chat-header"
import { getAuthSession } from "@/lib/auth"
import { addDisplaySender, reverseArray } from "@/lib/utils"
import { notFound, redirect } from "next/navigation"
import {
    MESSAGES_INFINITE_SCROLL_COUNT,
    MESSAGE_INCLUDE,
    USERS_SELECT,
} from "@/config"
import { db } from "@/lib/db"

type PageProps = {
    params: {
        chatId: string
    }
}

function isObjectId(string: string) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    return objectIdRegex.test(string)
}

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default async function Page({ params: { chatId } }: PageProps) {
    const session = await getAuthSession()

    if (!isObjectId(chatId)) notFound()

    const chat = await db.chat.findFirst({
        where: { id: chatId },
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
    })

    if (!chat) notFound()

    if (!chat.userIds.includes(session?.user.id)) redirect("/")

    const chatPartnerName =
        chat.users.find((user) => user.id !== session?.user.id)?.name ??
        "convo."

    return (
        <div className="flex flex-1 flex-col bg-accent">
            <ChatHeader
                chat={chat}
                user={session!.user}
            />

            <Chat
                chatPartnerName={chatPartnerName}
                initialMessages={addDisplaySender(
                    reverseArray(chat.messages ?? [])
                )}
                session={session}
                chatId={chatId}
            />

            <MessageForm chatId={chatId} />
        </div>
    )
}
