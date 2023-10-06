import * as z from "zod"

export const postSchema = z.object({
    title: z
        .string()
        .min(3, { message: "Title must contain at least 3 character(s)" })
        .max(130, {
            message: "Title must not contain more than 130 character(s)",
        })
        .nonempty({ message: "Required" }),
    communityId: z.string(),
    content: z.any(),
})

export const postVoteSchema = z.object({
    voteType: z.enum(["UP", "DOWN"]),
})

export const postsQuerySchema = z.object({
    limit: z.string(),
    page: z.string(),
    communityName: z.string().nullish().optional(),
})

export type PostVotePayload = z.infer<typeof postVoteSchema>

export type CreatePostPayload = z.infer<typeof postSchema>
