"use client"

import { Message, MessageDatePill } from "@/components/message"
import { Loading } from "@/components/ui/loading"
import { MESSAGES_INFINITE_SCROLL_COUNT, axiosInstance } from "@/config"
import { useIntersection } from "@/hooks/use-intersection"
import { pusherClient } from "@/lib/pusher"
import { addDisplaySender, groupByDate, reverseArray } from "@/lib/utils"
import { ExtendedMessage } from "@/types"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Session } from "next-auth"
import React, { useEffect, useRef, useState } from "react"

type ChatProps = {
    session: Session | null
    chatId: string
    initialMessages: ExtendedMessage[]
}

export function Chat({ session, chatId, initialMessages }: ChatProps) {
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

    const [messages, setMessages] = useState<ExtendedMessage[]>(initialMessages)

    useEffect(() => {
        if (data?.pages) {
            const reversedPages = reverseArray(
                data.pages.filter((page) => page.length !== 0)
            )
            const messages = reversedPages?.flatMap((page) => page)

            if (messages && messages[0]?.chatId === chatId) {
                setMessages(messages)
                if (
                    data.pages.length > 1 &&
                    wrapperRef.current &&
                    wrapperRef.current.scrollTop < 1
                ) {
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
        const wrapper = wrapperRef.current
        if (wrapper) {
            wrapper.scrollTop = wrapper.scrollHeight
        }
    }, [isLoading])

    useEffect(() => {
        pusherClient.subscribe(chatId)

        function onNewMessage(newMessage: ExtendedMessage) {
            setMessages((prev) => {
                if (
                    prev.some((prevMessage) => prevMessage.id === newMessage.id)
                )
                    return prev

                return addDisplaySender([...prev, newMessage])
            })

            setTimeout(() => {
                document.getElementById(newMessage.id)?.scrollIntoView()
            }, 100)
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

        pusherClient.bind("message:new", onNewMessage)
        pusherClient.bind("message:update", onUpdateMessage)

        return () => {
            pusherClient.unsubscribe(chatId)
            pusherClient.unbind("message:new", onNewMessage)
            pusherClient.unbind("message:update", onUpdateMessage)
        }
    }, [chatId, session?.user.id])

    return (
        <div
            ref={wrapperRef}
            className="relative flex h-[calc(100svh-var(--header-height)-var(--message-form-height)-var(--message-form-image-height))] 
            flex-col overflow-y-auto px-4 py-[var(--chat-padding-block)] [--chat-padding-block:25px]"
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
                                isLast={idx === messages.length - 1}
                                session={session}
                                message={message}
                            />
                        </React.Fragment>
                    )
                })
            )}
        </div>
    )
}
