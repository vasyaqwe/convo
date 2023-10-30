"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { usePathname } from "next/navigation"
import { ExtendedChat, UserType } from "@/types"
import { cn, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Session } from "next-auth"
import dynamic from "next/dynamic"

const Date = dynamic(() => import("@/components/date"), { ssr: false })

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

    const currentUserId = session?.user.id

    const lastMessage = chat.messages
        ? chat.messages[chat.messages.length - 1]
        : undefined

    const lastMessageText = lastMessage?.image
        ? "Sent an image"
        : lastMessage?.body ?? "Chat started"

    const isSeen = !lastMessage
        ? false
        : lastMessage.seenBy.some((u) => u.id === currentUserId) ||
          lastMessageText === "Chat started"

    const chatPartnersMessages = chat.messages?.filter(
        (message) => message.senderId !== currentUserId
    )
    // .filter((message) => !message.seenByIds.includes(currentUserId))
    const readChatPartnersMessages = chatPartnersMessages?.filter((m) =>
        m.seenByIds.includes(currentUserId)
    )
    const lastReadMessage = readChatPartnersMessages
        ? readChatPartnersMessages[readChatPartnersMessages.length - 1]
        : undefined

    const lastReadMessageIdx =
        chatPartnersMessages?.findIndex(
            (message) => message.id === lastReadMessage?.id
        ) ?? -1 + 1

    const unseenCount = isSeen
        ? 0
        : (lastReadMessageIdx !== -1
              ? chatPartnersMessages?.slice(lastReadMessageIdx)
              : chatPartnersMessages
          )?.length ?? 0

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
            <div className={cn("w-[80%]", isSeen ? "" : "font-semibold")}>
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
                            "w-[calc(var(--chats-width)/1.6)] truncate overflow-ellipsis text-sm",
                            isSeen ? "text-foreground/70" : ""
                        )}
                    >
                        {lastMessageText}
                    </p>
                    {unseenCount > 0 && (
                        <span
                            title={`${unseenCount} unread messages`}
                            className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[.7rem] font-semibold text-white"
                        >
                            {unseenCount > 9 ? "9+" : unseenCount}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
