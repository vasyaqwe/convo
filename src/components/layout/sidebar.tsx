"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import { nav } from "@/config"

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside
            className="sticky left-0 top-0 flex h-screen flex-col justify-between 
     border-r border-secondary/50 px-3 pb-5 pt-5 max-md:hidden"
        >
            <nav>
                <ul className="flex flex-col items-start gap-3">
                    {nav.map((item) => {
                        const isActive = pathname === item.href

                        return (
                            <li
                                key={item.label}
                                className="w-full"
                            >
                                {item.href ? (
                                    <Button
                                        asChild
                                        size={"icon"}
                                        data-current={
                                            isActive ? "page" : undefined
                                        }
                                        variant={"ghost"}
                                        className="data-[current=page]:bg-secondary"
                                    >
                                        <Link
                                            title={item.label}
                                            aria-current={
                                                isActive ? "page" : undefined
                                            }
                                            href={item.href}
                                        >
                                            {item.icon}
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        title={item.label}
                                        onClick={item.onClick}
                                        size={"icon"}
                                        variant={"ghost"}
                                    >
                                        {item.icon}
                                    </Button>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    )
}
