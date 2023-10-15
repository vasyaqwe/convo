import { Chat, Message, User } from "@prisma/client"

export type ExtendedMessage = Message & {
    sender: User
    seenBy: User[]
    displaySender?: boolean
}
export type ExtendedChat = Chat & {
    users: User[]
}
