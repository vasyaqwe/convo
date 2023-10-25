"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { usePathname } from "next/navigation"
import { ExtendedChat, UserType } from "@/types"
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
        : lastMessage.seenBy.some((u) => u.id === session?.user.id) ||
          lastMessageText === "Chat started"

    return (
        <Link
            onClick={onSelect}
            aria-current={pathname?.includes(chat.id) ? "page" : undefined}
            href={`/chat/${chat.id}`}
            className={cn(
                "flex w-full items-center gap-2 rounded-lg p-2 transition-colors duration-100 hover:bg-secondary aria-[current=page]:bg-secondary",
                className
            )}
            {...props}
        >
            <UserAvatar user={user} />
            <div className={cn("w-full", isSeen ? "" : "font-semibold")}>
                <div className="flex w-full items-center justify-between">
                    <p
                        title={user.name}
                        className="w-[calc(var(--chats-width)/2)] truncate overflow-ellipsis text-sm"
                    >
                        {user.name}
                    </p>
                    {lastMessage && (
                        <small
                            className="flex-shrink-0 text-xs text-foreground/60"
                            suppressHydrationWarning
                        >
                            {formatDate(lastMessage.createdAt, "short")}
                        </small>
                    )}
                </div>
                <p
                    title={lastMessageText}
                    className={cn(
                        "mt-1 w-[calc(var(--chats-width)/1.6)] truncate overflow-ellipsis text-sm",
                        isSeen ? "text-foreground/70" : ""
                    )}
                >
                    {lastMessageText}
                </p>
            </div>
        </Link>
    )
}
