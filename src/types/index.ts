import { Message, User } from "@prisma/client"

export type ExtendedMessage = Message & {
    sender: User
    seenBy: User[]
    displaySender?: boolean
}
