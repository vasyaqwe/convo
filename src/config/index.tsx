import { Icons } from "@/components/ui/icons"
import axios from "axios"
import { signOut } from "next-auth/react"
import { ReactElement } from "react"

export const axiosInstance = axios.create({
    baseURL: "/api",
})

export const nav: {
    label: string
    href?: string
    onClick?: () => void
    icon: ReactElement
}[] = [
    { label: "Chats", href: "/", icon: <Icons.chats /> },
    { label: "Friends", href: "/friends", icon: <Icons.friends /> },
    { label: "Sign out", onClick: () => signOut(), icon: <Icons.signOut /> },
]
