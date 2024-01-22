"use server"

import { MESSAGE_INCLUDE } from "@/config"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { type Session } from "next-auth"

export async function startTyping({
    chatId,
    session,
}: {
    chatId: string
    session: Session
}) {
    await pusherServer.trigger(chatId, "chat:start-typing", {
        typingUser: session.user,
    })
}

export async function endTyping({
    chatId,
    session,
}: {
    chatId: string
    session: Session
}) {
    await pusherServer.trigger(chatId, "chat:end-typing", {
        typingUser: session.user,
    })
}

export async function seeMessage({
    userId,
    messageId,
}: {
    messageId: string
    userId: string
}) {
    const updatedMessage = await db.message.update({
        where: {
            id: messageId,
        },
        data: {
            seenBy: {
                connect: {
                    id: userId,
                },
            },
        },
        include: MESSAGE_INCLUDE,
    })

    await pusherServer.trigger(userId, "chat:update", {
        id: updatedMessage.chatId,
        message: updatedMessage,
    })

    await pusherServer.trigger(
        updatedMessage.chatId,
        "message:update",
        updatedMessage
    )

    return "OK"
}
