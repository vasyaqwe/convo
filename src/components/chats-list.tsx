"use client"

import { ChatButton } from "@/components/chat-button"
import { Input } from "@/components/ui/input"
import { UserButton, UserButtonSkeleton } from "@/components/user-button"
import { axiosInstance } from "@/config"
import { useDebounce } from "@/hooks/use-debounce"
import { pusherClient } from "@/lib/pusher"
import { ExtendedChat } from "@/types"
import { User } from "@prisma/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Session } from "next-auth"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type ChatsListProps = {
    session: Session | null
}

export function ChatsList({ session }: ChatsListProps) {
    const { data, isLoading } = useQuery({
        queryKey: ["chats"],
        queryFn: async () => {
            const { data } = await axiosInstance.get(`/chat`)

            return data as ExtendedChat[]
        },
    })

    const [chats, setChats] = useState(data ?? [])

    const [input, setInput] = useState("")
    const debouncedInput = useDebounce<string>(input, 400)

    const router = useRouter()
    const pathname = usePathname()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (data) setChats(data)
    }, [data])

    const currentUserId = session?.user?.id

    const {
        data: results,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ["users-search"],
        queryFn: async () => {
            if (!input) return []

            const { data } = await axiosInstance.get(`/users-search?q=${input}`)

            return (data as User[]).filter((user) => user.id !== currentUserId)
        },
        enabled: false,
    })

    useEffect(() => {
        refetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedInput])

    useEffect(() => {
        if (!currentUserId) {
            return
        }

        pusherClient.subscribe(currentUserId)

        function onUpdateChat(updatedChat: ExtendedChat) {
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
        }

        function onNewChat(newChat: ExtendedChat) {
            setChats((prev) => {
                if (prev.some((oldChat) => oldChat.id === newChat.id))
                    return prev

                return [newChat, ...prev]
            })
        }

        function onDeleteChat({
            deletedChat,
            removerId,
        }: {
            deletedChat: ExtendedChat
            removerId: User
        }) {
            setChats((prev) => {
                return [
                    ...prev.filter((oldChat) => oldChat.id !== deletedChat.id),
                ]
            })

            if (
                removerId !== currentUserId &&
                pathname?.includes(deletedChat.id)
            ) {
                toast.message("Chat your were in was deleted")
                router.push("/")
                queryClient.invalidateQueries({ queryKey: ["messages"] })
            }
        }

        pusherClient.bind("chat:update", onUpdateChat)
        pusherClient.bind("chat:new", onNewChat)
        pusherClient.bind("chat:delete", onDeleteChat)

        return () => {
            pusherClient.unsubscribe(currentUserId)
            pusherClient.unbind("chat:update", onUpdateChat)
            pusherClient.unbind("chat:new", onNewChat)
            pusherClient.unbind("chat:delete", onDeleteChat)
        }
    }, [currentUserId, queryClient, pathname, router])

    return (
        <div className="mt-5 px-4">
            <div className="relative">
                <Input
                    placeholder="Enter a name or @username..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
            </div>
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
                        const chat = chats?.find(
                            (chat) =>
                                chat.userIds.includes(currentUserId) &&
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
            ) : isLoading ? (
                Array(5)
                    .fill("")
                    .map((_item, idx) => (
                        <UserButtonSkeleton
                            className="mt-5"
                            key={idx}
                        />
                    ))
            ) : chats.length < 1 ? (
                <p className="mt-6 text-sm text-foreground/80">
                    Nothing here yet.
                </p>
            ) : (
                chats.map((chat) => {
                    const user = chat.users.find((u) => u.id !== currentUserId)

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
