import { nameSchema, usernameSchema } from "@/lib/validations/sign-up"
import * as z from "zod"

export const settingsSchema = z.object({
    name: nameSchema,
    username: usernameSchema,
    image: z.string().nullish().optional(),
})

export type SettingsPayload = z.infer<typeof settingsSchema>
