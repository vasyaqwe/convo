"use client"

import { Icons } from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/ui/user-avatar"
import { axiosInstance } from "@/config"
import { cn, formatDateToTimestamp } from "@/lib/utils"
import {
    type ExtendedReaction,
    type Emoji,
    type ExtendedMessage,
} from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type Session } from "next-auth"
import Image from "next/image"
import Link from "next/link"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
    type RefObject,
    forwardRef,
    useEffect,
    useRef,
    useState,
    type ComponentProps,
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
import { EmojiBar } from "@/components/emoji-bar"
const Date = dynamic(() => import("@/components/date"), { ssr: false })

type MessageProps = {
    message: ExtendedMessage
    session: Session | null
    isLast: boolean
    isTabFocused: boolean
}

// eslint-disable-next-line react/display-name
const Message = forwardRef<HTMLDivElement, MessageProps>(
    ({ message, session, isLast, isTabFocused }, ref) => {
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
                highlightedMessageId: state.highlightedMessageId,
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
            variables,
            isPending: isOnReactPending,
            mutate: onReact,
        } = useMutation({
            mutationFn: async ({
                body,
            }: ReactionPayload & { action: "delete" | "create" }) => {
                await axiosInstance.patch(`/message/${message.id}/react`, {
                    body,
                })
            },
            onMutate: () => {
                setReactTooltipOpen(false)
            },
            onError: () => {
                toast.error("Couldn't react to message, something went wrong.")
            },
        })

        function onReplyClick() {
            const replyTo = document.getElementById(message.replyTo?.id ?? "")

            if (replyTo) {
                replyTo.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                })

                setHighlightedMessageId(replyTo.id)
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

        const bodyWithLinks = message.body?.replace(
            /(https?:\/\/[^\s]+)/g,
            (url) =>
                `<a href="${url}" class="underline hover:no-underline" target="_blank">${url}</a>`
        )

        const reactions = message.reactions?.map((r) => (
            <ReactionButton
                key={r.id}
                session={session}
                reaction={r}
                onClick={() =>
                    onReact({
                        body: r.body as Emoji,
                        action:
                            r.sender.id === session?.user.id
                                ? "delete"
                                : "create",
                    })
                }
            />
        ))

        const filteredForOptimisticDeletionReactions = message.reactions
            ?.filter(
                (r) =>
                    r.body !== variables?.body ||
                    r.sender.id !== session?.user.id
            )
            ?.map((r) => (
                <ReactionButton
                    key={r.id}
                    session={session}
                    reaction={r}
                    onClick={() =>
                        onReact({
                            body: r.body as Emoji,
                            action:
                                r.sender.id === session?.user.id
                                    ? "delete"
                                    : "create",
                        })
                    }
                />
            ))

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex gap-[var(--message-gap)] px-4 transition-colors duration-1000 [--message-gap:6px]",
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
                            delayDuration={200}
                            open={reactTooltipOpen}
                            onOpenChange={setReactTooltipOpen}
                        >
                            <ContextMenu>
                                <TooltipTrigger asChild>
                                    <ContextMenuTrigger
                                        onDoubleClick={() =>
                                            onReact({
                                                body: "❤️",
                                                action: message.reactions?.some(
                                                    (r) =>
                                                        r.sender.id ===
                                                            session?.user.id &&
                                                        r.body === "❤️"
                                                )
                                                    ? "delete"
                                                    : "create",
                                            })
                                        }
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
                                                onClick={onReplyClick}
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
                                        {bodyWithLinks && (
                                            <p
                                                dangerouslySetInnerHTML={{
                                                    __html: bodyWithLinks,
                                                }}
                                                className={cn(
                                                    "break-all",
                                                    message.image ? "mt-2" : ""
                                                )}
                                            ></p>
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
                                            {/* optimistic delete reaction */}
                                            {isOnReactPending &&
                                            variables.action === "delete"
                                                ? filteredForOptimisticDeletionReactions
                                                : reactions}

                                            {/* optimistic create reaction */}
                                            {isOnReactPending &&
                                                !message.reactions?.some(
                                                    (r) =>
                                                        r.sender.id ===
                                                            session?.user.id &&
                                                        r.body ===
                                                            variables.body
                                                ) &&
                                                variables.action ===
                                                    "create" && (
                                                    <ReactionButton
                                                        disabled={
                                                            isOnReactPending &&
                                                            variables.action ===
                                                                "create"
                                                        }
                                                        session={session}
                                                        reaction={{
                                                            ...variables,
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
                                    <EmojiBar
                                        onEmojiClick={(emoji) =>
                                            onReact({
                                                body: emoji,
                                                action: message.reactions?.some(
                                                    (r) =>
                                                        r.sender.id ===
                                                            session?.user.id &&
                                                        r.body === emoji
                                                )
                                                    ? "delete"
                                                    : "create",
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
                                </ContextMenuContent>
                            </ContextMenu>
                        </Tooltip>
                    </TooltipProvider>

                    {isLast && seenByList.length > 0 && (
                        <p
                            title={`Seen by ${seenByList}`}
                            className={cn(
                                "absolute -bottom-6 text-right text-xs font-light text-foreground/60",
                                !message.displaySender
                                    ? "md:mr-[calc(var(--avatar-size)+var(--message-gap))]"
                                    : ""
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

function ReactionButton({
    session,
    reaction,
    ...props
}: ComponentProps<"button"> & {
    reaction: ExtendedReaction
    session: Session | null
}) {
    return (
        <button
            aria-pressed={reaction.sender.id === session?.user.id}
            className={cn(
                "inline-flex items-center overflow-hidden rounded-full px-[.2rem] py-[.25rem] outline outline-1 outline-transparent hover:outline-white",
                reaction.sender.id === session?.user.id
                    ? "bg-black"
                    : "bg-secondary/75"
            )}
            {...props}
        >
            <span className={cn("-ml-[0.2rem] text-lg leading-none")}>
                {reaction.body}
            </span>
            <UserAvatar
                className={"[--avatar-size:17px]"}
                user={reaction.sender}
                showActiveIndicator={false}
            />
        </button>
    )
}

type MessageDatePillProps = React.ComponentProps<"p"> & {
    messageId: string
    wrapperRef: RefObject<HTMLElement>
    messagesWidthDatesIds: string[]
}

function MessageDatePill({
    className,
    children,
    messagesWidthDatesIds,
    messageId,
    wrapperRef,
    ...props
}: MessageDatePillProps) {
    const isLast =
        messagesWidthDatesIds[messagesWidthDatesIds.length - 1] === messageId

    const ref = useRef<HTMLParagraphElement | null>(null)
    const [isSticking, setIsSticking] = useState(false)
    const [y, setY] = useState(wrapperRef.current?.scrollHeight ?? 0)
    const [scrollDirection, setScrollDirection] = useState("up")

    useEffect(() => {
        const wrapper = wrapperRef.current

        const onScroll = () => {
            if (!wrapper) return

            const element = ref.current
            const wrapperPadding = window
                .getComputedStyle(wrapper, null)
                .getPropertyValue("padding-bottom")
                .replace("px", "")

            if (element) {
                const rect = element.getBoundingClientRect()
                setIsSticking(rect.top <= +wrapperPadding * 2)
            }

            if (y > wrapper.scrollTop) {
                setScrollDirection("up")
            } else if (y < wrapper.scrollTop) {
                setScrollDirection("down")
            }

            setY(wrapper.scrollTop)
        }

        if (wrapper) wrapper.addEventListener("scroll", onScroll)

        return () => {
            if (wrapper) wrapper.removeEventListener("scroll", onScroll)
        }
    }, [wrapperRef, y])

    const dates = wrapperRef.current?.querySelectorAll<
        HTMLParagraphElement & { dataset: { sticking: "true" | "false" } }
    >("#message-date-pill")

    const stickingPills = Array.from(dates ?? [])
        ?.filter((date) => date.dataset.sticking === "true")
        .map((p) => p.dataset.messageid)

    return (
        <p
            data-sticking={isSticking}
            data-messageid={messageId}
            id="message-date-pill"
            ref={ref}
            className={cn(
                "sticky -top-[1px] left-1/2 z-[2] w-fit -translate-x-1/2 rounded-full border border-primary/75 bg-secondary px-3 text-center transition-opacity ",
                className,
                (isSticking && !isLast && scrollDirection === "down") ||
                    stickingPills.slice(0, -1).includes(messageId)
                    ? "pointer-events-none opacity-0"
                    : "pointer-events-auto opacity-100"
            )}
            {...props}
        >
            <Date className="mb-1 inline-block text-[0.85rem]">{children}</Date>
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

export { Message, MessageDatePill, MessageSkeleton }
