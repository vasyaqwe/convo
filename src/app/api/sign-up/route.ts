import { db } from "@/lib/db"
import { withErrorHandling } from "@/lib/utils"
import { signUpSchema } from "@/lib/validations/sign-up"
import { NextResponse } from "next/server"
import bcrypt from "bcrypt"

export const PATCH = withErrorHandling(async function (req: Request) {
    const body = await req.json()

    const { username, password, name } = signUpSchema.parse(body)

    const duplicate = await db.user.findFirst({
        where: {
            username,
        },
    })

    if (duplicate) {
        return new NextResponse("Username is already taken", {
            status: 409,
        })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
        data: {
            username,
            name,
            password: hashedPassword,
        },
    })

    return new NextResponse(JSON.stringify(user))
})
