import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { chatSchema } from "@/lib/validations/chat"
import { NextResponse } from "next/server"

export const POST = withErrorHandling(async function (req: Request) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const body = await req.json()

    const { isGroup, userId, name, members } = chatSchema.parse(body)

    if (isGroup) {
        const newChat = await db.chat.create({
            data: {
                name,
                isGroup,
                users: {
                    connect: [...members!, { id: session.user.id }],
                },
            },
            include: {
                users: true,
            },
        })

        newChat.users.forEach((user) => {
            pusherServer.trigger(user.id, "chat:new", newChat)
        })

        return new NextResponse(JSON.stringify(newChat))
    }

    const existingChat = await db.chat.findFirst({
        where: {
            OR: [
                {
                    userIds: {
                        equals: [session.user.id, userId],
                    },
                },
                {
                    userIds: {
                        equals: [userId, session.user.id],
                    },
                },
            ],
        },
    })

    if (existingChat) {
        return new NextResponse(JSON.stringify(existingChat))
    }

    const newChat = await db.chat.create({
        data: {
            users: {
                connect: [{ id: session.user.id }, { id: userId }],
            },
        },
        include: {
            users: true,
        },
    })

    newChat.users.forEach((user) => {
        pusherServer.trigger(user.id, "chat:new", newChat)
    })

    return new NextResponse(JSON.stringify(newChat))
})
