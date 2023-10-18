import * as z from "zod"

export const messageSchema = z.object({
    body: z.string().optional(),
    chatId: z.string(),
    image: z.string().optional(),
})

export const messagesQuerySchema = z.object({
    limit: z.string(),
    page: z.string(),
    chatId: z.string(),
})

export type MessagePayload = z.infer<typeof messageSchema>
