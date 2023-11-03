import { ExtendedMessage } from "@/types"
import { create } from "zustand"

type StoreState = {
    isReplying: boolean
    setIsReplying: (val: boolean) => void
    replyTo: ExtendedMessage | undefined
    setReplyTo: (message: ExtendedMessage) => void
    highlightedMessageId: string
    setHighlightedMessageId: (id: string) => void
}

let timeout: NodeJS.Timeout | null = null

export const useReplyStore = create<StoreState>()((set, get) => ({
    isReplying: false,
    replyTo: undefined,
    highlightedMessageId: "",
    setHighlightedMessageId: (highlightedMessageId) => {
        set(() => ({ highlightedMessageId }))

        if (timeout) {
            clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
            set(() => ({ highlightedMessageId: "" }))
        }, 1500)
    },
    setReplyTo: (replyTo) => {
        set(() => ({ replyTo }))
    },
    setIsReplying: (isReplying) => {
        if (isReplying) {
            document.documentElement.style.setProperty(
                "--message-form-reply-height",
                `60px`
            )
        } else {
            document.documentElement.style.setProperty(
                "--message-form-reply-height",
                `0px`
            )
        }
        set(() => ({ isReplying }))
    },
}))
