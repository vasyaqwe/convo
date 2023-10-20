"use client"

import { Icons } from "@/components/ui/icons"
import { UserAvatar } from "@/components/ui/user-avatar"
import { axiosInstance } from "@/config"
import { cn, formatDateToTimestamp } from "@/lib/utils"
import { ExtendedMessage } from "@/types"
import { useQuery } from "@tanstack/react-query"
import { Session } from "next-auth"
import Image from "next/image"
import { forwardRef } from "react"

type MessageProps = {
    message: ExtendedMessage
    session: Session | null
    isLast: boolean
}

// eslint-disable-next-line react/display-name
const Message = forwardRef<HTMLDivElement, MessageProps>(
    ({ message, session, isLast }, ref) => {
        useQuery(
            ["see-message"],
            async () => {
                const { data } = await axiosInstance.patch(
                    `/message/${message.id}`
                )

                return data
            },
            {
                enabled:
                    isLast && !message.seenByIds.includes(session?.user.id),
            }
        )

        const isOwn = session?.user.id === message.senderId

        const seenByList = message?.seenBy
            ?.filter(
                (user) =>
                    user.id !== message.senderId && user.id !== session?.user.id
            )
            .map((user) => user.name)
            .join(", ")

        return (
            <div
                id={message.id}
                ref={ref}
                className={cn(
                    "relative flex gap-[var(--message-gap)] [--message-gap:10px]",
                    isOwn ? "ml-auto" : "mr-auto flex-row-reverse",
                    message.displaySender ? "mt-2" : "",
                    !isLast
                        ? "scroll-mt-[calc(var(--chat-padding-block)-1px)]"
                        : ""
                )}
            >
                <div className="group">
                    {message.displaySender && (
                        <p className={cn(isOwn ? "text-right" : "text-left")}>
                            {isOwn ? (
                                <>
                                    {message.sender.name}{" "}
                                    <small
                                        className="text-xs text-foreground/75"
                                        suppressHydrationWarning
                                    >
                                        {formatDateToTimestamp(
                                            message.createdAt
                                        )}
                                    </small>
                                </>
                            ) : (
                                <>
                                    <small
                                        className="text-xs text-foreground/75"
                                        suppressHydrationWarning
                                    >
                                        {formatDateToTimestamp(
                                            message.createdAt
                                        )}
                                    </small>{" "}
                                    {message.sender.name}
                                </>
                            )}
                        </p>
                    )}
                    <div
                        className={cn(
                            "relative mt-2 w-fit rounded-3xl bg-primary px-3 py-2 text-sm",
                            isOwn
                                ? "ml-auto rounded-tr-none"
                                : "rounded-tl-none",
                            !message.displaySender
                                ? isOwn
                                    ? "mr-[calc(var(--avatar-size)+var(--message-gap))]"
                                    : "ml-[calc(var(--avatar-size)+var(--message-gap))]"
                                : ""
                        )}
                    >
                        {message.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                className="my-3 max-w-[250px] rounded-xl md:max-w-[280px] lg:max-w-[320px]"
                                src={message.image}
                                alt={message.body ?? ""}
                            />
                        )}
                        {message.body && <p> {message.body}</p>}
                        {!message.displaySender && (
                            <small
                                suppressHydrationWarning
                                className={cn(
                                    "pointer-events-none absolute top-0 whitespace-nowrap text-xs text-foreground/75 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100",
                                    isOwn
                                        ? "left-[calc(100%+var(--message-gap))]"
                                        : "right-[calc(100%+var(--message-gap))]"
                                )}
                            >
                                {formatDateToTimestamp(message.createdAt)}
                            </small>
                        )}
                    </div>

                    {isLast && seenByList.length > 0 && (
                        <p
                            title={`Seen by ${seenByList}`}
                            className={cn(
                                "mt-4 text-right text-xs font-light text-foreground/60",
                                !message.displaySender
                                    ? "mr-[calc(var(--avatar-size)+var(--message-gap))]"
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
                {message.displaySender && <UserAvatar user={message.sender} />}
            </div>
        )
    }
)

function MessageDatePill({
    className,
    children,
    ...props
}: React.ComponentProps<"p">) {
    return (
        <p
            className={cn(
                "sticky left-1/2 top-0 z-[2] w-fit -translate-x-1/2 rounded-xl border border-primary/75 bg-secondary px-3 py-1.5 text-sm",
                className
            )}
            {...props}
        >
            {children}
        </p>
    )
}

export { Message, MessageDatePill }
