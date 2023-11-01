"use client"

import { Message, MessageDatePill, MessageSkeleton } from "@/components/message"
import { Loading } from "@/components/ui/loading"
import { MESSAGES_INFINITE_SCROLL_COUNT, axiosInstance } from "@/config"
import { useDynamicMetadata } from "@/hooks/use-dynamic-metadata"
import { useIntersection } from "@/hooks/use-intersection"
import { useIsTabFocused } from "@/hooks/use-is-tab-focused"
import { useMessagesHelpers } from "@/hooks/use-messages-helpers"
import { pusherClient } from "@/lib/pusher"
import { addDisplaySender, cn, groupByDate, reverseArray } from "@/lib/utils"
import { ExtendedMessage, UserType } from "@/types"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Session } from "next-auth"
import React, { forwardRef, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"

type ChatProps = {
    session: Session | null
    chatId: string
    initialMessages: ExtendedMessage[]
    chatPartnerName: string
}

export function Chat({
    session,
    chatId,
    initialMessages,
    chatPartnerName,
}: ChatProps) {
    const queryKey = ["messages"]

    const { fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, data } =
        useInfiniteQuery({
            queryKey,
            queryFn: async ({ pageParam = 1 }) => {
                const query = `/messages?limit=${MESSAGES_INFINITE_SCROLL_COUNT}&page=${pageParam}&chatId=${chatId}`

                const { data } = await axiosInstance.get(query)

                return data as ExtendedMessage[]
            },
            initialPageParam: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            getNextPageParam: (lastPage, allPages) => {
                return lastPage.length ? allPages.length + 1 : undefined
            },
        })

    const wrapperRef = useRef<HTMLDivElement>(null)
    const currentUserId = session?.user.id

    const [messages, setMessages] = useState<ExtendedMessage[]>(initialMessages)
    const [typingUsers, setTypingUsers] = useState<UserType[]>([])

    useEffect(() => {
        if (data?.pages) {
            const reversedPages = reverseArray(
                data.pages.filter((page) => page.length !== 0)
            )
            const messages = reversedPages?.flatMap((page) => page)

            if (messages && messages[0]?.chatId === chatId) {
                setMessages(messages)

                if (
                    // only load new page if there's more than one page & if scroll position is at the very top
                    data.pages.length > 1 &&
                    wrapperRef.current &&
                    wrapperRef.current.scrollTop < 1
                ) {
                    // as soon as new page of messages loads, scroll to the last message you saw before that (first message of the previos page).
                    // otherwise it will scroll to the very top automatically (bad ux)
                    const prevPage = data.pages[data.pages.length - 2]
                    if (prevPage && prevPage[0]) {
                        const prevPageFirstMessage = document.getElementById(
                            prevPage[0].id
                        )
                        prevPageFirstMessage?.scrollIntoView()
                    }
                }
            }
        }
    }, [data, chatId])

    const { isTabFocused } = useIsTabFocused()
    const { ref, entry } = useIntersection({
        threshold: 0,
        isLoading,
    })

    const { unseenCount } = useMessagesHelpers({ messages, currentUserId })
    useDynamicMetadata({
        unseenCount,
        chatPartnerName,
    })

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage()
        }
    }, [entry, hasNextPage, fetchNextPage])

    useEffect(() => {
        wrapperRef.current?.lastElementChild?.scrollIntoView()
    }, [isLoading])

    useEffect(() => {
        pusherClient.subscribe(chatId)
        pusherClient.subscribe(currentUserId)

        function onNewMessage(newMessage: ExtendedMessage) {
            flushSync(() => {
                setMessages((prev) => {
                    if (
                        prev.some(
                            (prevMessage) => prevMessage.id === newMessage.id
                        )
                    )
                        return prev

                    return addDisplaySender([...prev, newMessage])
                })
            })

            wrapperRef.current?.lastElementChild?.scrollIntoView({
                behavior: "smooth",
            })
        }

        function onUpdateMessage(newMessage: ExtendedMessage) {
            setMessages((prev) =>
                prev.map((oldMessage) => {
                    if (oldMessage.id === newMessage.id) return newMessage

                    return oldMessage
                })
            )
            setMessages((prev) => addDisplaySender(prev))
        }

        function onDeleteMessage(deletedMessageId: string) {
            setMessages((prev) =>
                prev.filter((message) => message.id !== deletedMessageId)
            )
        }

        function onStartTyping({ typingUser }: { typingUser: UserType }) {
            setTypingUsers((prev) => {
                if (prev.some((u) => u.id === typingUser.id)) {
                    return prev
                }

                return [...prev, typingUser]
            })
        }

        function onEndTyping({ typingUser }: { typingUser: UserType }) {
            setTypingUsers((prev) => prev.filter((u) => u.id !== typingUser.id))
        }

        pusherClient.bind("chat:start-typing", onStartTyping)
        pusherClient.bind("chat:end-typing", onEndTyping)
        pusherClient.bind("message:new", onNewMessage)
        pusherClient.bind("message:update", onUpdateMessage)
        pusherClient.bind("message:delete", onDeleteMessage)

        return () => {
            pusherClient.unsubscribe(chatId)
            pusherClient.unsubscribe(currentUserId)
            pusherClient.unbind("chat:start-typing", onStartTyping)
            pusherClient.unbind("chat:end-typing", onEndTyping)
            pusherClient.unbind("message:new", onNewMessage)
            pusherClient.unbind("message:update", onUpdateMessage)
            pusherClient.unbind("message:delete", onDeleteMessage)
        }
    }, [chatId, currentUserId])

    const filteredTypingUsers = typingUsers.filter(
        (u) => u.id !== currentUserId
    )

    const typingUsersList = `${filteredTypingUsers
        .map((u) => u.name)
        .join(", ")} ${typingUsers.length === 1 ? "is" : "are"} typing...`

    return (
        <div
            ref={wrapperRef}
            className="relative flex h-[calc(100svh-var(--header-height)-var(--message-form-height)-var(--message-form-image-height))] 
            flex-col overflow-y-auto px-4 py-[var(--chat-padding-block)] [--chat-padding-block:2rem]"
        >
            {isFetchingNextPage && (
                <Loading className=" absolute left-1/2 top-6 -translate-x-1/2" />
            )}

            {messages.length < 1 ? (
                <p className="my-auto self-center text-2xl font-semibold">
                    No history yet.
                </p>
            ) : (
                groupByDate(messages).map((message, idx) => {
                    if (idx === 3) {
                        return (
                            <React.Fragment key={message.id}>
                                {message.dateAbove && (
                                    <MessageDatePill>
                                        {message.dateAbove}
                                    </MessageDatePill>
                                )}
                                <Message
                                    isTabFocused={isTabFocused}
                                    isLast={messages.length === 4}
                                    session={session}
                                    message={message}
                                    ref={ref}
                                />
                            </React.Fragment>
                        )
                    }
                    return (
                        <React.Fragment key={message.id}>
                            {message.dateAbove && (
                                <MessageDatePill>
                                    {message.dateAbove}
                                </MessageDatePill>
                            )}
                            <Message
                                isTabFocused={isTabFocused}
                                isLast={idx === messages.length - 1}
                                session={session}
                                message={message}
                            />
                        </React.Fragment>
                    )
                })
            )}
            <div className="relative">
                <p
                    className={cn(`absolute -bottom-[calc(var(--chat-padding-block)-0.5rem)]
            left-0 text-xs text-foreground/70`)}
                >
                    {filteredTypingUsers.length > 0 && typingUsersList}
                </p>
            </div>
        </div>
    )
}

// eslint-disable-next-line react/display-name
export const ChatSkeleton = forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ ...props }, ref) => {
    return (
        <ChatShell
            {...props}
            ref={ref}
        >
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
        </ChatShell>
    )
})

// eslint-disable-next-line react/display-name
export const ChatShell = forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ children, className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                `relative flex h-[calc(100svh-var(--header-height)-var(--message-form-height)-var(--message-form-image-height))] 
                flex-col overflow-y-auto px-4 py-[var(--chat-padding-block)] [--chat-padding-block:25px]`,
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
})
