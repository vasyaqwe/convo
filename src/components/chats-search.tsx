"use client"

import { Input } from "@/components/ui/input"
import { UserButton, UserButtonSkeleton } from "@/components/user-button"
import { axiosInstance } from "@/config"
import { useDebounce } from "@/hooks/use-debounce"
import { ExtendedChat } from "@/types"
import { User } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import { Session } from "next-auth"
import { useState, useEffect } from "react"

type ChatsSearchProps = {
    existingChats: ExtendedChat[]
    session: Session | null
}

export function ChatsSearch({ existingChats, session }: ChatsSearchProps) {
    const [input, setInput] = useState("")
    const debouncedInput = useDebounce<string>(input, 400)

    const {
        data: results,
        refetch,
        isFetching,
    } = useQuery(
        ["chats-search"],
        async () => {
            if (!input) return []

            const { data } = await axiosInstance.get(`/chats-search?q=${input}`)

            return data as User[]
        },
        {
            enabled: false,
        }
    )

    useEffect(() => {
        refetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedInput])

    return (
        <div className="mt-6">
            <Input
                placeholder="Enter a name or @username..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            {input.length > 0 ? (
                isFetching ? (
                    Array(5)
                        .fill("")
                        .map((_item, idx) => (
                            <UserButtonSkeleton
                                className="mt-5"
                                key={idx}
                            />
                        ))
                ) : (results?.length ?? 0) < 1 ? (
                    <p className="mt-5 text-sm text-foreground/80">
                        No results found.
                    </p>
                ) : (
                    results?.map((user) => (
                        <UserButton
                            chat={existingChats.find((chat) =>
                                chat.userIds.includes(session?.user.id)
                            )}
                            key={user.id}
                            user={user}
                        />
                    ))
                )
            ) : (
                existingChats.map((chat) => {
                    const user = chat.users.find(
                        (u) => u.id !== session?.user.id
                    )

                    if (user) {
                        return (
                            <UserButton
                                chat={chat}
                                key={chat.id}
                                user={user}
                            />
                        )
                    }

                    return null
                })
            )}
        </div>
    )
}
