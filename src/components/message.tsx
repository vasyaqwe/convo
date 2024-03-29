"use client"

import { Icons } from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/ui/user-avatar"
import { axiosInstance } from "@/config"
import { cn, formatDateToTimestamp, isObjectId } from "@/lib/utils"
import { type UserType, type Emoji, type ExtendedMessage } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type Session } from "next-auth"
import Image from "next/image"
import Link from "next/link"
import {
    useState,
    type ComponentProps,
    memo,
    type RefObject,
    useEffect,
} from "react"
import { Loading } from "@/components/ui/loading"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useContextMenu } from "@/hooks/use-context-menu"
import {
    messagesQueryKey,
    useMessageHelpersStore,
} from "@/stores/use-message-helpers-store.tsx"
import { useShallow } from "zustand/react/shallow"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { type ReactionPayload } from "@/lib/validations/reaction"
import { EmojiPicker } from "@/components/emoji-picker"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ReactionButton } from "@/components/reaction-button"
import { seeMessage } from "@/lib/actions"
import { useAction } from "@/hooks/use-action"

const Date = dynamic(() => import("@/components/date"), { ssr: false })

type MessageProps = {
    message: ExtendedMessage
    session: Session | null
    isLast: boolean
    isTabFocused: boolean
    wrapperRef: RefObject<HTMLDivElement>
}

