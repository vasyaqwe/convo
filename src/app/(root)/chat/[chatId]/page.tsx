import { Chat } from "@/components/chat"
import { MessageForm } from "@/components/forms/message-form"
import { ChatHeader } from "@/components/layout/chat-header"
import { getAuthSession } from "@/lib/auth"
import { addDisplaySender, reverseArray } from "@/lib/utils"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { metadataConfig } from "@/config"
import { ExtendedChat } from "@/types"
import { headers } from "next/headers"

type PageProps = {
    params: {
        chatId: string
    }
}

async function getChat(chatId: string) {
    const host = headers().get("host")
    const protocol = process?.env.NODE_ENV === "development" ? "http" : "https"
    const res = await fetch(`${protocol}://${host}/api/chat/${chatId}`, {
        cache: "no-store",
    })

    if (!res.ok) {
        throw new Error("Failed to fetch chat")
    }

    return res.json()
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const session = await getAuthSession()
    const chat: ExtendedChat = await getChat(params.chatId)

    const chatPartnerName = chat.users.find(
        (user) => user.id !== session?.user.id
    )?.name

    return {
        ...metadataConfig,
        title: chatPartnerName,
    }
}

export default async function Page({ params: { chatId } }: PageProps) {
    const session = await getAuthSession()

    const chat: ExtendedChat = await getChat(chatId)

    if (!chat) notFound()

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
