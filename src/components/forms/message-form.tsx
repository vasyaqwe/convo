"use client"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { TextArea } from "@/components/ui/textarea"
import { axiosInstance } from "@/config"
import { MessagePayload } from "@/lib/validations/message"
import { ExtendedMessage } from "@/types"
import {
    InfiniteData,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

type MessageFormProps = {
    chatId: string
}

export function MessageForm({ chatId }: MessageFormProps) {
    const [body, setBody] = useState("")

    const queryClient = useQueryClient()
    const router = useRouter()

    const { mutate } = useMutation(
        async (body: string) => {
            const payload: MessagePayload = {
                chatId,
                body,
            }

            const { data } = await axiosInstance.post("/message", payload)

            return data
        },
        {
            onMutate: () => setBody(""),
            onSuccess: () => {
                queryClient.invalidateQueries(["messages"])

                const data = queryClient.getQueryData<
                    InfiniteData<ExtendedMessage>
                >(["messages"])

                //if first message
                if (data?.pages.flatMap((page) => page).length === 1 || !data) {
                    router.refresh()
                }
            },
        }
    )

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (body.length > 0) {
                mutate(body)
            }
        }
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                mutate(body)
            }}
            className="flex h-[var(--message-form-height)] items-center overflow-hidden border-t border-secondary/75 px-4"
        >
            <Button
                type="button"
                variant={"ghost"}
                size={"icon"}
            >
                <Icons.image />
                <span className="sr-only">Attach image</span>
            </Button>
            <TextArea
                onKeyDown={onKeyDown}
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message"
                className="h-[var(--message-form-height)] w-full "
            />
            <Button
                disabled={body.length < 1}
                variant={"ghost"}
                size={"icon"}
            >
                <Icons.send />
                <span className="sr-only">Send message</span>
            </Button>
        </form>
    )
}
