"use client"

import { ChatButton } from "@/components/chat-button"
import { Icons } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { UserButton, UserButtonSkeleton } from "@/components/user-button"
import { axiosInstance } from "@/config"
import { useDebounce } from "@/hooks/use-debounce"
import { useDynamicMetadata } from "@/hooks/use-dynamic-metadata"
import { pusherClient } from "@/lib/pusher"
import { useTotalMessagesCountStore } from "@/stores/use-total-messages-count-store"
import type { ExtendedChat, ExtendedMessage, SearchQueryMessage } from "@/types"
import type { User } from "@prisma/client"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { Session } from "next-auth"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"

type ChatsListProps = {
    session: Session | null
    initialChats: ExtendedChat[]
}

type UserType = User & { messages: SearchQueryMessage[] }

const SKELETONS_COUNT = 10

export function ChatsList({ session, initialChats }: ChatsListProps) {
    const [chats, setChats] = useState(initialChats)

    const [input, setInput] = useState("")
    const { debouncedValue: debouncedInput, debounceElapsed } =
        useDebounce<string>({
            value: input,
            delay: 400,
            delayFirstLetter: false,
        })

    const router = useRouter()
    const pathname = usePathname()
    const { chats: chatsMap, removeChat: removeChatFromTotalMessagesCount } =
        useTotalMessagesCountStore()

    const currentUserId = session?.user?.id

    const {
        data: results,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ["search"],
        queryFn: async () => {
            if (!input)
                return {
                    matchingMessages: [],
                    matchingUsers: [],
                }

            const { data } = await axiosInstance.get(`/search?q=${input}`)

            return data as {
                matchingMessages: UserType[]
                matchingUsers: UserType[]
            }
        },
        enabled: false,
        placeholderData: keepPreviousData,
    })

    useEffect(() => {
        refetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedInput])

    const unseenCount = useMemo(() => {
        return chatsMap.reduce((a, b) => a + b.unseenMessagesCount, 0)
    }, [chatsMap])

    const openChat = chats.find((chat) => pathname?.includes(chat.id))

    const chatPartnerName =
        openChat?.users.find((user) => user.id !== session?.user.id)?.name ??
        "convo."

    useDynamicMetadata({
        unseenCount,
        chatPartnerName,
    })

    useEffect(() => {
        if (!currentUserId) {
            return
        }

        pusherClient.subscribe(currentUserId)

        function onUpdateChat({
            id,
            message,
            messageDeleted,
        }: {
            id: string
            message: ExtendedMessage
            messageDeleted: boolean | undefined
        }) {
            setChats((prev) =>
                prev.map((oldChat) => {
                    if (oldChat.messages?.some((m) => m.id === message.id)) {
                        return {
                            ...oldChat,
                            messages: messageDeleted
                                ? oldChat.messages.filter(
                                      (m) => m.id !== message.id
                                  )
                                : oldChat.messages.map((m) =>
                                      m.id === message.id ? message : m
                                  ),
                        }
                    }
                    if (oldChat.id === id) {
                        return {
                            ...oldChat,
                            messages: [...(oldChat?.messages ?? []), message],
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
            removeChatFromTotalMessagesCount(deletedChat.id)

            if (
                removerId !== currentUserId &&
                pathname?.includes(deletedChat.id)
            ) {
                toast.message("Chat your were in was deleted")
                router.push("/chats")
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, pathname, router])

    const matchingQueryMessages =
        results?.matchingMessages
            ?.flatMap((r) => r.messages)
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            ) ?? []

    const filteredChats =
        input.length > 0
            ? chats.filter((chat) =>
                  chat.users.some((u) => u.name.toLowerCase().includes(input))
              )
            : chats

    const totalItems = [
        ...(results?.matchingMessages ?? []),
        ...(results?.matchingUsers ?? []),
        ...filteredChats,
    ]

    return (
        <div className="h-full overflow-hidden px-1.5">
            <div className="flex h-[70px] items-center">
                <div className="relative w-full px-3">
                    <Icons.search
                        className="absolute left-5 top-[49%] -translate-y-1/2 text-muted-foreground"
                        width={19}
                        height={19}
                    />
                    <Input
                        placeholder="Enter a message, name or @username"
                        value={input}
                        className="pl-8"
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
            </div>
            <div className="h-[calc(100%-70px-var(--message-form-height))] overflow-y-auto px-3 max-md:pb-5 md:h-[calc(100%-70px)]">
                {totalItems.length < 1 && !isFetching && input.length < 1 && (
                    <p className="text-sm text-foreground/80">
                        Nothing here yet.
                    </p>
                )}

                {filteredChats.map((chat) => {
                    const user = chat.users.find((u) => u.id !== currentUserId)

                    if (user) {
                        return (
                            <ChatButton
                                className="mt-3 first:mt-0"
                                session={session}
                                chat={chat}
                                key={chat.id}
                                user={user}
                            />
                        )
                    }

                    return null
                })}

                {totalItems?.length < 1 &&
                    !isFetching &&
                    input.length > 0 &&
                    debounceElapsed && (
                        <p className="text-sm text-foreground/80">
                            No results found.
                        </p>
                    )}

                {input.length > 0 ? (
                    matchingQueryMessages.length > 0 ? (
                        <>
                            {/* filter out the last item if it is showing in filteredChats*/}
                            {matchingQueryMessages
                                .filter(
                                    (message) =>
                                        !filteredChats.some(
                                            (chat) =>
                                                chat.messages?.[
                                                    chat.messages?.length - 1
                                                ]?.id === message.id
                                        )
                                )
                                .map((message) => {
                                    return (
                                        <ChatButton
                                            aria-current={undefined}
                                            className="mt-3 first:mt-0"
                                            onClick={() =>
                                                input.length > 0 && setInput("")
                                            }
                                            session={session}
                                            chat={message.chat}
                                            isLastMessageSeen={true}
                                            key={message.id}
                                            user={{
                                                ...message.chat.users.find(
                                                    (u) =>
                                                        u.id !== currentUserId
                                                )!,
                                            }}
                                            lastMessage={message}
                                        />
                                    )
                                })}
                            {results?.matchingUsers?.map((user) => {
                                return (
                                    <UserButton
                                        className="mt-3 first:mt-0"
                                        onSelect={() =>
                                            input.length > 0 && setInput("")
                                        }
                                        key={user.id}
                                        user={user}
                                    />
                                )
                            })}
                        </>
                    ) : (
                        results?.matchingUsers?.map((user) => {
                            return (
                                <UserButton
                                    className="mt-3 first:mt-0"
                                    onSelect={() =>
                                        input.length > 0 && setInput("")
                                    }
                                    key={user.id}
                                    user={user}
                                />
                            )
                        })
                    )
                ) : null}

                {isFetching &&
                    SKELETONS_COUNT - totalItems.length > 0 &&
                    Array(SKELETONS_COUNT - totalItems.length)
                        .fill("")
                        .map((_item, idx) => (
                            <UserButtonSkeleton
                                className="mt-3 first:mt-0"
                                key={idx}
                            />
                        ))}
            </div>
        </div>
    )
}
