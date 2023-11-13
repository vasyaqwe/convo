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
import { useState } from "react"
import { Drawer } from "vaul"
import { UserSettingsForm } from "@/components/forms/user-settings-form"

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
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <Drawer.Root
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            shouldScaleBackground
        >
            <DropdownMenu
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
                {...props}
            >
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
                    <Drawer.Trigger asChild>
                        <DropdownMenuItem
                            className="md:hidden"
                            onSelect={(e) => {
                                e.preventDefault()
                                setDropdownOpen(false)
                            }}
                        >
                            <Icons.settings className="mr-2" />
                            Settings
                        </DropdownMenuItem>
                    </Drawer.Trigger>
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
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-lg">
                    <div className="flex-1 rounded-t-lg bg-popover p-4 pb-12">
                        <div className="mx-auto mb-5 h-1.5 w-12 flex-shrink-0 rounded-full bg-primary" />
                        <h3 className="text-2xl font-semibold">Settings</h3>
                        <p className="mt-3 text-sm text-foreground/70">
                            Edit your public information here.
                        </p>
                        <UserSettingsForm
                            closeDialog={() => setDialogOpen(false)}
                            session={session}
                        />
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}
