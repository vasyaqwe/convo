import { Icons } from "@/components/ui/icons"
import axios from "axios"
import { signOut } from "next-auth/react"
import { ReactElement } from "react"

export const axiosInstance = axios.create({
    baseURL: "/api",
})

export const nav: {
    label: string
    onClick: () => void
    icon: ReactElement
}[] = [
    { label: "New Group", onClick: () => {}, icon: <Icons.people /> },
    { label: "Settings", onClick: () => {}, icon: <Icons.settings /> },
    { label: "Sign out", onClick: () => signOut(), icon: <Icons.signOut /> },
]

export const MESSAGES_INFINITE_SCROLL_COUNT = 30

export const USERS_SELECT = {
    name: true,
    username: true,
    id: true,
}
