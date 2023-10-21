"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { Chat } from "@prisma/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { axiosInstance } from "@/config"
import { ChatPayload } from "@/lib/validations/chat"
import { UserType } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useTransition } from "react"

type UserButtonProps = {
    user: UserType
    onSelect: () => void
} & React.HTMLAttributes<HTMLButtonElement>

export function UserButton({
    user,
    className,
    onSelect,
    ...props
}: UserButtonProps) {
    const router = useRouter()
    const [_isPending, startTransition] = useTransition()

    const { mutate } = useMutation(
        async (userId: string) => {
            const payload: ChatPayload = { userId }

            const { data } = await axiosInstance.post("/chat", payload)

            return data as Chat
        },
        {
            onSuccess: (chat) => {
                startTransition(() => {
                    router.refresh()
                    router.push(`/chat/${chat.id}`)
                })

                onSelect()
            },
        }
    )

    return (
        <button
            onClick={() => {
                mutate(user.id)
            }}
            className={cn(
                "mt-4 flex w-full items-center gap-3 rounded-lg p-2 transition-colors duration-100 hover:bg-secondary",
                className
            )}
            {...props}
        >
            <UserAvatar user={user} />
            <p>{user.name}</p>
        </button>
    )
}

export function UserButtonSkeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("flex items-center gap-3", className)}
            {...props}
        >
            <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
            <div className="w-full">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-3 h-3 w-full" />
            </div>
        </div>
    )
}
