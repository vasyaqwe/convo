"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export function Header({}) {
    return (
        <div>
            <Button onClick={() => signOut()}>Sign out</Button>
        </div>
    )
}
