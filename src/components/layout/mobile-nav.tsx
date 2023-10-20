"use client"

import { UserSettingsForm } from "@/components/forms/user-settings-form"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { Drawer } from "vaul"

export function MobileNav() {
    return (
        <nav className="fixed bottom-0  w-full border-t border-secondary p-2 md:hidden">
            <ul className="flex items-center justify-between ">
                <li className="w-full">
                    <Button
                        title={"New Group"}
                        variant={"ghost"}
                        className={`w-full`}
                    >
                        <span className="sr-only">New group</span>
                        <Icons.people />
                    </Button>
                </li>
                <li className="w-full">
                    <Drawer.Root shouldScaleBackground>
                        <Drawer.Trigger asChild>
                            <Button
                                title={"Settings"}
                                variant={"ghost"}
                                className={`w-full`}
                            >
                                <Icons.settings />
                                <span className="sr-only">Settings</span>
                            </Button>
                        </Drawer.Trigger>
                        <Drawer.Portal>
                            <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                            <Drawer.Content className="fixed bottom-0 left-0 right-0 top-[var(--header-height)] flex h-[96%] flex-col rounded-t-lg">
                                <div className="flex-1 rounded-t-lg bg-popover p-4">
                                    <div className="mx-auto mb-5 h-1.5 w-12 flex-shrink-0 rounded-full bg-primary" />
                                    <h3 className="text-2xl font-semibold">
                                        Settings
                                    </h3>
                                    <p className="mt-3 text-sm text-foreground/70">
                                        Edit your public information here.
                                    </p>
                                    <UserSettingsForm />
                                </div>
                            </Drawer.Content>
                        </Drawer.Portal>
                    </Drawer.Root>
                </li>
                <li className="w-full">
                    <Button
                        title={"Sign out"}
                        variant={"ghost"}
                        className={`w-full`}
                    >
                        <span className="sr-only">Sign out</span>
                        <Icons.signOut />
                    </Button>
                </li>
            </ul>
        </nav>
    )
}
