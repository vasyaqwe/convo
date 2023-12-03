import { MESSAGE_INCLUDE } from "@/config"
import { db } from "@/lib/db"
import { addIsRecent, reverseArray, withErrorHandling } from "@/lib/utils"
import { messagesQuerySchema } from "@/lib/validations/message"
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async function (req: Request) {
    const url = new URL(req.url)

    const { limit, page, chatId } = messagesQuerySchema.parse({
        limit: url.searchParams.get("limit"),
        page: url.searchParams.get("page"),
        chatId: url.searchParams.get("chatId"),
    })

    const messages = await db.message.findMany({
        where: {
            chatId,
        },
        take: +limit,
        skip: (+page - 1) * +limit,
        orderBy: {
            createdAt: "desc",
        },
        include: MESSAGE_INCLUDE,
    })

    return new NextResponse(JSON.stringify(addIsRecent(reverseArray(messages))))
})
