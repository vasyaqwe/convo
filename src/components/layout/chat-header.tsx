"use client"

import { User } from "next-auth"

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/ui/user-avatar"
import { ExtendedChat } from "@/types"
import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { axiosInstance } from "@/config"
import { Loading } from "@/components/ui/loading"
import { useActiveUsersStore } from "@/stores/use-active-users-store"

type ChatHeaderProps = {
    user: User
    chat: ExtendedChat
}

export function ChatHeader({ user, chat }: ChatHeaderProps) {
    const { members } = useActiveUsersStore()
    const chatPartner = chat.users.find((u) => u.id !== user.id) as User
    // casting because I know better

    const router = useRouter()

    const { isLoading, mutate: onDelete } = useMutation(
        async () => {
            await axiosInstance.delete(`/chat/${chat.id}`)
        },
        {
            onSuccess: () => {
                toast.success("Chat deleted")
                router.push("/")
                router.refresh()
            },
            onError: () => {
                toast.error("Something went wrong")
            },
        }
    )

    const isActive = members.includes(chatPartner.id ?? "")

    return (
        <header className="flex h-[var(--header-height)] items-center justify-between border-b border-secondary/75 p-4 ">
            <div className="flex items-center gap-3">
                <UserAvatar user={chatPartner} />
                <div>
                    <p>{chatPartner.name}</p>
                    <p className="text-sm text-foreground/75">
                        {isActive ? "Online" : "Offline"}
                    </p>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant={"ghost"}
                        size={"icon"}
                    >
                        <Icons.moreVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="px-3 pb-2"
                >
                    <DropdownMenuItem
                        disabled={isLoading}
                        className="!text-destructive"
                        onSelect={(e) => {
                            e.preventDefault()
                            onDelete()
                        }}
                    >
                        {isLoading ? (
                            <Loading className="mr-2" />
                        ) : (
                            <Icons.trash className="mr-2" />
                        )}{" "}
                        Delete chat
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}
