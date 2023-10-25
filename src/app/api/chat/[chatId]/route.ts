import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async function (
    _req: Request,
    { params: { chatId } }
) {
    const chat = await db.chat.findFirst({
        where: { id: chatId },
        include: {
            users: {
                select: USERS_SELECT,
            },
            messages: {
                include: {
                    sender: {
                        select: USERS_SELECT,
                    },
                    seenBy: {
                        select: USERS_SELECT,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    })

    return new NextResponse(JSON.stringify(chat))
})

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

    const chat = await db.chat.findFirst({ where: { id: chatId } })

    if (!chat) {
        return new NextResponse("Invalid chat id", { status: 400 })
    }

    if (!chat.userIds.some((userId) => userId === session.user.id)) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    const deletedChat = await db.chat.delete({
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
    return new NextResponse("OK")
})
