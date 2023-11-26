"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import type { Chat } from "@prisma/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { axiosInstance } from "@/config"
import type { ChatPayload } from "@/lib/validations/chat"
import type { UserType } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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

    const { mutate } = useMutation({
        mutationFn: async (userId: string) => {
            const payload: ChatPayload = { userId }

            const { data } = await axiosInstance.post("/chat", payload)

            return data as Chat
        },
        onSuccess: (chat) => {
            router.push(`/chat/${chat.id}`)
            router.refresh()
            onSelect()
        },
    })

    return (
        <button
            onClick={() => {
                mutate(user.id)
            }}
            className={cn(
                "flex w-full items-center gap-3 rounded-lg p-2 transition-colors duration-100 hover:bg-secondary",
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
            className={cn("flex items-center gap-3 p-2", className)}
            {...props}
        >
            <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
            <div className="w-full">
                <div className="flex items-center gap-10">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="ml-auto h-3 w-[40px]" />
                </div>
                <Skeleton className="mt-3 h-3 w-[70%]" />
            </div>
        </div>
    )
}
