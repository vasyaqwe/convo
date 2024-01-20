import { MESSAGE_INCLUDE } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { messageSchema } from "@/lib/validations/message"
import { type Prisma } from "@prisma/client"
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

    let data: Prisma.MessageCreateInput = {
        chat: {
            connect: {
                id: chatId,
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
    }

    if (replyToId) {
        data = {
            ...data,
            replyTo: {
                connect: {
                    id: replyToId,
                },
            },
        }
    }

    await db.$transaction(async (tx) => {
        const newMessage = await tx.message.create({
            data,
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
            select: {
                userIds: true,
                mutedByIds: true,
            },
        })

        const partnerId = updatedChat.userIds.find(
            (id) => id !== session.user.id
        )

        for (const userId of updatedChat.userIds) {
            await pusherServer.trigger(userId, "chat:update", {
                id: chatId,
                message: newMessage,
            })
        }
        // if chat is not muted
        if (!updatedChat.mutedByIds.includes(partnerId!)) {
            await pusherServer.trigger(partnerId!, "chat:new-message", {
                chatId,
                newMessage,
            })
        }
    })

    await pusherServer.trigger(chatId, "message:new", {})

    return new NextResponse("OK")
})
