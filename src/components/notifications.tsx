"use client"

import { useIsTabFocused } from "@/hooks/use-is-tab-focused"
import { pusherClient } from "@/lib/pusher"
import { useMessageHelpersStore } from "@/stores/use-message-helpers-store.tsx"
import type { ExtendedMessage } from "@/types"
import { type Chat } from "@prisma/client"
import type { Session } from "next-auth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

type NotificationsProps = {
    session: Session | null
}

export function Notifications({ session }: NotificationsProps) {
    const currentUserId = session?.user?.id
    const pathname = usePathname()
    const router = useRouter()
    const { isTabFocused } = useIsTabFocused()
    const { setHighlightedMessageId } = useMessageHelpersStore()

    function sendNewMessageNotification(newMessage: ExtendedMessage) {
        const notification = new Notification(newMessage.sender.name, {
            body: newMessage.body ?? undefined,
            image: newMessage.image ?? undefined,
        })

        notification.onclick = () => {
            router.push(`/chat/${newMessage.chatId}`)
            setTimeout(() => {
                document.getElementById(newMessage.id)?.scrollIntoView()
            }, 200)
            setHighlightedMessageId(newMessage.id)
        }
    }

    useEffect(() => {
        if (!currentUserId) {
            return
        }

        pusherClient.subscribe(currentUserId)

        function onNewMessage({
            id,
            message,
            updatedChat,
        }: {
            id: string
            message: ExtendedMessage
            updatedChat?: Pick<Chat, "mutedByIds" | "userIds">
        }) {
            if (!updatedChat) return

            const partnerId = updatedChat.userIds.find(
                (id) => id !== session?.user.id
            )

            if (
                "Notification" in window &&
                navigator.serviceWorker &&
                currentUserId !== message.senderId &&
                !updatedChat.mutedByIds.includes(partnerId!)
                // if chat is not muted
            ) {
                navigator.permissions
                    .query({ name: "notifications" })
                    .then((permission) => {
                        if (
                            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                            (pathname?.includes(id) && isTabFocused) ||
                            permission.state !== "granted"
                        ) {
                            return
                        }

                        sendNewMessageNotification(message)
                    })
            }
        }

        pusherClient.bind("chat:update", onNewMessage)

        return () => {
            pusherClient.unsubscribe(currentUserId)
            pusherClient.unbind("chat:update", onNewMessage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, isTabFocused, pathname, router])

    return null
}
