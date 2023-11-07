import { type PointerEvent, useRef } from "react"

export function useContextMenu() {
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
    const clearLongPress = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }

    function onPointerDown(e: PointerEvent) {
        const wrapper = findNearestScrollableContainer(triggerRef.current)
        const prevScrollPosition = wrapper?.scrollTop
        // console.log(triggerRef?.current?.getBoundingClientRect())

        clearLongPress()
        if (e.pointerType === "mouse") return

        longPressTimerRef.current = setTimeout(() => {
            const wrapper = findNearestScrollableContainer(triggerRef.current)
            const scrollPosition = wrapper?.scrollTop

            if (scrollPosition !== prevScrollPosition) return
            triggerRef?.current?.dispatchEvent(
                new MouseEvent("contextmenu", {
                    bubbles: true,
                    clientX: e.clientX,
                    clientY: e.clientY,
                })
            )
        }, 700)
    }

    function onPointerUp() {
        clearLongPress()
    }

    return { onPointerDown, onPointerUp, triggerRef }
}

function findNearestScrollableContainer(
    element: HTMLElement | null
): HTMLElement | undefined {
    if (!element) {
        return undefined
    }

    let parent = element.parentElement
    while (parent) {
        const { overflow } = window.getComputedStyle(parent)
        if (overflow.split(" ").every((o) => o === "auto" || o === "scroll")) {
            return parent
        }
        parent = parent.parentElement
    }

    return document.documentElement
}
