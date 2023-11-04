"use client"

import { UserSettingsForm } from "@/components/forms/user-settings-form"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { UserProfileDropdown } from "@/components/user-profile-dropdown"
import type { Session } from "next-auth"
import { useState } from "react"
import { Drawer } from "vaul"

export function MobileNav({ session }: { session: Session }) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <nav className="fixed bottom-0 flex h-[var(--message-form-height)] w-full items-center justify-center border-t border-secondary bg-accent px-4 py-2 md:hidden">
            <ul className="flex w-full items-center justify-between">
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

                <li className="flex w-full justify-center">
                    <UserProfileDropdown
                        align="center"
                        session={session}
                    />
                </li>
                <li className="w-full">
                    <Drawer.Root
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        shouldScaleBackground
                    >
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
                            <Drawer.Content className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-lg">
                                <div className="flex-1 rounded-t-lg bg-popover p-4 pb-12">
                                    <div className="mx-auto mb-5 h-1.5 w-12 flex-shrink-0 rounded-full bg-primary" />
                                    <h3 className="text-2xl font-semibold">
                                        Settings
                                    </h3>
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
                </li>
            </ul>
        </nav>
    )
}
