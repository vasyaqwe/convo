import { useIsTabFocused } from "@/hooks/use-is-tab-focused"
import { ExtendedMessage } from "@/types"
import { usePathname } from "next/navigation"

type useMessagesArgsHelpers = {
    messages: ExtendedMessage[]
    currentUserId: string
}

export function useMessagesHelpers({
    messages,
    currentUserId,
}: useMessagesArgsHelpers) {
    const pathname = usePathname()
    const { isTabFocused } = useIsTabFocused()

    const lastMessage = messages ? messages[messages.length - 1] : undefined

    const lastMessageText = lastMessage?.image
        ? "Sent an image"
        : lastMessage?.body ?? "Chat started"

    const isLastMessageSeen = !lastMessage
        ? false
        : isTabFocused && pathname?.includes(lastMessage?.chatId ?? "")
        ? true
        : lastMessage.seenBy.some((u) => u.id === currentUserId) ||
          lastMessageText === "Chat started"

    const chatPartnersMessages = messages?.filter(
        (message) => message.senderId !== currentUserId
    )

    const seenChatPartnersMessages = chatPartnersMessages?.filter((m) =>
        m.seenByIds.includes(currentUserId)
    )

    const lastSeenMessage = seenChatPartnersMessages
        ? seenChatPartnersMessages[seenChatPartnersMessages.length - 1]
        : undefined

    const lastSeenMessageIdx =
        chatPartnersMessages?.findIndex(
            (message) => message.id === lastSeenMessage?.id
        ) ?? -1

    const unseenCount = isLastMessageSeen
        ? 0
        : (lastSeenMessageIdx !== -1
              ? chatPartnersMessages?.slice(lastSeenMessageIdx + 1)
              : chatPartnersMessages
          )?.length ?? 0

    return { unseenCount, isLastMessageSeen, lastMessage, lastMessageText }
}
