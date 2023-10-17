import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { chatSchema } from "@/lib/validations/chat"
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async function (req: Request) {
    const url = new URL(req.url)
    const q = url.searchParams.get("q")?.toLocaleLowerCase()

    if (!q) return new NextResponse("Invalid query", { status: 400 })

    await new Promise((resolve) => setTimeout(resolve, 750))

    const results = await db.user.findMany({
        where: {
            OR: [
                {
                    name: {
                        startsWith: q,
                    },
                },
                {
                    username: {
                        startsWith: q.startsWith("@") ? q.replace("@", "") : q,
                    },
                },
            ],
        },
        orderBy: {
            createdAt: "desc",
        },
        select: USERS_SELECT,
    })

    return new NextResponse(JSON.stringify(results))
})

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
                users: {
                    select: USERS_SELECT,
                },
            },
        })

        newChat.userIds.forEach((userId) => {
            pusherServer.trigger(userId, "chat:new", newChat)
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
            users: {
                select: USERS_SELECT,
            },
        },
    })

    newChat.userIds.forEach((userId) => {
        pusherServer.trigger(userId, "chat:new", newChat)
    })

    return new NextResponse(JSON.stringify(newChat))
})
