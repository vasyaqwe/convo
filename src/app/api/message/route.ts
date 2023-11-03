import { MESSAGE_INCLUDE, USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { messageSchema } from "@/lib/validations/message"
import { NextResponse } from "next/server"

export const POST = withErrorHandling(async function (req: Request) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const _body = await req.json()

    const { chatId, body, image, replyToId } = messageSchema.parse(_body)

    await db.$transaction(async (tx) => {
        const newMessage = await tx.message.create({
            data: {
                chat: {
                    connect: {
                        id: chatId,
                    },
                },
                replyTo: {
                    connect: {
                        id: replyToId,
                    },
                },
                sender: {
                    connect: {
                        id: session.user.id,
                    },
                },
                seenBy: {
                    connect: {
                        id: session.user.id,
                    },
                },
                body,
                image,
            },
            include: MESSAGE_INCLUDE,
        })

        const updatedChat = await tx.chat.update({
            where: {
                id: chatId,
            },
            data: {
                messages: {
                    connect: {
                        id: newMessage.id,
                    },
                },
            },
        })

        await pusherServer.trigger(chatId, "message:new", newMessage)

        const partnerId = updatedChat.userIds.find(
            (id) => id !== session.user.id
        )

        for (const userId of updatedChat.userIds) {
            await pusherServer.trigger(userId, "chat:update", {
                id: chatId,
                message: newMessage,
            })
        }

        await pusherServer.trigger(partnerId!, "chat:new-message", {
            chatId,
            newMessage,
        })
    })

    return new NextResponse("OK")
})
