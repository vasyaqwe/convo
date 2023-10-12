"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { AvatarProps } from "@radix-ui/react-avatar"
import { User } from "next-auth"

type UserAvatarProps = { user: User | undefined } & AvatarProps

export function UserAvatar({ user, ...props }: UserAvatarProps) {
    return !user ? (
        <Avatar {...props}>
            <AvatarFallback>G</AvatarFallback>
        </Avatar>
    ) : (
        <Avatar {...props}>
            {user.image ? (
                <Image
                    width={40}
                    height={40}
                    src={user.image}
                    alt={user.name ?? "user's avatar"}
                    referrerPolicy="no-referrer"
                />
            ) : (
                <AvatarFallback>
                    {user.name ? user.name[0] : "U"}
                </AvatarFallback>
            )}
        </Avatar>
    )
}
