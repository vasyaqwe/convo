"use client"

import { useIsTabFocused } from "@/hooks/use-is-tab-focused"
import { pusherClient } from "@/lib/pusher"
import { useMessageHelpersStore } from "@/stores/use-message-helpers-store.tsx"
import type { ExtendedMessage } from "@/types"
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
        console.log(notification)

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
            chatId,
            newMessage,
        }: {
            chatId: string
            newMessage: ExtendedMessage
        }) {
            if ("Notification" in window && navigator.serviceWorker) {
                navigator.permissions
                    .query({ name: "notifications" })
                    .then((permission) => {
                        if (
                            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                            (pathname?.includes(chatId) && isTabFocused) ||
                            permission.state !== "granted"
                        )
                            return

                        sendNewMessageNotification(newMessage)
                    })
            }
        }

        pusherClient.bind("chat:new-message", onNewMessage)

        return () => {
            pusherClient.unsubscribe(currentUserId)
            pusherClient.unbind("chat:new-message", onNewMessage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, isTabFocused, pathname, router])

    return null
}
