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

export function Sidebar() {
    return (
        <aside
            className="sticky left-0 top-0 flex h-screen w-[var(--sidebar-width)] flex-col justify-between 
     border-r border-secondary px-2 pb-5 pt-5 max-md:hidden"
        >
            <nav>
                <ul className="flex flex-col items-start gap-2">
                    <li className="w-full">
                        <Button
                            title="New Group"
                            size={"icon"}
                            variant={"ghost"}
                        >
                            <span className="sr-only">New group</span>
                            <Icons.people />
                        </Button>
                    </li>
                    <li className="w-full">
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
                    <li className="w-full">
                        <Button
                            title="Sign out"
                            size={"icon"}
                            variant={"ghost"}
                        >
                            <span className="sr-only">Sign out</span>
                            <Icons.signOut />
                        </Button>
                    </li>
                </ul>
            </nav>
        </aside>
    )
}
