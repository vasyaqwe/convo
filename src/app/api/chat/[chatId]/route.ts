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
