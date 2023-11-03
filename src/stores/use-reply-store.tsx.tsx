import { ExtendedMessage, UserType } from "@/types"
import { create } from "zustand"

type StoreState = {
    isReplying: boolean
    setIsReplying: (val: boolean) => void
    replyTo: ExtendedMessage | undefined
    setReplyTo: (message: ExtendedMessage) => void
}

export const useReplyStore = create<StoreState>()((set, get) => ({
    isReplying: false,
    replyTo: undefined,
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
