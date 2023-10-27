import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { NextResponse } from "next/server"

export const PATCH = withErrorHandling(async function (
    _req: Request,
    { params: { messageId } }
) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const message = await db.message.findFirst({
        where: {
            id: messageId,
        },
        select: {
            id: true,
            chatId: true,
        },
    })

    if (!message) {
        return new NextResponse("Invalid message id", { status: 400 })
    }

    const chat = await db.chat.findFirst({
        where: {
            id: message?.chatId,
        },
        select: {
            userIds: true,
        },
    })

    if (!chat?.userIds.includes(session.user.id)) {
        return new NextResponse("To see message, must be one of chat users", {
            status: 400,
        })
    }

    const updatedMessage = await db.message.update({
        where: {
            id: messageId,
        },
        data: {
            seenBy: {
                connect: {
                    id: session.user.id,
                },
            },
        },
        include: {
            sender: {
                select: USERS_SELECT,
            },
            seenBy: {
                select: USERS_SELECT,
            },
        },
    })

    await pusherServer.trigger(session.user.id, "chat:update", {
        id: updatedMessage.chatId,
        messages: [updatedMessage],
    })

    await pusherServer.trigger(
        updatedMessage.chatId,
        "message:update",
        updatedMessage
    )

    return new NextResponse(JSON.stringify(updatedMessage))
})

export const DELETE = withErrorHandling(async function (
    _req: Request,
    { params: { messageId } }
) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const message = await db.message.findFirst({
        where: {
            id: messageId,
        },
        select: {
            id: true,
            senderId: true,
            chatId: true,
        },
    })

    if (!message) {
        return new NextResponse("Invalid message id", { status: 400 })
    }

    if (message.senderId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    await db.message.delete({
        where: {
            id: messageId,
        },
    })

    const updatedChat = await db.chat.findFirst({
        where: {
            id: message.chatId,
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
                orderBy: {
                    createdAt: "desc",
                },
                take: 1,
            },
        },
    })

    for (const userId of updatedChat?.userIds ?? []) {
        await pusherServer.trigger(userId, "chat:update", {
            id: message.chatId,
            messages: updatedChat?.messages,
        })
    }

    await pusherServer.trigger(message.chatId, "message:delete", messageId)

    return new NextResponse("OK")
})
