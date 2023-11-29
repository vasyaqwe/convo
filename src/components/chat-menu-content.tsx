"use client"

import { useRouter } from "next/navigation"
import type { ExtendedChat } from "@/types"
import { ContextMenuItem } from "@/components/ui/context-menu"
import { useMutation } from "@tanstack/react-query"
import { axiosInstance } from "@/config"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"
import { Icons } from "@/components/ui/icons"
import { type ContextMenuItemProps } from "@radix-ui/react-context-menu"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { type Session } from "next-auth"

type ChatMenuContentProps = {
    chat: ExtendedChat
    session: Session | null
    variant?: "context-menu" | "dropdown-menu"
} & ContextMenuItemProps

export function ChatMenuContent({
    chat,
    session,
    variant = "dropdown-menu",
    ...props
}: ChatMenuContentProps) {
    const router = useRouter()

    const { isPending, mutate: onDelete } = useMutation({
        mutationFn: async () => {
            await axiosInstance.delete(`/chat/${chat.id}`)
        },
        onSuccess: () => {
            toast.success("Chat deleted")
            router.push("/chats")
            router.refresh()
        },
        onError: () => {
            toast.error("Something went wrong")
        },
    })

    const { isPending: isMutePending, mutate: onMute } = useMutation({
        mutationFn: async () => {
            const { data } = await axiosInstance.patch(
                `/chat/${chat.id}/toggle-mute`
            )

            return data as string
        },
        onSuccess: (res) => {
            toast.success(res)
            router.refresh()
            document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Escape" })
            )
        },
        onError: () => {
            toast.error("Something went wrong")
        },
    })

    const MenuItem =
        variant === "context-menu" ? ContextMenuItem : DropdownMenuItem

    const isMuted = chat.mutedByIds.includes(session?.user.id)

    return (
        <>
            <MenuItem
                disabled={isPending}
                className="min-w-[140px] !text-destructive"
                onSelect={(e) => {
                    e.preventDefault()
                    onDelete()
                }}
                {...props}
            >
                {isPending ? (
                    <Loading className="mr-2" />
                ) : (
                    <Icons.trash className="mr-2" />
                )}{" "}
                Delete chat
            </MenuItem>
            <MenuItem
                disabled={isMutePending}
                onSelect={(e) => {
                    e.preventDefault()
                    onMute()
                }}
                {...props}
            >
                {isMutePending ? (
                    <Loading className={"mr-2"} />
                ) : isMuted ? (
                    <Icons.volume className="mr-2" />
                ) : (
                    <Icons.volumeX className="mr-2" />
                )}{" "}
                {isMuted ? "Unmute chat" : "Mute chat"}
            </MenuItem>
        </>
    )
}
