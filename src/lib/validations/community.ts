import * as z from "zod"

export const communitySchema = z.object({
    name: z
        .string()
        .min(3, { message: "Name must contain at least 3 character(s)" })
        .max(18, {
            message: "Name must not contain more than 18 character(s)",
        })
        .nonempty({ message: "Required" })
        .refine((value) => !/\s/.test(value), {
            message: "Name must not contain spaces",
        }),
})

export const communitySubscriptionSchema = z.object({
    communityId: z.string(),
})

export type CreateCommunityPayload = z.infer<typeof communitySchema>

export type SubscribeToCommunityPayload = z.infer<
    typeof communitySubscriptionSchema
>
