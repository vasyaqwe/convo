import { UserAvatar } from "@/components/ui/user-avatar"
import { cn } from "@/lib/utils"
import { type ExtendedReaction } from "@/types"
import { type Session } from "next-auth"
import { type ComponentProps } from "react"

export function ReactionButton({
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
                "inline-flex h-[29px] w-[54px] scale-100 items-center justify-center gap-0.5 overflow-hidden rounded-full outline outline-1 outline-transparent hover:outline-white active:scale-95 disabled:scale-100",
                reaction.sender.id === session?.user.id
                    ? "bg-black"
                    : "bg-secondary/75"
            )}
            {...props}
        >
            <span
                className={cn(
                    "text-[1.035rem] leading-none md:text-[1.085rem]"
                )}
            >
                {reaction.body}
            </span>
            <UserAvatar
                className={"[--avatar-size:20px]"}
                user={reaction.sender}
                showActiveIndicator={false}
            />
        </button>
    )
}
