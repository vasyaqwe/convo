"use client"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { TextArea } from "@/components/ui/textarea"
import { axiosInstance } from "@/config"
import { MessagePayload } from "@/lib/validations/message"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"

type MessageFormProps = {
    chatId: string
}

export function MessageForm({ chatId }: MessageFormProps) {
    const [body, setBody] = useState("")

    const { mutate } = useMutation(async () => {
        const payload: MessagePayload = {
            chatId,
            body,
        }

        const { data } = await axiosInstance.post("/message", payload)

        return data
    }, {})

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                mutate()
            }}
            className="fixed bottom-0  w-[calc(100%-var(--sidebar-width)-var(--chats-width))]"
        >
            <Button
                type="button"
                className="absolute bottom-3 left-5"
                variant={"ghost"}
                size={"icon"}
            >
                <Icons.image />
                <span className="sr-only">Attach image</span>
            </Button>
            <TextArea
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message"
                className="h-[61px] w-full border-t border-secondary/75 px-20"
            />
            <Button
                disabled={body.length < 1}
                className="absolute bottom-3 right-5"
                variant={"ghost"}
                size={"icon"}
            >
                <Icons.send />
                <span className="sr-only">Send message</span>
            </Button>
        </form>
    )
}
