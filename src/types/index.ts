import { Chat, Message, User } from "@prisma/client"

export type UserType = Pick<User, "name"> &
    Pick<User, "username"> &
    Pick<User, "id">

export type MessageType = Pick<Message, "body"> &
    Pick<Message, "image"> &
    Pick<Message, "createdAt"> & { seenBy: UserType[] }

export type ExtendedMessage = Message & {
    sender: UserType
    seenBy: UserType[]
    displaySender?: boolean
}
export type ExtendedChat = Chat & {
    users: UserType[]
    messages: MessageType[] | undefined
}
