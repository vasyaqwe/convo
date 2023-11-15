import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { type RefObject, useEffect, useRef, useState } from "react"
const Date = dynamic(() => import("@/components/date"), { ssr: false })

type DatePillProps = React.ComponentProps<"p"> & {
    messageId: string
    wrapperRef: RefObject<HTMLElement>
    messagesWidthDatesIds: string[]
}

export function DatePill({
    className,
    children,
    messagesWidthDatesIds,
    messageId,
    wrapperRef,
    ...props
}: DatePillProps) {
    const isLast =
        messagesWidthDatesIds[messagesWidthDatesIds.length - 1] === messageId

    const ref = useRef<HTMLParagraphElement | null>(null)
    const [isSticking, setIsSticking] = useState(false)
    const [y, setY] = useState(wrapperRef.current?.scrollHeight ?? 0)
    const [scrollDirection, setScrollDirection] = useState("up")

    useEffect(() => {
        const wrapper = wrapperRef.current

        const onScroll = () => {
            if (!wrapper) return

            const element = ref.current
            const wrapperPadding = window
                .getComputedStyle(wrapper, null)
                .getPropertyValue("padding-bottom")
                .replace("px", "")

            if (element) {
                const rect = element.getBoundingClientRect()
                setIsSticking(rect.top <= +wrapperPadding * 2)
            }

            if (y > wrapper.scrollTop) {
                setScrollDirection("up")
            } else if (y < wrapper.scrollTop) {
                setScrollDirection("down")
            }

            setY(wrapper.scrollTop)
        }

        if (wrapper) wrapper.addEventListener("scroll", onScroll)

        return () => {
            if (wrapper) wrapper.removeEventListener("scroll", onScroll)
        }
    }, [wrapperRef, y])

    const dates = wrapperRef.current?.querySelectorAll<
        HTMLParagraphElement & { dataset: { sticking: "true" | "false" } }
    >("#message-date-pill")

    const stickingPills = Array.from(dates ?? [])
        ?.filter((date) => date.dataset.sticking === "true")
        .map((p) => p.dataset.messageid)

    return (
        <p
            data-sticking={isSticking}
            data-messageid={messageId}
            id="message-date-pill"
            ref={ref}
            className={cn(
                "sticky -top-[1px] left-1/2 z-[2] min-h-[30px] w-fit -translate-x-1/2 rounded-full border border-primary/75 bg-secondary px-3 text-center transition-opacity ",
                className,
                (isSticking && !isLast && scrollDirection === "down") ||
                    stickingPills.slice(0, -1).includes(messageId)
                    ? "pointer-events-none opacity-0"
                    : "pointer-events-auto opacity-100"
            )}
            {...props}
        >
            <Date className="mb-1 inline-block text-[0.85rem]">{children}</Date>
        </p>
    )
}
