"use client"
import { nav } from "@/config"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function MobileNav() {
    const pathname = usePathname()

    return (
        <nav className="xs:px-6 fixed bottom-0 w-full border-t border-secondary/50 px-3 py-3 md:hidden">
            <ul className="flex items-center justify-between gap-3">
                {nav.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <li
                            className="w-full"
                            key={item.label}
                        >
                            {item.href ? (
                                <Button
                                    asChild
                                    data-current={isActive ? "page" : undefined}
                                    variant={"ghost"}
                                    className={`w-full data-[current=page]:bg-secondary `}
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
                                    variant={"ghost"}
                                    className={`w-full `}
                                >
                                    {item.icon}
                                </Button>
                            )}
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
