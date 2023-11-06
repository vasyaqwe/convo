import { emojis } from "@/config"
import * as z from "zod"

export const reactionSchema = z.object({
    body: z.enum(emojis),
})

export type ReactionPayload = z.infer<typeof reactionSchema>
