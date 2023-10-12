import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { withErrorHandling } from "@/lib/utils"
import { messageSchema } from "@/lib/validations/message"
import { NextResponse } from "next/server"

export const POST = withErrorHandling(async function (req: Request) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const _body = await req.json()

    const { chatId, body, image } = messageSchema.parse(_body)

    const newMessage = await db.message.create({
        data: {
            chat: {
                connect: {
                    id: chatId,
                },
            },
            sender: {
                connect: {
                    id: session.user.id,
                },
            },
            seenBy: {
                connect: {
                    id: session.user.id,
                },
            },
            body,
            image,
        },
        include: {
            seenBy: true,
            sender: true,
        },
    })

    const updatedChat = await db.chat.update({
        where: {
            id: chatId,
        },
        data: {
            lastMessageAt: new Date(),
            messages: {
                connect: {
                    id: newMessage.id,
                },
            },
        },
        include: {
            users: true,
            messages: {
                include: {
                    seenBy: true,
                },
            },
        },
    })

    return new NextResponse(JSON.stringify(newMessage))
})
