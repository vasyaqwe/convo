"use client"

import { DatePill } from "@/components/date-pill"
import { Message, MessageSkeleton } from "@/components/message"
import { Loading } from "@/components/ui/loading"
import { MESSAGES_INFINITE_SCROLL_COUNT, axiosInstance } from "@/config"
import { useDynamicMetadata } from "@/hooks/use-dynamic-metadata"
import { useEventListener } from "@/hooks/use-event-listener"
import { useIntersection } from "@/hooks/use-intersection"
import { useIsTabFocused } from "@/hooks/use-is-tab-focused"
import { useMessagesHelpers } from "@/hooks/use-messages-helpers"
import { pusherClient } from "@/lib/pusher"
import { addIsRecent, cn, groupByDate } from "@/lib/utils"
import {
    messagesQueryKey,
    useMessageHelpersStore,
} from "@/stores/use-message-helpers-store.tsx"
import type { ExtendedMessage } from "@/types"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import type { Session } from "next-auth"
import { useRouter } from "next/navigation"
import React, { forwardRef, useEffect, useRef } from "react"

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
    const queryClient = useQueryClient()
    const router = useRouter()
    const queryKey = [...messagesQueryKey, chatId]
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
            initialData: { pageParams: [1], pages: [initialMessages] },
        })

    const wrapperRef = useRef<HTMLDivElement>(null)
    const currentUserId = session?.user.id

    const messages = groupByDate(addIsRecent([...data.pages?.flat()].reverse()))

    useEventListener("keydown", (e) => {
        if (e.key === "Escape") router.push("/chats")
    })

    useEffect(() => {
        if (data?.pages) {
            if (messages && messages[0]?.chatId === chatId) {
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
                            prevPage[prevPage.length - 1]?.id ?? ""
                        )
                        prevPageFirstMessage?.scrollIntoView()
                    }
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const { highlightedMessageId, setHighlightedMessageId } =
        useMessageHelpersStore()

    useEffect(() => {
        if (highlightedMessageId === "") return

        let timeout: NodeJS.Timeout | null = null
        let isScrolling = false

        function scrollToMessage() {
            if (isScrolling) return

            const messageNode = document.getElementById(highlightedMessageId)

            if (timeout) {
                clearTimeout(timeout)
            }

            if (messageNode) {
                isScrolling = true

                messageNode.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                })

                timeout = setTimeout(() => {
                    setHighlightedMessageId("")
                }, 1500)

                return
            } else {
                if (wrapperRef.current) {
                    wrapperRef.current.scrollTop = 0
                    setTimeout(() => {
                        scrollToMessage()
                    }, 500)
                }
            }
        }

        if (messages.length > 0) scrollToMessage()

        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [highlightedMessageId, messages])

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage()
        }
    }, [entry, hasNextPage, fetchNextPage])

    useEffect(() => {
        wrapperRef.current?.lastElementChild?.scrollIntoView()
    }, [isLoading])

    function refetchMessages() {
        queryClient.invalidateQueries({ queryKey: messagesQueryKey })
    }

    useEffect(() => {
        pusherClient.subscribe(chatId)

        pusherClient.bind("message:new", refetchMessages)
        pusherClient.bind("message:update", refetchMessages)
        pusherClient.bind("message:delete", refetchMessages)

        return () => {
            pusherClient.unsubscribe(chatId)

            pusherClient.unbind("message:new", refetchMessages)
            pusherClient.unbind("message:update", refetchMessages)
            pusherClient.unbind("message:delete", refetchMessages)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId])

    return (
        <div
            ref={wrapperRef}
            className="chat-wrapper relative flex h-[calc(100svh-var(--header-height)-var(--message-form-height)-var(--message-form-image-height)-var(--message-form-reply-height))] flex-col 
            overflow-y-auto pb-[var(--chat-padding-block)] pt-[calc(var(--chat-padding-block)/2)] [--chat-padding-block:3rem] [--chat-padding-inline:0.5rem] md:[--chat-padding-inline:1rem]"
        >
            {isFetchingNextPage && (
                <Loading className=" absolute left-1/2 top-6 -translate-x-1/2" />
            )}

            {messages.length < 1 ? (
                <p className="pill my-auto self-center text-lg font-semibold">
                    No history yet.
                </p>
            ) : (
                messages.map((message, idx, array) => {
                    const messagesWidthDatesIds = array
                        .filter((m) => m.dateAbove)
                        .map((m) => m.id)

                    if (idx === 3) {
                        return (
                            <React.Fragment key={message.id}>
                                {message.dateAbove && (
                                    <DatePill
                                        messagesWidthDatesIds={
                                            messagesWidthDatesIds
                                        }
                                        messageId={message.id}
                                        wrapperRef={wrapperRef}
                                    >
                                        {message.dateAbove}
                                    </DatePill>
                                )}
                                <Message
                                    wrapperRef={wrapperRef}
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
                                <DatePill
                                    messagesWidthDatesIds={
                                        messagesWidthDatesIds
                                    }
                                    messageId={message.id}
                                    wrapperRef={wrapperRef}
                                >
                                    {message.dateAbove}
                                </DatePill>
                            )}
                            <Message
                                wrapperRef={wrapperRef}
                                isTabFocused={isTabFocused}
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
