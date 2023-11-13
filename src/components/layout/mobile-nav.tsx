"use client"

import { UserProfileDropdown } from "@/components/user-profile-dropdown"
import type { Session } from "next-auth"

export function MobileNav({ session }: { session: Session }) {
    return (
        <nav className="fixed bottom-0 flex h-[var(--message-form-height)] w-full items-center justify-center border-t border-secondary bg-accent px-4 py-2 md:hidden">
            <ul className="flex w-full items-center justify-center">
                {/* <li className="w-full">
                    <Button
                        title={"New Group"}
                        variant={"ghost"}
                        className={`w-full`}
                    >
                        <span className="sr-only">New group</span>
                        <Icons.people />
                    </Button>
                </li> */}

                <li className="flex w-full justify-center">
                    <UserProfileDropdown
                        align="center"
                        session={session}
                    />
                </li>
            </ul>
        </nav>
    )
}
