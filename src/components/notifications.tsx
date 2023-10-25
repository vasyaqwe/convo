"use client"

import { useIsTabFocused } from "@/hooks/use-is-tab-focused"
import { pusherClient } from "@/lib/pusher"
import { ExtendedMessage } from "@/types"
import { Session } from "next-auth"
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
            if ("Notification" in window) {
                Notification.requestPermission().then(function (permission) {
                    if (
                        (pathname?.includes(chatId) && isTabFocused) ||
                        permission !== "granted"
                    )
                        return

                    const notification = new Notification(
                        newMessage.sender.name,
                        {
                            body: newMessage.body ?? undefined,
                            image: newMessage.image ?? undefined,
                        }
                    )

                    notification.onclick = () => {
                        router.push(`/chat/${newMessage.chatId}`)
                        setTimeout(() => {
                            document
                                .getElementById(newMessage.id)
                                ?.scrollIntoView()
                        }, 200)
                    }
                })
            }
        }

        pusherClient.bind("chat:new-message", onNewMessage)

        return () => {
            pusherClient.unsubscribe(currentUserId)
            pusherClient.unbind("chat:new-message", onNewMessage)
        }
    }, [currentUserId, isTabFocused, pathname, router])

    return null
}
