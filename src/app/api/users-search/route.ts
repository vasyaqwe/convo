import { USERS_SELECT } from "@/config"
import { db } from "@/lib/db"
import { withErrorHandling } from "@/lib/utils"
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async function (req: Request) {
    const url = new URL(req.url)
    const q = url.searchParams.get("q")?.toLowerCase()

    if (!q) return new NextResponse("Invalid query", { status: 400 })

    await new Promise((resolve) => setTimeout(resolve, 750))

    const results = await db.user.findMany({
        where: {
            OR: [
                {
                    name: {
                        startsWith: q,
                        mode: "insensitive",
                    },
                },
                {
                    username: {
                        startsWith: q.startsWith("@") ? q.replace("@", "") : q,
                        mode: "insensitive",
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