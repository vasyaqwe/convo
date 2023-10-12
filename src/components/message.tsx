"use client"

import { Icons } from "@/components/ui/icons"
import { UserAvatar } from "@/components/ui/user-avatar"
import { axiosInstance } from "@/config"
import { cn, formatDate } from "@/lib/utils"
import { ExtendedMessage } from "@/types"
import { useQuery } from "@tanstack/react-query"
import { Session } from "next-auth"

type MessageProps = {
    message: ExtendedMessage
    session: Session | null
    isLast: boolean
}

export function Message({ message, session, isLast }: MessageProps) {
    useQuery(
        ["see-message"],
        async () => {
            const { data } = await axiosInstance.patch(`/message/${message.id}`)

            return data
        },
        {
            enabled: isLast && !message.seenByIds.includes(session?.user.id),
        }
    )

    const isOwn = session?.user.id === message.senderId

    const seenByList = message.seenBy
        .filter(
            (user) =>
                user.id !== message.senderId && user.id !== session?.user.id
        )
        .map((user) => user.name)
        .join(", ")

    return (
        <div
            className={cn(
                "flex gap-[var(--message-gap)] [--message-gap:8px]",
                isOwn ? "ml-auto" : "mr-auto flex-row-reverse"
            )}
        >
            <div>
                {message.displaySender && (
                    <p>
                        {isOwn ? (
                            <>
                                {message.sender.name}{" "}
                                <small
                                    className="text-xs text-foreground/75"
                                    suppressHydrationWarning
                                >
                                    {formatDate(message.createdAt)}
                                </small>
                            </>
                        ) : (
                            <>
                                <small
                                    className="text-xs text-foreground/75"
                                    suppressHydrationWarning
                                >
                                    {formatDate(message.createdAt)}
                                </small>{" "}
                                {message.sender.name}
                            </>
                        )}
                    </p>
                )}
                <p
                    className={cn(
                        "mt-2 w-fit rounded-3xl  bg-primary px-3 py-2 text-sm",
                        isOwn ? "ml-auto rounded-tr-none" : "rounded-tl-none",
                        !message.displaySender
                            ? isOwn
                                ? "mr-[calc(var(--avatar-size)+var(--message-gap))]"
                                : "ml-[calc(var(--avatar-size)+var(--message-gap))]"
                            : ""
                    )}
                >
                    {message.body}
                </p>
                {isLast && seenByList.length > 0 && (
                    <p
                        title={`Seen by ${seenByList}`}
                        className={cn(
                            " mt-4 text-right text-xs font-light text-foreground/60"
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
