"use client"

import { Icons } from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/ui/user-avatar"
import { axiosInstance } from "@/config"
import { cn, formatDateToTimestamp } from "@/lib/utils"
import { ExtendedMessage } from "@/types"
import { useQuery } from "@tanstack/react-query"
import { Session } from "next-auth"
import Image from "next/image"
import Link from "next/link"
import { forwardRef } from "react"

type MessageProps = {
    message: ExtendedMessage
    session: Session | null
    isLast: boolean
}

// eslint-disable-next-line react/display-name
const Message = forwardRef<HTMLDivElement, MessageProps>(
    ({ message, session, isLast }, ref) => {
        useQuery({
            queryKey: ["see-message"],
            queryFn: async () => {
                const { data } = await axiosInstance.patch(
                    `/message/${message.id}`
                )

                return data
            },
            enabled: isLast && !message.seenByIds.includes(session?.user.id),
        })

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
                            "relative mt-2 w-fit rounded-3xl bg-primary p-3 text-sm",
                            isOwn
                                ? "ml-auto rounded-tr-none"
                                : "rounded-tl-none",
                            !message.displaySender
                                ? isOwn
                                    ? "md:mr-[calc(var(--avatar-size)+var(--message-gap))]"
                                    : "md:ml-[calc(var(--avatar-size)+var(--message-gap))]"
                                : ""
                        )}
                    >
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
                        {message.body && (
                            <p className={cn(message.image ? "mt-2" : "")}>
                                {message.body}
                            </p>
                        )}
                        {!message.displaySender && (
                            <small
                                suppressHydrationWarning
                                className={cn(
                                    "pointer-events-none absolute top-0 whitespace-nowrap text-xs text-foreground/75 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 max-md:hidden",
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

function MessageDatePill({
    className,
    children,
    ...props
}: React.ComponentProps<"p">) {
    return (
        <p
            className={cn(
                "sticky left-1/2 top-0 z-[2] w-fit min-w-[150px] -translate-x-1/2 rounded-xl border border-primary/75 bg-secondary px-2 py-1.5 text-center text-sm",
                className
            )}
            {...props}
        >
            {children}
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
            className={cn("relative flex flex-col gap-5")}
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
