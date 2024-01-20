import { MESSAGE_INCLUDE, REACTION_SELECT } from "@/config"
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

    if (existingReaction) return new NextResponse("Already reacted")

    await db.reaction.create({
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
        select: REACTION_SELECT,
    })

    await pusherServer.trigger(message.chatId, "message:update", {})

    return new NextResponse("OK")
})
