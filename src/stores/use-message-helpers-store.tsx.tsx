import type { ExtendedMessage } from "@/types"
import { create } from "zustand"

type StoreState = {
    isReplying: boolean
    setIsReplying: (val: boolean) => void
    replyTo: ExtendedMessage | undefined
    setReplyTo: (message: ExtendedMessage) => void
    highlightedMessageId: string
    setHighlightedMessageId: (id: string) => void
    highlightedReplyId: string
    setHighlightedReplyId: (id: string) => void
}

export const messagesQueryKey = ["messages"]

let timeout: NodeJS.Timeout | null = null

export const useMessageHelpersStore = create<StoreState>()((set) => ({
    isReplying: false,
    replyTo: undefined,
    highlightedMessageId: "",
    setHighlightedMessageId: (highlightedMessageId) => {
        set(() => ({ highlightedMessageId }))
    },
    highlightedReplyId: "",
    setHighlightedReplyId: (highlightedReplyId) => {
        set(() => ({ highlightedReplyId }))

        if (timeout) {
            clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
            set(() => ({ highlightedReplyId: "" }))
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
        set(() => ({ isReplying: isReplying }))
    },
}))
