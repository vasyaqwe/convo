import { MessageForm } from "@/components/forms/message-form"
import { Message } from "@/components/message"
import { UserAvatar } from "@/components/ui/user-avatar"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { ExtendedMessage } from "@/types"
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
                include: {
                    sender: true,
                    seenBy: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    })

    if (!chat) notFound()

    const chatParticipant = chat.users.find(
        (u) => u.id !== session?.user.id
    ) as User
    // casting because I know better

    function addDisplaySender(messages: ExtendedMessage[]) {
        let prevSenderId: string | null = null

        return messages.map((message, index, array) => {
            if (message.senderId === prevSenderId) {
                message.displaySender = false
            } else {
                prevSenderId = message.senderId
                message.displaySender = true
            }
            return message
        })
    }

    const messages = addDisplaySender(chat.messages)

    return (
        <div className="flex flex-1 flex-col bg-accent">
            <header className="flex h-[var(--header-height)] items-center gap-3 border-b border-secondary/75 p-4 ">
                <UserAvatar user={chatParticipant} />
                <p>{chatParticipant.name}</p>
            </header>
            <div className="flex h-[calc(100vh-var(--header-height)-var(--message-form-height))] flex-col  overflow-y-auto p-4">
                {messages.length < 1 && (
                    <p className="my-auto self-center text-2xl font-semibold">
                        No history yet.
                    </p>
                )}
                {messages.map((message, idx) => (
                    <Message
                        isLast={idx === chat.messages.length - 1}
                        session={session}
                        key={message.id}
                        message={message}
                    />
                ))}
            </div>
            <MessageForm chatId={chatId} />
        </div>
    )
}
