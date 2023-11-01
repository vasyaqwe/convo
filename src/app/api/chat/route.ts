import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { chatSchema } from "@/lib/validations/chat"
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async function (req: Request) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const chats = await db.chat.findMany({
        where: {
            userIds: {
                has: session.user.id,
            },
        },
        include: {
            users: {
                select: USERS_SELECT,
            },
            messages: {
                include: {
                    seenBy: {
                        select: USERS_SELECT,
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return new NextResponse(JSON.stringify(chats))
})

export const POST = withErrorHandling(async function (req: Request) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const body = await req.json()

    const { userId } = chatSchema.parse(body)

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

    const newChat = await db.$transaction(async (tx) => {
        const newChat = await tx.chat.create({
            data: {
                users: {
                    connect: [{ id: session.user.id }, { id: userId }],
                },
            },
            include: {
                users: {
                    select: USERS_SELECT,
                },
            },
        })

        for (const userId of newChat.userIds) {
            await pusherServer.trigger(userId, "chat:new", newChat)
        }
    })

    return new NextResponse(JSON.stringify(newChat))
})
