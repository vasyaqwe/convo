import * as z from "zod"

export const chatSchema = z
    .object({
        name: z
            .string()
            .min(1, { message: "Required" })
            .max(24, {
                message: "Username must not contain more than 24 character(s)",
            })
            .optional(),
        userId: z.string(),
        members: z.array(z.object({ id: z.string() })).optional(),
        isGroup: z.boolean().default(false).optional(),
    })
    .refine((data) => {
        if (data.isGroup && (!data.members || data.members.length < 2)) {
            return {
                isGroup: true,
                members: "Group must have at least 2 members",
            }
        }
        return true
    })

export type ChatPayload = z.infer<typeof chatSchema>
