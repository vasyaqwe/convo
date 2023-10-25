import { Prisma } from "@prisma/client"
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
    viewport:
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
    themeColor: "#000",
    manifest: "/manifest.json",
    icons: {
        apple: "/apple-touch-icon.png",
    },
}
