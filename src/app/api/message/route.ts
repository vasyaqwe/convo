import { USERS_SELECT } from "@/config"
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

    const { chatId, body, image } = messageSchema.parse(_body)

    const newMessage = await db.message.create({
        data: {
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
        },
        include: {
            seenBy: {
                select: USERS_SELECT,
            },
            sender: {
                select: USERS_SELECT,
            },
        },
    })

    const updatedChat = await db.chat.update({
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
        include: {
            messages: {
                include: {
                    seenBy: {
                        select: USERS_SELECT,
                    },
                    sender: {
                        select: {
                            name: true,
                        },
                    },
                },
                take: 1,
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    })

    const lastMessage = updatedChat.messages[updatedChat.messages.length - 1]

    await pusherServer.trigger(chatId, "message:new", newMessage)

    const partnerId = updatedChat.userIds.find((id) => id !== session.user.id)

    await pusherServer.trigger(partnerId!, "chat:update", {
        id: chatId,
        messages: [lastMessage],
    })

    await pusherServer.trigger(partnerId!, "chat:new-message", {
        chatId,
        newMessage,
    })

    return new NextResponse(JSON.stringify(newMessage))
})
