"use client"

import { Icons } from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/ui/user-avatar"
import { axiosInstance } from "@/config"
import { cn, formatDateToTimestamp } from "@/lib/utils"
import { type Emoji, type ExtendedMessage } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type Session } from "next-auth"
import Image from "next/image"
import Link from "next/link"
import {
    forwardRef,
    useState,
    type ComponentProps,
    memo,
    type RefObject,
} from "react"
import { Loading } from "@/components/ui/loading"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useContextMenu } from "@/hooks/use-context-menu"
import { useReplyStore } from "@/stores/use-reply-store.tsx"
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
const Date = dynamic(() => import("@/components/date"), { ssr: false })

type MessageProps = {
    message: ExtendedMessage
    session: Session | null
    isLast: boolean
    isTabFocused: boolean
    wrapperRef: RefObject<HTMLDivElement>
}

// eslint-disable-next-line react/display-name
const Message = forwardRef<HTMLDivElement, MessageProps>(
    ({ message, session, isLast, isTabFocused, wrapperRef }, ref) => {
        const queryClient = useQueryClient()
        const router = useRouter()
        const [reactTooltipOpen, setReactTooltipOpen] = useState(false)
        const { triggerRef, onPointerDown, onPointerUp } = useContextMenu()

        const {
            setReplyTo,
            setIsReplying,
            setHighlightedMessageId,
            highlightedMessageId,
        } = useReplyStore(
            useShallow((state) => ({
                highlightedMessageId:
                    message.id === state.highlightedMessageId
                        ? state.highlightedMessageId
                        : undefined,
                setHighlightedMessageId: state.setHighlightedMessageId,
                setReplyTo: state.setReplyTo,
                setIsReplying: state.setIsReplying,
            }))
        )

        useQuery({
            queryKey: ["see-message"],
            queryFn: async () => {
                const lastMessage = queryClient.getQueryData<ExtendedMessage>([
                    "see-message",
                ])
                if (!message.seenByIds.includes(session?.user.id)) {
                    await axiosInstance.patch(
                        `/message/${lastMessage ? lastMessage.id : message.id}`,
                        { chatId: message.chatId }
                    )

                    return "OK"
                }

                return null
            },
            enabled: isLast && isTabFocused,
        })

        const { isPending, mutate: onDelete } = useMutation({
            mutationFn: async () => {
                await axiosInstance.delete(`/message/${message.id}`)
            },
            onSuccess: () => {
                toast.success("Message deleted")
                queryClient.invalidateQueries({ queryKey: ["messages"] })
                router.refresh()
            },
            onError: () => {
                toast.error("Something went wrong")
            },
        })

        const {
            variables: addedReaction,
            isPending: isAddReactionPending,
            mutate: onAddReaction,
        } = useMutation({
            mutationFn: async ({ body }: ReactionPayload) => {
                await axiosInstance.post(
                    `/message/${message.id}/reaction/add`,
                    {
                        body,
                    }
                )
            },
            onMutate: () => {
                setReactTooltipOpen(false)
            },
            onError: () => {
                toast.error("Couldn't react to message, something went wrong.")
            },
        })

        const {
            variables: removedReaction,
            isPending: isRemoveReactionPending,
            mutate: onRemoveReaction,
        } = useMutation({
            mutationFn: async ({ body }: ReactionPayload) => {
                await axiosInstance.post(
                    `/message/${message.id}/reaction/remove`,
                    {
                        body,
                    }
                )
            },
            onError: (e) => {
                console.log(e)
                toast.error("Couldn't remove reaction, something went wrong.")
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
                if (message.replyToId) setHighlightedMessageId(replyTo.id)

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
                ref={ref}
                className={cn(
                    "relative flex gap-[var(--message-gap)] px-[var(--chat-padding-inline)] transition-colors duration-1000 [--message-gap:6px]",
                    !isLast
                        ? "scroll-mt-[calc(var(--chat-padding-block)-1px)]"
                        : "",
                    highlightedMessageId === message.id ? "bg-secondary" : "",
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
                    {message.displaySender && (
                        <UserAvatar
                            className={cn(
                                "mb-0.5 md:hidden",
                                isOwn ? "ml-auto" : "mr-auto"
                            )}
                            user={message.sender}
                        />
                    )}
                    {message.displaySender && (
                        <p className={cn(isOwn ? "text-right" : "text-left")}>
                            {isOwn ? (
                                <>
                                    {message.sender.name}{" "}
                                    <Date className="text-xs text-foreground/75">
                                        {formatDateToTimestamp(
                                            message.createdAt
                                        )}
                                    </Date>
                                </>
                            ) : (
                                <>
                                    <Date className="text-xs text-foreground/75">
                                        {formatDateToTimestamp(
                                            message.createdAt
                                        )}
                                    </Date>{" "}
                                    {message.sender.name}
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
                                        onClick={(e) => e.preventDefault()}
                                        onDoubleClick={() => {
                                            const isTouchDevice =
                                                "ontouchstart" in window

                                            if (!isTouchDevice) return

                                            onReact({
                                                body: "❤️",
                                            })
                                        }}
                                        ref={triggerRef}
                                        className={cn(
                                            "relative my-1 inline-block w-fit rounded-3xl bg-primary p-3 text-sm max-md:select-none",
                                            isOwn
                                                ? "rounded-tr-none"
                                                : "rounded-tl-none",
                                            !message.displaySender
                                                ? isOwn
                                                    ? "md:mr-[calc(var(--avatar-size)+var(--message-gap))]"
                                                    : "md:ml-[calc(var(--avatar-size)+var(--message-gap))]"
                                                : ""
                                        )}
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
                                                    {
                                                        message.replyTo.sender
                                                            .name
                                                    }
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
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
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
                                        {!message.displaySender && (
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
                                                            sender: {
                                                                id: session
                                                                    ?.user.id,
                                                                image:
                                                                    session
                                                                        ?.user
                                                                        .image ??
                                                                    "",
                                                                username:
                                                                    session
                                                                        ?.user
                                                                        .username ??
                                                                    "",
                                                                name:
                                                                    session
                                                                        ?.user
                                                                        .name ??
                                                                    "",
                                                            },
                                                        }}
                                                    />
                                                )}
                                        </div>
                                    </ContextMenuTrigger>
                                </TooltipTrigger>
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
                                <ContextMenuContent>
                                    {message.senderId === session?.user.id ? (
                                        <>
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
                                        </>
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
                {message.displaySender && (
                    <UserAvatar
                        className="max-md:hidden"
                        user={message.sender}
                    />
                )}
            </div>
        )
    }
)

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
