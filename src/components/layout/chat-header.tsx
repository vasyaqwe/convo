"use client"

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/ui/user-avatar"
import type { ExtendedChat, UserType } from "@/types"
import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Session } from "next-auth"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useTotalMessagesCountStore } from "@/stores/use-total-messages-count-store"
import { useEffect, useMemo, useState } from "react"
import { ChatMenuContent } from "@/components/chat-menu-content"
import { pusherClient } from "@/lib/pusher"
import { Loading } from "@/components/ui/loading"

type ChatHeaderProps = {
    session: Session | null
    chat: ExtendedChat
}

export function ChatHeader({ session, chat }: ChatHeaderProps) {
    const [typingUsers, setTypingUsers] = useState<UserType[]>([])
    const chatPartner = chat.users.find((u) => u.id !== session?.user.id)!

    const { chats: chatsMap } = useTotalMessagesCountStore()

    const unseenCount = useMemo(() => {
        return chatsMap
            .filter((mapChat) => mapChat.id !== chat.id)
            .reduce((a, b) => a + b.unseenMessagesCount, 0)
    }, [chatsMap, chat.id])

    useEffect(() => {
        pusherClient.subscribe(chat.id)

        function onStartTyping({ typingUser }: { typingUser: UserType }) {
            setTypingUsers((prev) => {
                if (prev.some((u) => u.id === typingUser.id)) {
                    return prev
                }

                return [...prev, typingUser]
            })
        }

        function onEndTyping({ typingUser }: { typingUser: UserType }) {
            setTypingUsers((prev) => prev.filter((u) => u.id !== typingUser.id))
        }

        pusherClient.bind("chat:start-typing", onStartTyping)
        pusherClient.bind("chat:end-typing", onEndTyping)

        return () => {
            pusherClient.unsubscribe(chat.id)
            pusherClient.unbind("chat:start-typing", onStartTyping)
            pusherClient.unbind("chat:end-typing", onEndTyping)
        }
    }, [chat.id])

    const filteredTypingUsers = typingUsers.filter(
        (u) => u.id !== session?.user.id
    )

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

                    {filteredTypingUsers.length > 0 ? (
                        <p className={cn(`text-sm text-foreground/70 `)}>
                            {filteredTypingUsers.some(
                                (u) => u.id === chatPartner.id
                            )
                                ? "typing"
                                : ""}
                            <Loading className="ml-2 align-middle" />
                        </p>
                    ) : (
                        <p className="text-sm text-foreground/75">
                            @{chatPartner.username}
                            <Loading className="invisible ml-2 align-middle" />
                        </p>
                    )}
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
                    <ChatMenuContent
                        session={session}
                        chat={chat}
                    />
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
