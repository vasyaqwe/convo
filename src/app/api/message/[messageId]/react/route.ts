import { MESSAGE_INCLUDE, USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { reactionSchema } from "@/lib/validations/reaction"
import { NextResponse } from "next/server"

export const PATCH = withErrorHandling(async function (
    req: Request,
    { params: { messageId } }
) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const message = await db.message.findUnique({
        where: {
            id: messageId,
        },
        include: MESSAGE_INCLUDE,
    })

    if (!message) {
        return new NextResponse("Invalid message id", {
            status: 400,
        })
    }

    const chat = await db.chat.findFirst({
        where: {
            id: message.chatId,
        },
        select: {
            userIds: true,
        },
    })

    if (!chat?.userIds.includes(session.user.id)) {
        return new NextResponse(
            "To react to message, must be one of chat users",
            {
                status: 403,
            }
        )
    }

    const _body = await req.json()
    const { body } = reactionSchema.parse(_body)

    const existingReaction = message.reactions.find(
        (r) => r.sender.id === session.user.id && r.body === body
    )

    if (existingReaction) {
        await db.$transaction(async (tx) => {
            const deletedReaction = await tx.reaction.delete({
                where: {
                    senderId: existingReaction.sender.id,
                    id: existingReaction.id,
                    body: existingReaction.body,
                },
            })

            await pusherServer.trigger(message.chatId, "message:update", {
                ...message,
                reactions: message.reactions.filter(
                    (r) => r.id !== deletedReaction.id
                ),
            })
        })

        return new NextResponse("OK")
    }

    await db.$transaction(async (tx) => {
        const createdReaction = await tx.reaction.create({
            data: {
                body,
                message: {
                    connect: {
                        id: messageId,
                    },
                },
                sender: {
                    connect: {
                        id: session.user.id,
                    },
                },
            },
        })

        await pusherServer.trigger(message.chatId, "message:update", {
            ...message,
            reactions: [...message.reactions, createdReaction],
        })
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
