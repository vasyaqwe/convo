"use client"

import { ChatsList } from "@/components/chats-list"
import { cn } from "@/lib/utils"
import { Session } from "next-auth"

export function Chats({
    className,
    session,
    ...props
}: React.ComponentProps<"aside"> & { session: Session }) {
    return (
        <aside
            className={cn(
                "sticky left-0 top-0 flex h-[100svh] flex-col border-r border-secondary bg-accent pb-5 md:w-[var(--chats-width)]",
                className
            )}
            {...props}
        >
            <header className="flex h-[var(--header-height)] flex-shrink-0 items-center border-b border-secondary px-4 ">
                <h2 className="text-3xl font-semibold">Chats</h2>
            </header>
            <ChatsList session={session} />
        </aside>
    )
}
