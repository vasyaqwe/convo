import { create } from "zustand"

type Chat = {
    id: string
    unseenMessagesCount: number
}

type StoreState = {
    chats: Chat[]
    setChats: (chatId: string, messagesCount: number) => void
    removeChat: (chatId: string) => void
}

export const useTotalMessagesCountStore = create<StoreState>()((set) => ({
    chats: [],
    setChats: (chatId, unseenMessagesCount) => {
        set((state) => {
            if (!state.chats.some((chat) => chat.id === chatId)) {
                return {
                    chats: [
                        ...state.chats,
                        { id: chatId, unseenMessagesCount },
                    ],
                }
            } else {
                return {
                    chats: state.chats.map((prevChat) =>
                        prevChat.id === chatId
                            ? { id: chatId, unseenMessagesCount }
                            : prevChat
                    ),
                }
            }
        })
    },
    removeChat: (chatId) => {
        set((state) => ({
            chats: state.chats.filter((chat) => chat.id !== chatId),
        }))
    },
}))
