import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { withErrorHandling } from "@/lib/utils"
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async function (req: Request) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const url = new URL(req.url)
    const q = url.searchParams.get("q")?.toLowerCase()

    if (!q) return new NextResponse("Invalid query", { status: 400 })

    const results = await db.user.findMany({
        where: {
            OR: [
                {
                    messages: {
                        some: {
                            body: {
                                contains: q,
                                mode: "insensitive",
                            },
                            chat: {
                                users: {
                                    some: {
                                        id: session.user.id,
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    name: {
                        startsWith: q,
                        mode: "insensitive",
                    },
                    chats: {
                        none: {
                            userIds: {
                                has: session.user.id,
                            },
                        },
                    },
                },
                {
                    username: {
                        startsWith: q.startsWith("@") ? q.replace("@", "") : q,
                        mode: "insensitive",
                    },
                    chats: {
                        none: {
                            userIds: {
                                has: session.user.id,
                            },
                        },
                    },
                },
            ],
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            ...USERS_SELECT,
            messages: {
                where: {
                    body: {
                        contains: q,
                        mode: "insensitive",
                    },
                    chat: {
                        users: {
                            some: {
                                id: session.user.id,
                            },
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
                    chat: {
                        include: {
                            users: {
                                select: USERS_SELECT,
                            },
                        },
                    },
                },
            },
        },
    })

    return new NextResponse(
        JSON.stringify({
            matchingMessages: results,
            matchingUsers: results.filter(
                (user) =>
                    user.messages.length < 1 && user.id !== session?.user.id
            ),
        })
    )
})
