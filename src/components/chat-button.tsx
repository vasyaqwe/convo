"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { usePathname } from "next/navigation"
import type { ExtendedChat, SearchQueryMessage, UserType } from "@/types"
import { cn, formatDate } from "@/lib/utils"
import Link from "next/link"
import type { Session } from "next-auth"
import dynamic from "next/dynamic"
import { useMessagesHelpers } from "@/hooks/use-messages-helpers"
import { useTotalMessagesCountStore } from "@/stores/use-total-messages-count-store"
import { useEffect } from "react"

const Date = dynamic(() => import("@/components/date"), { ssr: false })

type ChatButtonProps = {
    user: UserType
    chat: ExtendedChat
    session: Session | null
    onSelect?: () => void
    lastMessage?: SearchQueryMessage
    isLastMessageSeen?: boolean
} & React.HTMLAttributes<HTMLAnchorElement>

export function ChatButton({
    user,
    className,
    chat,
    session,
    onSelect,
    lastMessage: lastMatchingQueryMessage,
    isLastMessageSeen: lastMatchingQueryMessageSeen,
    ...props
}: ChatButtonProps) {
    const pathname = usePathname()
    const { setChats } = useTotalMessagesCountStore()

    const currentUserId = session?.user.id

    const {
        unseenCount,
        isLastMessageSeen: chatLastMessageSeen,
        lastMessage: chatLastMessage,
        lastMessageText: chatLastMessageText,
    } = useMessagesHelpers({
        currentUserId,
        messages: chat.messages ?? [],
    })

    useEffect(() => {
        setChats(chat.id, unseenCount)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat, unseenCount])

    const lastMessage = lastMatchingQueryMessage ?? chatLastMessage
    const isLastMessageSeen =
        lastMatchingQueryMessageSeen ?? chatLastMessageSeen

    const lastMessageText =
        (lastMatchingQueryMessage?.image
            ? "Sent an image"
            : lastMessage?.body ?? "Chat started") ?? chatLastMessageText

    return (
        <Link
            onClick={onSelect}
            aria-current={pathname?.includes(chat.id) ? "page" : undefined}
            href={`/chat/${chat.id}`}
            className={cn(
                "flex items-center rounded-lg p-2 transition-colors duration-100 hover:bg-secondary aria-[current=page]:bg-secondary",
                className
            )}
            {...props}
        >
            <UserAvatar
                user={user}
                className="mr-2"
            />
            <div
                className={cn(
                    "w-[100%]",
                    isLastMessageSeen ? "" : "font-semibold"
                )}
            >
                <div className="flex w-full items-center justify-between">
                    <p
                        title={user.name}
                        className="w-[calc(var(--chats-width)/2)] truncate overflow-ellipsis text-[.95rem] "
                    >
                        {user.name}
                    </p>
                    {lastMessage && (
                        <Date className="flex-shrink-0 text-xs text-foreground/60">
                            {formatDate(lastMessage.createdAt, "short")}
                        </Date>
                    )}
                </div>
                <div className="mt-1 flex items-center">
                    <p
                        title={lastMessageText}
                        className={cn(
                            "w-[calc(var(--chats-width)/1.7)] truncate overflow-ellipsis text-sm",
                            isLastMessageSeen ? "text-foreground/70" : ""
                        )}
                    >
                        {lastMessageText}
                    </p>
                    {unseenCount > 0 && (
                        <span
                            title={`${unseenCount} unread messages`}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[.7rem] font-semibold text-white"
                        >
                            {unseenCount > 99 ? "99+" : unseenCount}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
