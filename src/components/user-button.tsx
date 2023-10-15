"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { User } from "@prisma/client"
import { Chat } from "@prisma/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { axiosInstance } from "@/config"
import { ChatPayload } from "@/lib/validations/chat"

type UserButtonProps = {
    user: User
}

export function UserButton({ user }: UserButtonProps) {
    const router = useRouter()

    const { mutate } = useMutation(
        async (userId: string) => {
            const payload: ChatPayload = { userId }

            const { data } = await axiosInstance.post("/chat", payload)

            return data as Chat
        },
        {
            onSuccess: (chat) => {
                router.push(`/chat/${chat.id}`)
            },
        }
    )

    return (
        <button
            onClick={() => mutate(user.id)}
            className="mt-5 flex items-center gap-3"
        >
            <UserAvatar user={user} />
            <p>{user.name}</p>
        </button>
    )
}
