import * as z from "zod"

export const messageSchema = z.object({
    body: z.string().min(1, { message: "Required" }).optional(),
    chatId: z.string(),
    image: z.string().optional(),
})

export type MessagePayload = z.infer<typeof messageSchema>
