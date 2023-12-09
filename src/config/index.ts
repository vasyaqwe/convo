import type { Prisma } from "@prisma/client"
import axios from "axios"

export const axiosInstance = axios.create({
    baseURL: "/api",
})

export const MESSAGES_INFINITE_SCROLL_COUNT = 30

export const USERS_SELECT: Prisma.UserSelect = {
    name: true,
    username: true,
    id: true,
    image: true,
}

export const metadataConfig = {
    title: "convo.",
    description: "convo is a modern messaging app. Built with Next.js 13.",
    manifest: "/manifest.json",
    icons: {
        apple: "/apple-touch-icon.png",
    },
}

export const viewportConfig = {
    themeColor: "#000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
}

export const REACTION_SELECT = {
    body: true,
    id: true,
    messageId: true,
    sender: {
        select: USERS_SELECT,
    },
}

export const MESSAGE_INCLUDE = {
    sender: {
        select: USERS_SELECT,
    },
    seenBy: {
        select: USERS_SELECT,
    },
    replyTo: {
        include: {
            sender: {
                select: USERS_SELECT,
            },
        },
    },
    reactions: {
        select: REACTION_SELECT,
    },
    replies: {
        select: {
            id: true,
        },
    },
}

export const emojis = [
    "❤️",
    "🔥",
    "💀",
    "🥲",
    "🫡",
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😎",
    "🤓",
    "🧐",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "🤭",
    "🤫",
    "🤥",
    "😶",
    "😐",
    "😑",
    "😬",
    "🙄",
    "😯",
    "😦",
    "😧",
    "😮",
    "😲",
    "🥱",
    "😴",
    "🤤",
    "😪",
    "😵",
    "🤐",
    "🥴",
    "🤢",
    "🤮",
    "🤧",
    "😷",
    "🤒",
    "🤕",
    "🤠",
    "😈",
    "👿",
    "👹",
    "👺",
    "👻",
    "👽",
    "👾",
    "🤖",
    "💩",
    "🥳",
] as const
