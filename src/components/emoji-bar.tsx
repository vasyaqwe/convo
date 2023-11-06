import { emojis } from "@/config"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"

type EmojiBarProps = {
    onEmojiClick: (emoji: (typeof emojis)[number]) => void
}

export function EmojiBar({ onEmojiClick }: EmojiBarProps) {
    const ref = useRef<HTMLDivElement | null>(null)
    const [scrollPosition, setScrollPosition] = useState("top")
    const [prevScrollPos, setPrevScrollPos] = useState(0)

    const onScroll = () => {
        const container = ref.current
        if (container) {
            const currentScrollPos = container.scrollTop

            if (currentScrollPos > prevScrollPos) {
                setScrollPosition("down")
            } else if (currentScrollPos < prevScrollPos) {
                setScrollPosition("up")
            }

            setPrevScrollPos(currentScrollPos)
        }
    }

    return (
        <div
            className={cn(
                `group relative overflow-hidden rounded-full
             bg-secondary transition-transform duration-300 before:pointer-events-none before:absolute before:bottom-0
             before:left-0 before:z-[1] before:h-8 before:w-full before:bg-gradient-to-b before:from-black/0 before:to-background/80
             after:pointer-events-none after:absolute after:left-0
             after:top-0 after:z-[1] after:h-8 after:w-full after:bg-gradient-to-t after:from-black/0 after:to-background/80
             `,
                scrollPosition === "down" ? "before:hidden" : "after:hidden"
            )}
        >
            <div
                onScroll={onScroll}
                ref={ref}
                className="emoji-bar flex h-52 flex-col overflow-y-auto p-2"
            >
                {emojis.map((e) => (
                    <span
                        onClick={() => onEmojiClick(e)}
                        role="button"
                        className="mt-2 text-lg transition-transform duration-300 first:mt-0 hover:scale-[140%]"
                        key={e}
                    >
                        {e}
                    </span>
                ))}
            </div>
        </div>
    )
}
