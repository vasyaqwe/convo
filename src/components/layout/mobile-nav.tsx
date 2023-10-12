"use client"

import { nav } from "@/config"
import { Button } from "@/components/ui/button"

export function MobileNav() {
    return (
        <nav className="fixed bottom-0 w-full border-t border-secondary/50 p-2 md:hidden">
            <ul className="flex items-center justify-between ">
                {nav.map((item) => {
                    return (
                        <li
                            className="w-full"
                            key={item.label}
                        >
                            <Button
                                title={item.label}
                                variant={"ghost"}
                                className={`w-full`}
                            >
                                {item.icon}
                            </Button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
