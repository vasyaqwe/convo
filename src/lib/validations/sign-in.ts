import * as z from "zod"

export const signInSchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must contain at least 3 character(s)" })
        .min(1, { message: "Required" })
        .max(16, {
            message: "Username must not contain more than 16 character(s)",
        })
        .refine((value) => !/\s/.test(value), {
            message: "Username must not contain spaces",
        }),
    password: z
        .string()
        .min(8, { message: "Password must contain at least 8 character(s)" })
        .min(1, { message: "Required" }),
})

export type SignInPayload = z.infer<typeof signInSchema>
