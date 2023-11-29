import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
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
    const currentUserId = session.user.id
    const chat = await db.chat.findFirst({ where: { id: chatId } })

    if (!chat) {
        return new NextResponse("Invalid chat id", { status: 400 })
    }

    if (!chat.userIds.includes(currentUserId)) {
        return new NextResponse("Bad request", { status: 400 })
    }

    if (chat.mutedByIds.includes(currentUserId)) {
        await db.chat.update({
            where: { id: chatId },
            data: {
                mutedByIds: {
                    set: chat.mutedByIds.filter((id) => id !== currentUserId),
                },
            },
        })

        return new NextResponse("Chat unmuted")
    } else {
        await db.chat.update({
            where: { id: chatId },
            data: {
                mutedByIds: {
                    push: currentUserId,
                },
            },
        })

        return new NextResponse("Chat muted")
    }
})
