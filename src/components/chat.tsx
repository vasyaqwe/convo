"use client"

import { Message } from "@/components/message"
import { Loading } from "@/components/ui/loading"
import { MESSAGES_INFINITE_SCROLL_COUNT, axiosInstance } from "@/config"
import { useIntersection } from "@/hooks/use-intersection"
import { pusherClient } from "@/lib/pusher"
import { reverseArray } from "@/lib/utils"
import { ExtendedMessage } from "@/types"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Session } from "next-auth"
import { useEffect, useRef, useState } from "react"

type ChatProps = {
    session: Session | null
    chatId: string
    initialMessages: ExtendedMessage[]
}

export function Chat({ session, chatId, initialMessages }: ChatProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState<ExtendedMessage[]>(
        reverseArray(initialMessages)
    )
    const queryKey = ["messages"]

    const { isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useInfiniteQuery(
            queryKey,
            async ({ pageParam = 1 }) => {
                const query = `/messages?limit=${MESSAGES_INFINITE_SCROLL_COUNT}&page=${pageParam}&chatId=${chatId}`

                const { data } = await axiosInstance.get(query)

                return data as ExtendedMessage[]
            },
            {
                onSuccess: ({ pages }) => {
                    const data = pages?.flatMap((page) => page)
                    if (data[0].chatId === chatId) {
                        setMessages(reverseArray(data))
                        if (
                            pages.length > 1 &&
                            wrapperRef.current &&
                            wrapperRef.current.scrollTop < 1
                        ) {
                            const prevPage = pages[pages.length - 2]
                            const prevPageFirstMessage =
                                document.getElementById(
                                    prevPage[prevPage.length - 1].id
                                )

                            prevPageFirstMessage?.scrollIntoView()
                        }
                    }
                },
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                getNextPageParam: (lastPage, allPages) => {
                    return lastPage.length ? allPages.length + 1 : undefined
                },
            }
        )

    const { ref, entry } = useIntersection({
        threshold: 0,
        isLoading,
    })

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage()
        }
    }, [entry, hasNextPage, fetchNextPage])

    useEffect(() => {
        scrollToBottom()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading])

    useEffect(() => {
        pusherClient.subscribe(chatId)

        function onNewMessage(newMessage: ExtendedMessage) {
            setMessages((prev) => {
                if (
                    prev.some((prevMessage) => prevMessage.id === newMessage.id)
                )
                    return prev

                return [...prev, newMessage]
            })
        }

        function onUpdateMessage(newMessage: ExtendedMessage) {
            setMessages((prev) =>
                prev.map((oldMessage) => {
                    if (oldMessage.id === newMessage.id) return newMessage

                    return oldMessage
                })
            )
            // queryClient.invalidateQueries(queryKey)
        }

        pusherClient.bind("message:new", onNewMessage)
        pusherClient.bind("message:update", onUpdateMessage)

        return () => {
            pusherClient.unsubscribe(chatId)
            pusherClient.unbind("message:new", onNewMessage)
            pusherClient.unbind("message:update", onUpdateMessage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId])

    function scrollToBottom() {
        const wrapper = wrapperRef.current
        if (wrapper) {
            wrapper.scrollTop = wrapper.scrollHeight
        }
    }

    return (
        <div
            onClick={() => {
                document
                    .getElementById("6529164dd01cb837d736a243")
                    ?.scrollIntoView()
            }}
            ref={wrapperRef}
            className="relative flex h-[calc(100vh-var(--header-height)-var(--message-form-height))] flex-col 
             overflow-y-auto px-4 py-[var(--chat-padding-block)] [--chat-padding-block:40px]"
        >
            {messages.length < 1 && (
                <p className="my-auto self-center text-2xl font-semibold">
                    No history yet.
                </p>
            )}

            {isFetchingNextPage && (
                <Loading className=" absolute left-1/2 top-6 -translate-x-1/2" />
            )}

            {isLoading ? (
                <Loading className=" absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            ) : (
                messages.map((message, idx) => {
                    if (idx === 3) {
                        return (
                            <Message
                                isLast={false}
                                session={session}
                                key={message.id}
                                message={message}
                                ref={ref}
                            />
                        )
                    }

                    return (
                        <Message
                            isLast={idx === messages.length - 1}
                            session={session}
                            key={message.id}
                            message={message}
                        />
                    )
                })
            )}
        </div>
    )
}
