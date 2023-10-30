"use client"

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/ui/user-avatar"
import { ExtendedChat, UserType } from "@/types"
import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { axiosInstance } from "@/config"
import { Loading } from "@/components/ui/loading"
import Link from "next/link"
import { User } from "next-auth"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type ChatHeaderProps = {
    user: User
    chat: Omit<ExtendedChat, "messages">
}

export function ChatHeader({ user, chat }: ChatHeaderProps) {
    const chatPartner = chat.users.find((u) => u.id !== user.id) as UserType

    const queryClient = useQueryClient()
    const router = useRouter()

    const { isPending, mutate: onDelete } = useMutation({
        mutationFn: async () => {
            await axiosInstance.delete(`/chat/${chat.id}`)
        },
        onSuccess: () => {
            toast.success("Chat deleted")
            router.push("/")
            queryClient.invalidateQueries({ queryKey: ["chats"] })
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
                    className="md:hidden"
                >
                    <Link href={"/"}>
                        <Icons.chevronLeft />
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
