import type { Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"

declare module "next-auth/jwt" {
    interface JWT extends User {
        id: string
        username?: string | null
        name: string
    }
}

declare module "next-auth" {
    interface Session {
        user: User & {
            id: UserId
            username?: string | null
            name: string
        }
    }
}
