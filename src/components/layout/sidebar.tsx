"use client"

import { Button } from "../ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Icons } from "@/components/ui/icons"
import { UserProfileDropdown } from "@/components/user-profile-dropdown"
import { Session } from "next-auth"

export function Sidebar({ session }: { session: Session }) {
    return (
        <aside
            className="sticky left-0 top-0 flex h-screen w-[var(--sidebar-width)] flex-col justify-between 
     border-r border-secondary px-2 pb-5 pt-5 max-md:hidden"
        >
            <nav className="h-full">
                <ul className="flex h-full flex-col items-center gap-2">
                    <li>
                        <Button
                            title="New Group"
                            size={"icon"}
                            variant={"ghost"}
                        >
                            <span className="sr-only">New group</span>
                            <Icons.people />
                        </Button>
                    </li>
                    <li>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    title="Settings"
                                    size={"icon"}
                                    variant={"ghost"}
                                >
                                    <span className="sr-only">Settings</span>
                                    <Icons.settings />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle
                                        asChild
                                        className="text-2xl font-semibold"
                                    >
                                        <h3>Settings</h3>
                                    </DialogTitle>
                                    <DialogDescription
                                        asChild
                                        className="mt-3 text-sm text-foreground/70"
                                    >
                                        <p>
                                            Edit your public information here.
                                        </p>
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </li>
                    <li className="mt-auto">
                        <UserProfileDropdown
                            side="right"
                            sideOffset={7}
                            session={session}
                        />
                    </li>
                </ul>
            </nav>
        </aside>
    )
}
