import * as z from "zod"

export const chatSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Required" })
        .max(24, {
            message: "Username must not contain more than 24 character(s)",
        })
        .optional(),
    userId: z.string(),
    isGroup: z.boolean().default(false).optional(),
})

export type ChatPayload = z.infer<typeof chatSchema>
