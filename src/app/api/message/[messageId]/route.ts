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
    })

    if (!message) {
        return new NextResponse("Invalid message id", { status: 400 })
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