// eslint-disable-next-line react/display-name
function Message({
    message,
    session,
    isLast,
    isTabFocused,
    wrapperRef,
}: MessageProps) {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [reactTooltipOpen, setReactTooltipOpen] = useState(false)
    const { triggerRef, onPointerDown, onPointerUp } = useContextMenu()
    const queryKey = [...messagesQueryKey, message.chatId]

    const {
        setReplyTo,
        isReplying,
        setIsReplying,
        setHighlightedReplyId,
        highlightedReplyId,
        highlightedMessageId,
    } = useMessageHelpersStore(
        useShallow((state) => ({
            highlightedMessageId:
                message.id === state.highlightedMessageId
                    ? state.highlightedMessageId
                    : undefined,
            highlightedReplyId:
                message.id === state.highlightedReplyId
                    ? state.highlightedReplyId
                    : undefined,
            setHighlightedReplyId: state.setHighlightedReplyId,
            setReplyTo: state.setReplyTo,
            isReplying: state.isReplying,
            setIsReplying: state.setIsReplying,
        }))
    )

    const { isPending: seeMessagePending, execute: executeSeeMessage } =
        useAction(seeMessage)

    useEffect(() => {
        if (
            seeMessagePending ||
            !isLast ||
            !isTabFocused ||
            message.seenByIds.includes(session?.user.id) ||
            message.senderId === session?.user.id
        ) {
            return
        }

        executeSeeMessage({
            messageId: message.id,
            userId: session?.user.id,
        })
    }, [
        isLast,
        isTabFocused,
        message.id,
        message.senderId,
        session,
        message.seenByIds,
        seeMessagePending,
        executeSeeMessage,
    ])

    const { isPending, mutate: onDelete } = useMutation({
        mutationFn: async () => {
            await axiosInstance.delete(`/message/${message.id}`)
        },
        onSuccess: () => {
            toast.success("Message deleted")
            router.refresh()
        },
        onError: () => {
            toast.error("Something went wrong")
        },
        onSettled: async () => {
            queryClient.invalidateQueries({
                queryKey,
            })
        },
    })

    const {
        variables: addedReaction,
        isPending: isAddReactionPending,
        mutate: onAddReaction,
    } = useMutation({
        mutationFn: async ({ body }: ReactionPayload) => {
            await axiosInstance.post(`/message/${message.id}/reaction/add`, {
                body,
            })
        },
        onMutate: () => {
            setReactTooltipOpen(false)
        },
        onError: () => {
            toast.error("Couldn't react to message, something went wrong.")
        },
        onSettled: async () => {
            return await queryClient.invalidateQueries({
                queryKey,
            })
        },
    })

    const {
        variables: removedReaction,
        isPending: isRemoveReactionPending,
        mutate: onRemoveReaction,
    } = useMutation({
        mutationFn: async ({ body }: ReactionPayload) => {
            await axiosInstance.post(`/message/${message.id}/reaction/remove`, {
                body,
            })
        },
        onError: () => {
            toast.error("Couldn't remove reaction, something went wrong.")
        },
        onSettled: async () => {
            return await queryClient.invalidateQueries({
                queryKey,
            })
        },
    })

    function onReact({ body }: ReactionPayload) {
        const existingReaction = message.reactions?.find(
            (r) => r.sender.id === session?.user.id && r.body === body
        )

        if (existingReaction) return onRemoveReaction({ body })

        return onAddReaction({ body })
    }

    function onReplyClick() {
        const replyTo = document.getElementById(message.replyTo?.id ?? "")

        if (replyTo) {
            replyTo.scrollIntoView({
                behavior: "smooth",
                block: "center",
            })
            if (message.replyToId) setHighlightedReplyId(replyTo.id)

            return
        } else {
            if (wrapperRef.current) {
                wrapperRef.current.scrollTop = 0
                setTimeout(() => {
                    onReplyClick()
                }, 500)
            }
        }
    }

    const isOwn = session?.user.id === message.senderId

    const seenByList = message?.seenBy
        ?.filter(
            (user) =>
                user.id !== message.senderId && user.id !== session?.user.id
        )
        .map((user) => user.name)
        .join(", ")

    const filteredReactions = (
        isRemoveReactionPending
            ? message.reactions?.filter(
                  (r) =>
                      r.body !== removedReaction?.body ||
                      r.sender.id !== session?.user.id
              )
            : message.reactions
    )?.map((r) => (
        <ReactionButton
            disabled={isRemoveReactionPending || isAddReactionPending}
            key={r.id}
            session={session}
            reaction={r}
            onClick={() =>
                onReact({
                    body: r.body as Emoji,
                })
            }
        />
    ))

    return (
        <div
            className={cn(
                "relative flex gap-[var(--message-gap)] px-[var(--chat-padding-inline)] transition-colors duration-1000 [--message-gap:6px]",
                !isLast
                    ? "scroll-mt-[calc(var(--chat-padding-block)-1px)]"
                    : "",
                highlightedReplyId === message.id ||
                    highlightedMessageId === message.id
                    ? "bg-secondary"
                    : "",
                !isOwn ? "flex-row-reverse" : ""
            )}
            id={message.id}
        >
            <div
                className={cn(
                    "group",
                    isOwn ? "ml-auto flex flex-col items-end" : "mr-auto"
                )}
            >
                {!message.isRecent && (
                    <p className={cn(isOwn ? "text-right" : "text-left")}>
                        {isOwn ? (
                            <>
                                <Date className="text-xs text-foreground/75 md:mr-2">
                                    {formatDateToTimestamp(message.createdAt)}
                                </Date>
                                <span className="max-md:hidden">
                                    {message.sender.name}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="max-md:hidden">
                                    {message.sender.name}
                                </span>
                                <Date className="text-xs text-foreground/75 md:ml-2">
                                    {formatDateToTimestamp(message.createdAt)}
                                </Date>
                            </>
                        )}
                    </p>
                )}
                <TooltipProvider>
                    <Tooltip
                        delayDuration={100}
                        open={reactTooltipOpen}
                        onOpenChange={setReactTooltipOpen}
                    >
                        <ContextMenu>
                            <TooltipTrigger asChild>
                                <ContextMenuTrigger
                                    disabled={!isObjectId(message.id)}
                                    onClick={(e) => e.preventDefault()}
                                    onDoubleClick={() => {
                                        const isTouchDevice =
                                            "ontouchstart" in window

                                        if (!isTouchDevice) return

                                        onReact({
                                            body: "❤️",
                                        })
                                    }}
                                    className={cn(
                                        "relative my-1 inline-block w-fit rounded-3xl bg-primary p-3 text-sm max-md:select-none",
                                        isOwn
                                            ? "rounded-tr-none"
                                            : "rounded-tl-none",
                                        message.isRecent
                                            ? isOwn
                                                ? "md:mr-[calc(var(--avatar-size)+var(--message-gap))]"
                                                : "md:ml-[calc(var(--avatar-size)+var(--message-gap))]"
                                            : ""
                                    )}
                                    ref={triggerRef}
                                    onPointerDown={onPointerDown}
                                    onPointerUp={onPointerUp}
                                >
                                    {message.replyTo && (
                                        <button
                                            onClick={() => onReplyClick()}
                                            className="relative mb-3 block overflow-hidden rounded-lg bg-foreground/20 p-2 pl-3.5 text-left transition-opacity before:absolute
                                    before:left-0 before:top-0 before:h-full before:w-1.5 before:bg-secondary/80 hover:opacity-80"
                                        >
                                            <p className="font-medium">
                                                {message.replyTo.sender.name}
                                            </p>
                                            {message.replyTo.image &&
                                                !message.replyTo.body && (
                                                    <p
                                                        className={cn(
                                                            "mt-1 max-w-[130px] truncate"
                                                        )}
                                                    >
                                                        Sent an image
                                                    </p>
                                                )}
                                            {message.replyTo.body && (
                                                <p
                                                    className={cn(
                                                        "mt-1 max-w-[130px] truncate"
                                                    )}
                                                >
                                                    {message.replyTo.body}
                                                </p>
                                            )}
                                        </button>
                                    )}
                                    {message.image && (
                                        <Link
                                            onClick={(e) => e.stopPropagation()}
                                            href={message.image}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative block h-40 w-40 rounded-2xl"
                                        >
                                            <Image
                                                src={message.image}
                                                alt={message.body ?? ""}
                                                fill
                                                className="rounded-2xl object-cover"
                                            />
                                        </Link>
                                    )}
                                    {message.body && (
                                        <MessageBody
                                            body={message.body}
                                            className={cn(
                                                message.image ? "mt-2" : ""
                                            )}
                                        />
                                    )}
                                    {message.isRecent && (
                                        <Date
                                            className={cn(
                                                "pointer-events-none absolute top-0 whitespace-nowrap text-xs text-foreground/75 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 max-md:hidden",
                                                isOwn
                                                    ? "left-[calc(100%+var(--message-gap))]"
                                                    : "right-[calc(100%+var(--message-gap))]"
                                            )}
                                        >
                                            {formatDateToTimestamp(
                                                message.createdAt
                                            )}
                                        </Date>
                                    )}
                                    <div className="mt-2 flex flex-wrap gap-1 empty:hidden">
                                        {filteredReactions}
                                        {isAddReactionPending &&
                                            !message.reactions?.some(
                                                (r) =>
                                                    r.sender.id ===
                                                        session?.user.id &&
                                                    r.body ===
                                                        addedReaction.body
                                            ) && (
                                                <ReactionButton
                                                    disabled={
                                                        isAddReactionPending ||
                                                        isRemoveReactionPending
                                                    }
                                                    session={session}
                                                    reaction={{
                                                        ...addedReaction,
                                                        id: "id",
                                                        sender: session?.user as UserType,
                                                    }}
                                                />
                                            )}
                                    </div>
                                </ContextMenuTrigger>
                            </TooltipTrigger>
                            {/* check for optimistic message */}
                            {isObjectId(message.id) && (
                                <TooltipContent
                                    className="bg-transparent p-0"
                                    align={isOwn ? "start" : "end"}
                                    alignOffset={-20}
                                    side="bottom"
                                    sideOffset={-12}
                                >
                                    <EmojiPicker
                                        onEmojiClick={(emoji) =>
                                            onReact({
                                                body: emoji,
                                            })
                                        }
                                    />
                                </TooltipContent>
                            )}
                            <ContextMenuContent
                                onAnimationEndCapture={() => {
                                    if (isReplying) {
                                        setTimeout(() => {
                                            document
                                                .getElementById("message-input")
                                                ?.focus()
                                        }, 100)
                                    }
                                }}
                            >
                                {message.senderId === session?.user.id &&
                                message.replies.length < 1 ? (
                                    <ContextMenuItem
                                        disabled={isPending}
                                        className="!text-destructive"
                                        onSelect={(e) => {
                                            e.preventDefault()
                                            onDelete()
                                        }}
                                    >
                                        {isPending ? (
                                            <Loading className="mr-2" />
                                        ) : (
                                            <Icons.trash className="mr-2" />
                                        )}{" "}
                                        Delete message
                                    </ContextMenuItem>
                                ) : (
                                    <ContextMenuItem
                                        onSelect={() => {
                                            setIsReplying(true)
                                            setReplyTo(message)
                                        }}
                                    >
                                        <Icons.reply className="mr-2" />
                                        Reply
                                    </ContextMenuItem>
                                )}
                                <ContextMenuSeparator />
                                <ContextMenuItem className="p-0 hover:!bg-transparent">
                                    <EmojiPicker
                                        className="bg-none"
                                        direction="horizontal"
                                        onEmojiClick={(emoji) => {
                                            onReact({
                                                body: emoji,
                                            })
                                        }}
                                    />
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    </Tooltip>
                </TooltipProvider>

                {isLast && seenByList.length > 0 && (
                    <p
                        title={`Seen by ${seenByList}`}
                        className={cn(
                            "absolute -bottom-6 right-0 mr-[var(--chat-padding-inline)] text-right text-xs font-light text-foreground/60 md:mr-[calc(var(--avatar-size)+var(--message-gap)+var(--chat-padding-inline))]"
                        )}
                    >
                        <span className="sr-only">Seen by</span>
                        <Icons.eye
                            className="inline"
                            width={15}
                            height={15}
                        />{" "}
                        {seenByList}
                    </p>
                )}
            </div>
            {!message.isRecent && (
                <UserAvatar
                    className="max-md:hidden"
                    user={message.sender}
                />
            )}
        </div>
    )
}

