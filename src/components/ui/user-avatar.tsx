"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { type AvatarProps } from "@radix-ui/react-avatar"
import { type User } from "next-auth"
import { useActiveUsersStore } from "@/stores/use-active-users-store"
import { cn } from "@/lib/utils"

type UserAvatarProps = {
    user: User
    showActiveIndicator?: boolean
} & AvatarProps

export function UserAvatar({
    user,
    showActiveIndicator = true,
    className,
    ...props
}: UserAvatarProps) {
    const members = useActiveUsersStore((state) => state.members)
    const isActive = members.includes(user.id ?? "")

    const size =
        typeof window !== "undefined"
            ? +getComputedStyle(document.documentElement)
                  .getPropertyValue("--avatar-size")
                  .replace("px", "") ?? 45
            : 45

    return (
        <Avatar
            {...props}
            className={cn(
                "h-[var(--avatar-size)] w-[var(--avatar-size)]",
                className
            )}
        >
            {user.image ? (
                <Image
                    width={size}
                    height={size}
                    src={user.image}
                    alt={user.name ?? "user's avatar"}
                    referrerPolicy="no-referrer"
                    className="w-full rounded-full object-cover"
                />
            ) : (
                <AvatarFallback className="text-[calc(var(--avatar-size)/2.5)]">
                    {user.name ? user.name[0] : "U"}
                </AvatarFallback>
            )}
            {isActive && showActiveIndicator && (
                <span
                    title={"Online"}
                    role="status"
                    className={cn(
                        "absolute right-0.5 top-0.5 block h-3 w-3 rounded-full border border-white bg-green-500"
                    )}
                />
            )}
        </Avatar>
    )
}
