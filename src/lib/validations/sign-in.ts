import { usernameSchema } from "@/lib/validations/sign-up"
import * as z from "zod"

export const signInSchema = z.object({
    username: usernameSchema,
    password: z
        .string()
        .min(8, { message: "Password must contain at least 8 character(s)" })
        .min(1, { message: "Required" }),
})

export type SignInPayload = z.infer<typeof signInSchema>
