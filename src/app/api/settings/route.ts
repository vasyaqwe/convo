import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { withErrorHandling } from "@/lib/utils"
import { settingsSchema } from "@/lib/validations/settings"
import { NextResponse } from "next/server"

export const PATCH = withErrorHandling(async function (req: Request) {
    const session = await getAuthSession()

    if (!session) {
        return new NextResponse("Unauthorized", {
            status: 401,
        })
    }

    const body = await req.json()

    const { username, name, image } = settingsSchema.parse(body)

    const duplicate = await db.user.findFirst({
        where: {
            username,
        },
    })

    if (duplicate && duplicate.id !== session.user.id) {
        return new NextResponse(
            JSON.stringify({
                title: "Username you entered is already taken",
                description: "Please choose a different username",
            }),
            {
                status: 409,
            }
        )
    }

    await db.user.update({
        where: {
            id: session.user.id,
        },
        data: {
            username,
            name,
            image,
        },
    })

    return new NextResponse("OK")
})
