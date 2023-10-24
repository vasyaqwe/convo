import { Chat, Message, User } from "@prisma/client"

export type UserType = Pick<User, "name" | "username" | "id" | "image">

export type ExtendedMessage = Message & {
    sender: UserType
    seenBy: UserType[]
    displaySender?: boolean
}

export type ExtendedChat = Chat & {
    users: UserType[]
    messages: ExtendedMessage[] | undefined
}
