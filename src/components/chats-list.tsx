"use client"

import { ChatButton } from "@/components/chat-button"
import { Input } from "@/components/ui/input"
import { UserButton, UserButtonSkeleton } from "@/components/user-button"
import { axiosInstance } from "@/config"
import { useDebounce } from "@/hooks/use-debounce"
import { pusherClient } from "@/lib/pusher"
import { ExtendedChat } from "@/types"
import { User } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import { Session } from "next-auth"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type ChatsListProps = {
    existingChats: ExtendedChat[]
    session: Session | null
}

export function ChatsList({ existingChats, session }: ChatsListProps) {
    const [chats, setChats] = useState(existingChats)

    const [input, setInput] = useState("")
    const debouncedInput = useDebounce<string>(input, 400)

    const router = useRouter()
    const pathname = usePathname()

    const {
        data: results,
        refetch,
        isFetching,
    } = useQuery(
        ["chats-search"],
        async () => {
            if (!input) return []

            const { data } = await axiosInstance.get(`/chat?q=${input}`)

            return (data as User[]).filter(
                (user) => user.id !== session?.user.id
            )
        },
        {
            enabled: false,
        }
    )

    useEffect(() => {
        refetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedInput])

    useEffect(() => {
        pusherClient.subscribe(session?.user.id)

        const onUpdateChat = (
            updatedChat: ExtendedChat & { sendNotification: boolean }
        ) => {
            console.log(updatedChat)
            setChats((prev) =>
                prev.map((oldChat) => {
                    if (oldChat.id === updatedChat.id) {
                        return {
                            ...oldChat,
                            messages: updatedChat.messages,
                        }
                    }

                    return oldChat
                })
            )
            const newMessage = updatedChat.messages
                ? updatedChat.messages[0]
                : undefined

            if (
                "Notification" in window &&
                newMessage &&
                updatedChat.sendNotification
            ) {
                Notification.requestPermission().then(function (permission) {
                    if (
                        permission === "granted" &&
                        newMessage.senderId !== session?.user.id &&
                        !pathname?.includes(newMessage.chatId)
                    ) {
                        const notification = new Notification(
                            newMessage.sender.name ?? "",
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
                    }
                })
            }
        }

        const onNewChat = (newChat: ExtendedChat) => {
            setChats((prev) => {
                if (prev.some((oldChat) => oldChat.id === newChat.id))
                    return prev

                return [newChat, ...prev]
            })
        }

        const onDeleteChat = ({
            deletedChat,
            removerId,
        }: {
            deletedChat: ExtendedChat
            removerId: User
        }) => {
            setChats((prev) => {
                return [
                    ...prev.filter((oldChat) => oldChat.id !== deletedChat.id),
                ]
            })

            if (
                removerId !== session?.user.id &&
                pathname?.includes(deletedChat.id)
            ) {
                toast.message("Chat your were in was deleted")
                router.push("/")
            }
        }

        pusherClient.bind("chat:update", onUpdateChat)
        pusherClient.bind("chat:new", onNewChat)
        pusherClient.bind("chat:delete", onDeleteChat)

        return () => {
            pusherClient.unsubscribe(session?.user.id)
            pusherClient.unbind("chat:update", onUpdateChat)
            pusherClient.unbind("chat:new", onNewChat)
            pusherClient.unbind("chat:delete", onDeleteChat)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    return (
        <div className="mt-6">
            <Input
                placeholder="Enter a name or @username..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            {input.length > 0 ? (
                isFetching ? (
                    Array(5)
                        .fill("")
                        .map((_item, idx) => (
                            <UserButtonSkeleton
                                className="mt-5"
                                key={idx}
                            />
                        ))
                ) : (results?.length ?? 0) < 1 ? (
                    <p className="mt-5 text-sm text-foreground/80">
                        No results found.
                    </p>
                ) : (
                    results?.map((user) => {
                        const chat = existingChats.find(
                            (chat) =>
                                chat.userIds.includes(session?.user.id) &&
                                chat.userIds.includes(user.id)
                        )

                        if (chat) {
                            return (
                                <ChatButton
                                    onSelect={() => setInput("")}
                                    session={session}
                                    chat={chat}
                                    key={user.id}
                                    user={user}
                                />
                            )
                        }

                        return (
                            <UserButton
                                onSelect={() => setInput("")}
                                key={user.id}
                                user={user}
                            />
                        )
                    })
                )
            ) : chats.length < 1 ? (
                <p className="mt-6 text-sm text-foreground/80">
                    Nothing here yet.
                </p>
            ) : (
                chats.map((chat) => {
                    const user = chat.users.find(
                        (u) => u.id !== session?.user.id
                    )

                    if (user) {
                        return (
                            <ChatButton
                                session={session}
                                chat={chat}
                                key={chat.id}
                                user={user}
                            />
                        )
                    }

                    return null
                })
            )}
        </div>
    )
}
