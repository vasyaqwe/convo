import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/ui/icons"
import { UserAvatar } from "@/components/ui/user-avatar"
import type {
    DropdownMenuContentProps,
    DropdownMenuProps,
} from "@radix-ui/react-dropdown-menu"
import type { Session } from "next-auth"
import { signOut } from "next-auth/react"

type UserProfileDropdownProps = DropdownMenuProps &
    DropdownMenuContentProps & {
        session: Session
    }

export function UserProfileDropdown({
    session,
    side,
    sideOffset,
    align,
    ...props
}: UserProfileDropdownProps) {
    return (
        <DropdownMenu {...props}>
            <DropdownMenuTrigger
                className="rounded-full transition-opacity hover:opacity-75 focus-visible:outline-none 
            focus-visible:ring-1 focus-visible:ring-ring"
            >
                <UserAvatar user={session.user} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side={side}
                align={align}
                sideOffset={sideOffset}
            >
                <div className="p-1">
                    <p className="font-medium">{session.user.name}</p>
                    <p className="truncate text-sm text-foreground/60">
                        @{session.user.username}
                    </p>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault()
                        signOut()
                    }}
                >
                    <Icons.signOut className="mr-2" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
