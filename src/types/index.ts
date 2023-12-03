import { type emojis } from "@/config"
import type { Chat, Message, Reaction, User } from "@prisma/client"

export type UserType = Pick<User, "name" | "username" | "id" | "image">

export type ExtendedMessage = Message & {
    sender: UserType
    seenBy: UserType[]
    isRecent?: boolean
    reactions?: ExtendedReaction[]
    replyTo:
        | (Message & {
              sender: UserType
          })
        | null
}

export type SearchQueryMessage = Message & {
    sender: UserType
    seenBy: UserType[]
    chat: ExtendedChat
}

export type ExtendedChat = Chat & {
    users: UserType[]
    messages: ExtendedMessage[] | undefined
}

export type ExtendedReaction = Omit<Reaction, "senderId" | "messageId"> & {
    sender: UserType
    body: string
}

export type Emoji = (typeof emojis)[number]
