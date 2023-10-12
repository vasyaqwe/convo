"use client"

import { Button } from "../ui/button"
import { nav } from "@/config"

export function Sidebar() {
    return (
        <aside
            className="sticky left-0 top-0 flex h-screen w-[var(--sidebar-width)] flex-col justify-between 
     border-r border-secondary/75 px-2 pb-5 pt-5 max-md:hidden"
        >
            <nav>
                <ul className="flex flex-col items-start gap-2">
                    {nav.map((item) => {
                        return (
                            <li
                                key={item.label}
                                className="w-full"
                            >
                                <Button
                                    title={item.label}
                                    onClick={item.onClick}
                                    size={"icon"}
                                    variant={"ghost"}
                                >
                                    {item.icon}
                                </Button>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    )
}
