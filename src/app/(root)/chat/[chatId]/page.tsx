import { Chat } from "@/components/chat"
import { MessageForm } from "@/components/forms/message-form"
import { ChatHeader } from "@/components/layout/chat-header"
import { getAuthSession } from "@/lib/auth"
import { isObjectId } from "@/lib/utils"
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
                session={session}
            />

            <Chat
                chatPartnerName={chatPartnerName}
                initialMessages={chat.messages ?? []}
                session={session}
                chatId={chatId}
            />

            <MessageForm
                key={"message-form"}
                session={session}
                chatId={chatId}
            />
        </div>
    )
}
