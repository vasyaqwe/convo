import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { withErrorHandling } from "@/lib/utils"
import { NextResponse } from "next/server"

export const PATCH = withErrorHandling(async function (
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

    for (const userId of chat.userIds) {
        await pusherServer.trigger(userId, "chat:start-typing", {
            typingUser: session?.user,
        })
    }

    return new NextResponse("OK")
})
