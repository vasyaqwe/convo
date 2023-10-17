"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { usePathname } from "next/navigation"
import { ExtendedChat, UserType } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Session } from "next-auth"

type ChatButtonProps = {
    user: UserType
    chat: ExtendedChat
    session: Session | null
    onSelect?: () => void
} & React.HTMLAttributes<HTMLAnchorElement>

export function ChatButton({
    user,
    className,
    chat,
    session,
    onSelect,
    ...props
}: ChatButtonProps) {
    const pathname = usePathname()

    const lastMessage = chat?.messages
        ? chat.messages[chat?.messages.length - 1]
        : undefined

    const lastMessageText = lastMessage?.image
        ? "Sent an image"
        : lastMessage?.body ?? "Chat started"

    const isSeen = !lastMessage
        ? false
        : lastMessage.seenBy.some((u) => u.id === session?.user.id)

    return (
        <Link
            onClick={onSelect}
            aria-current={pathname.includes(chat.id) ? "page" : undefined}
            href={`/chat/${chat.id}`}
            className={cn(
                "mt-5 flex w-full items-center gap-2 rounded-lg p-2 transition-colors duration-100 hover:bg-secondary aria-[current=page]:bg-secondary",
                className
            )}
            {...props}
        >
            <UserAvatar user={user} />
            <div
                className={cn(
                    "w-full",
                    isSeen || lastMessageText === "Chat started"
                        ? ""
                        : "font-semibold"
                )}
            >
                <div className="flex w-full items-center justify-between">
                    <p className="w-[calc(var(--chats-width)/2)] truncate overflow-ellipsis">
                        {user.name}
                    </p>
                    {lastMessage && (
                        <small className="text-xs text-foreground/60">
                            {formatDate(chat.lastMessageAt)}
                        </small>
                    )}
                </div>
                <p
                    className={cn(
                        "mt-1 text-sm",
                        isSeen ? "" : "text-foreground/70"
                    )}
                >
                    {lastMessageText}
                </p>
            </div>
        </Link>
    )
}

export function ChatButtonSkeleton({
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
