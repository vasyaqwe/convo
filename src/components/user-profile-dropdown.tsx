import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/ui/icons"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
    DropdownMenuContentProps,
    DropdownMenuProps,
} from "@radix-ui/react-dropdown-menu"
import { Session } from "next-auth"
import { signOut } from "next-auth/react"

type UserProfileDropdownProps = DropdownMenuProps &
    DropdownMenuContentProps & {
        session: Session
    }

export function UserProfileDropdown({
    session,
    side,
    sideOffset,
    ...props
}: UserProfileDropdownProps) {
    return (
        <DropdownMenu {...props}>
            <DropdownMenuTrigger
                className="rounded-full transition-opacity hover:opacity-75 focus-visible:outline-none 
            focus-visible:ring-1 focus-visible:ring-ring"
            >
                <UserAvatar user={session?.user ?? {}} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="center"
                side={side}
                sideOffset={sideOffset}
            >
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
