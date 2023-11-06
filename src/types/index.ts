import { type emojis } from "@/config"
import type { Chat, Message, Reaction, User } from "@prisma/client"

export type UserType = Pick<User, "name" | "username" | "id" | "image">

export type ExtendedMessage = Message & {
    sender: UserType
    seenBy: UserType[]
    displaySender?: boolean
    reactions?: ExtendedReaction[]
    replyTo:
        | (Message & {
              sender: UserType
          })
        | null
}

export type ExtendedChat = Chat & {
    users: UserType[]
    messages: ExtendedMessage[] | undefined
}

export type ExtendedReaction = Omit<Reaction, "senderId"> & {
    sender: UserType
    body: string
}

export type Emoji = (typeof emojis)[number]
