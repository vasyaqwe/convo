import * as z from "zod"

export const settingsSchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must contain at least 3 character(s)" })
        .max(18, {
            message: "Username must not contain more than 18 character(s)",
        })
        .nonempty({ message: "Required" })
        .refine((value) => !/\s/.test(value), {
            message: "Username must not contain spaces",
        }),
})

export type UpdateSettingsPayload = z.infer<typeof settingsSchema>
