"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { AvatarProps } from "@radix-ui/react-avatar"
import { User } from "next-auth"
import { useActiveUsersStore } from "@/stores/use-active-users-store"
import { cn } from "@/lib/utils"

type UserAvatarProps = { user: User } & AvatarProps

export function UserAvatar({ user, ...props }: UserAvatarProps) {
    const { members } = useActiveUsersStore()
    const isActive = members.includes(user.id ?? "")

    return (
        <Avatar {...props}>
            {user.image ? (
                <Image
                    width={40}
                    height={40}
                    src={user.image}
                    alt={user.name ?? "user's avatar"}
                    referrerPolicy="no-referrer"
                    className="w-full rounded-full object-cover"
                />
            ) : (
                <AvatarFallback>
                    {user.name ? user.name[0] : "U"}
                </AvatarFallback>
            )}
            {isActive && (
                <span
                    title={"Online"}
                    role="status"
                    className={cn(
                        "absolute right-1 top-0 block h-3 w-3 rounded-full border border-white bg-green-500"
                    )}
                />
            )}
        </Avatar>
    )
}
