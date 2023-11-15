"use client"

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/ui/user-avatar"
import type { ExtendedChat } from "@/types"
import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { axiosInstance } from "@/config"
import { Loading } from "@/components/ui/loading"
import Link from "next/link"
import type { User } from "next-auth"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useTotalMessagesCountStore } from "@/stores/use-total-messages-count-store"
import { useMemo } from "react"

type ChatHeaderProps = {
    user: User
    chat: Omit<ExtendedChat, "messages">
}

export function ChatHeader({ user, chat }: ChatHeaderProps) {
    const chatPartner = chat.users.find((u) => u.id !== user.id)!

    const queryClient = useQueryClient()
    const router = useRouter()
    const { chats: chatsMap } = useTotalMessagesCountStore()

    const unseenCount = useMemo(() => {
        return chatsMap
            .filter((mapChat) => mapChat.id !== chat.id)
            .reduce((a, b) => a + b.unseenMessagesCount, 0)
    }, [chatsMap, chat.id])

    const { isPending, mutate: onDelete } = useMutation({
        mutationFn: async () => {
            await axiosInstance.delete(`/chat/${chat.id}`)
        },
        onSuccess: () => {
            toast.success("Chat deleted")
            router.push("/chats")
            router.refresh()
            queryClient.invalidateQueries({ queryKey: ["messages"] })
        },
        onError: () => {
            toast.error("Something went wrong")
        },
    })

    return (
        <ChatHeaderShell>
            <div className="flex items-center gap-3">
                <Button
                    asChild
                    variant={"ghost"}
                    size={"icon"}
                    className="relative md:hidden"
                >
                    <Link
                        prefetch={false}
                        href={"/chats"}
                    >
                        <Icons.chevronLeft />
                        {unseenCount > 0 && (
                            <span
                                title={`${unseenCount} unread messages`}
                                className="absolute -right-2 -top-2 ml-auto inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[.7rem] font-semibold text-white"
                            >
                                {unseenCount > 99 ? "99+" : unseenCount}
                            </span>
                        )}
                    </Link>
                </Button>
                <UserAvatar user={chatPartner} />
                <div>
                    <p>{chatPartner.name} </p>
                    <p className="text-sm text-foreground/75 md:mt-0.5">
                        @{chatPartner.username}
                    </p>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant={"ghost"}
                        size={"icon"}
                    >
                        <Icons.moreVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        disabled={isPending}
                        className="!text-destructive"
                        onSelect={(e) => {
                            e.preventDefault()
                            onDelete()
                        }}
                    >
                        {isPending ? (
                            <Loading className="mr-2" />
                        ) : (
                            <Icons.trash className="mr-2" />
                        )}{" "}
                        Delete chat
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </ChatHeaderShell>
    )
}

export function ChatHeaderSkeleton({
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <ChatHeaderShell {...props}>
            <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
            <div className="flex w-full items-center gap-10">
                <div className="">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="mt-3 h-3 w-40" />
                </div>
                <Skeleton className="ml-auto h-10 w-10 " />
            </div>
        </ChatHeaderShell>
    )
}

function ChatHeaderShell({
    children,
    className,
    ...props
}: React.ComponentProps<"header">) {
    return (
        <header
            className={cn(
                "flex h-[var(--header-height)] items-center justify-between gap-3 border-b border-secondary p-4",
                className
            )}
            {...props}
        >
            {children}
        </header>
    )
}
