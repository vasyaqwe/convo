import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { NextResponse } from "next/server"

export const DELETE = withErrorHandling(async function (
    _req: Request,
    { params: { chatId } }
) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const chat = await db.chat.findFirst({
        where: { id: chatId },
        include: {
            messages: {
                select: { id: true, replyToId: true },
            },
        },
    })

    if (!chat) {
        return new NextResponse("Invalid chat id", { status: 400 })
    }

    if (!chat.userIds.some((userId) => userId === session.user.id)) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    await db.$transaction(async (tx) => {
        for (const message of chat.messages) {
            if (message.replyToId) {
                await tx.message.update({
                    where: {
                        id: message.replyToId,
                    },
                    data: {
                        replies: {
                            disconnect: {
                                id: message.id,
                            },
                        },
                    },
                })
            }
        }

        await tx.message.deleteMany({
            where: {
                chatId,
            },
        })

        const deletedChat = await tx.chat.delete({
            where: {
                id: chatId,
            },
        })

        for (const userId of deletedChat.userIds) {
            await pusherServer.trigger(userId, "chat:delete", {
                deletedChat,
                removerId: session.user.id,
            })
        }
    })

    return new NextResponse("OK")
})