function MessageBody({
    body,
    className,
    ...props
}: { body: string } & ComponentProps<"p">) {
    const replacedString = body
        .split(/(https?:\/\/[^\s]+)/g)
        .map((part, index) => {
            if (index % 2 === 1) {
                return (
                    <a
                        onClick={(e) => e.stopPropagation()}
                        href={part}
                        className="underline hover:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        key={index}
                    >
                        {part}
                    </a>
                )
            }
            return part
        })

    return (
        <p
            className={cn("break-all", className)}
            {...props}
        >
            {replacedString}
        </p>
    )
}

function MessageSkeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            role="status"
            className={cn("relative flex flex-col gap-5", className)}
            {...props}
        >
            <div
                className={cn("relative ml-auto flex w-full flex-col gap-5")}
                style={{ direction: "rtl" }}
            >
                <div className="flex items-start gap-[var(--message-gap)] [--message-gap:10px]">
                    <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
                    <div className="w-full flex-shrink-0">
                        <Skeleton className="mt-2 h-10 w-[80%] rounded-full rounded-tr-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-10 w-[80%] rounded-full rounded-tr-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-10 w-[50%] rounded-full rounded-tr-none lg:w-1/6" />
                    </div>
                </div>

                <div className="flex items-start gap-[var(--message-gap)] [--message-gap:10px]">
                    <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
                    <div className="w-full flex-shrink-0">
                        <Skeleton className="mt-2 h-6 w-[80%] rounded-full rounded-tr-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-6 w-[50%] rounded-full rounded-tr-none lg:w-1/6" />
                    </div>
                </div>
            </div>
            <div className={cn("relative flex flex-col gap-5")}>
                <div className="flex items-start gap-[var(--message-gap)] [--message-gap:10px]">
                    <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
                    <div className="w-full">
                        <Skeleton className="mt-2 h-6 w-[80%] rounded-full rounded-tl-none lg:w-1/5" />
                    </div>
                </div>

                <div className="flex items-start gap-[var(--message-gap)] [--message-gap:10px]">
                    <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
                    <div className="w-full">
                        <Skeleton className="mt-2 h-10 w-[80%] rounded-full rounded-tl-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-12 w-[50%] rounded-full rounded-tl-none lg:w-1/6" />
                        <Skeleton className="mt-5 h-7 w-[70%] rounded-full rounded-tl-none lg:w-1/4" />
                        <Skeleton className="mt-5 h-6 w-[40%] rounded-full rounded-tl-none lg:w-1/6" />
                    </div>
                </div>
            </div>

            <div
                className={cn("relative ml-auto flex w-full flex-col gap-5")}
                style={{ direction: "rtl" }}
            >
                <div className="flex items-start gap-[var(--message-gap)] [--message-gap:10px]">
                    <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
                    <div className="w-full flex-shrink-0">
                        <Skeleton className="mt-2 h-10 w-[80%] rounded-full rounded-tr-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-10 w-[80%] rounded-full rounded-tr-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-10 w-[50%] rounded-full rounded-tr-none lg:w-1/6" />
                    </div>
                </div>

                <div className="flex items-start gap-[var(--message-gap)] [--message-gap:10px]">
                    <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
                    <div className="w-full flex-shrink-0">
                        <Skeleton className="mt-2 h-6 w-[80%] rounded-full rounded-tr-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-6 w-[50%] rounded-full rounded-tr-none lg:w-1/6" />
                    </div>
                </div>
            </div>

            <div className={cn("relative flex flex-col gap-5")}>
                <div className="flex items-start gap-[var(--message-gap)] [--message-gap:10px]">
                    <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
                    <div className="w-full">
                        <Skeleton className="mt-2 h-8 w-[80%] rounded-full rounded-tl-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-10 w-[50%] rounded-full rounded-tl-none lg:w-1/6" />
                        <Skeleton className="mt-5 h-6 w-[70%] rounded-full rounded-tl-none lg:w-1/4" />
                    </div>
                </div>

                <div className="flex items-start gap-[var(--message-gap)] [--message-gap:10px]">
                    <Skeleton className="h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0 rounded-full" />
                    <div className="w-full">
                        <Skeleton className="mt-2 h-6 w-[80%] rounded-full rounded-tl-none lg:w-1/5" />
                        <Skeleton className="mt-5 h-7 w-[50%] rounded-full rounded-tl-none lg:w-1/6" />
                    </div>
                </div>
            </div>
        </div>
    )
}

const MemoizedMessage = memo(Message)

export { MemoizedMessage as Message, MessageSkeleton }
