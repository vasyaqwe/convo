import { Chat, Message, User } from "@prisma/client"

export type UserType = Pick<User, "name"> &
    Pick<User, "username"> &
    Pick<User, "id">

export type ExtendedMessage = Message & {
    sender: UserType
    seenBy: UserType[]
    displaySender?: boolean
}
export type ExtendedChat = Chat & {
    users: UserType[]
}
