import { MESSAGE_INCLUDE } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { reactionSchema } from "@/lib/validations/reaction"
import { NextResponse } from "next/server"

export const POST = withErrorHandling(async function (
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

    if (!existingReaction)
        return new NextResponse("Bad request", { status: 400 })

    const deletedReaction = await db.reaction.delete({
        where: {
            senderId: existingReaction.sender.id,
            id: existingReaction.id,
            body: existingReaction.body,
        },
    })

    await pusherServer.trigger(message.chatId, "message:update", {
        ...message,
        reactions: message.reactions.filter((r) => r.id !== deletedReaction.id),
    })

    return new NextResponse("OK")
})
