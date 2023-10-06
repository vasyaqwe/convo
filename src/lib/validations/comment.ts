import * as z from "zod"

export const commentSchema = z.object({
    postId: z.string(),
    body: z.string().nonempty({ message: "Required" }),
    replyToId: z.string().optional(),
})

export const commentVoteSchema = z.object({
    voteType: z.enum(["UP", "DOWN"]),
})

export const commentsQuerySchema = z.object({
    limit: z.string().nullish().optional(),
    page: z.string().nullish().optional(),
    postId: z.string(),
})

export type CommentVotePayload = z.infer<typeof commentVoteSchema>

export type CreateCommentPayload = z.infer<typeof commentSchema>
