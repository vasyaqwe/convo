import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

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
    })

    if (!message) {
        return new NextResponse("Invalid message id", { status: 400 })
    }

    if (message.senderId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    const deletedMessage = await db.message.delete({
        where: {
            id: messageId,
        },
    })

    const imageId = message.image?.split("/f/")[1] ?? ""

    if (message.image) {
        await utapi.deleteFiles(imageId)
    }

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
            message,
            messageDeleted: true,
        })
    }

    await pusherServer.trigger(
        message.chatId,
        "message:delete",
        deletedMessage.id
    )

    return new NextResponse("OK")
})
