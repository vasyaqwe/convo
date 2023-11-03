import { MESSAGE_INCLUDE, USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

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

    await db.$transaction(async (tx) => {
        const updatedMessage = await tx.message.update({
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
            include: MESSAGE_INCLUDE,
        })

        await pusherServer.trigger(session.user.id, "chat:update", {
            id: updatedMessage.chatId,
            message: updatedMessage,
        })

        await pusherServer.trigger(
            updatedMessage.chatId,
            "message:update",
            updatedMessage
        )
    })

    return new NextResponse("OK")
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
            image: true,
        },
    })

    if (!message) {
        return new NextResponse("Invalid message id", { status: 400 })
    }

    if (message.senderId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    await db.$transaction(async (tx) => {
        await tx.message.delete({
            where: {
                id: messageId,
            },
        })

        const imageId = message.image?.split("/f/")[1] ?? ""

        if (message.image) {
            await utapi.deleteFiles(imageId)
        }

        const updatedChat = await tx.chat.findFirst({
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
                message,
                messageDeleted: true,
            })
        }

        await pusherServer.trigger(message.chatId, "message:delete", messageId)
    })

    return new NextResponse("OK")
})
