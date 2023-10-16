"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { Chat } from "@prisma/client"
import { useMutation } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { axiosInstance } from "@/config"
import { ChatPayload } from "@/lib/validations/chat"
import { ExtendedChat, UserType } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"

type UserButtonProps = {
    user: UserType
    chat?: ExtendedChat
} & React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>

export function UserButton({
    user,
    className,
    chat,
    ...props
}: UserButtonProps) {
    const router = useRouter()
    const pathname = usePathname()

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

    return chat ? (
        <Link
            aria-current={pathname.includes(chat.id) ? "page" : undefined}
            href={`/chat/${chat.id}`}
            className={cn(
                "mt-5 flex items-center gap-3 rounded-lg px-3 py-2 aria-[current=page]:bg-secondary",
                className
            )}
            {...props}
        >
            <UserAvatar user={user} />
            <p>{user.name}</p>
        </Link>
    ) : (
        <button
            onClick={() => mutate(user.id)}
            className={cn(
                "mt-5 flex items-center gap-3 rounded-lg px-3 py-2 aria-[current=page]:bg-secondary",
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
                <Skeleton className="h-2 w-full" />
                <Skeleton className="mt-3 h-2 w-full" />
            </div>
        </div>
    )
}
