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
