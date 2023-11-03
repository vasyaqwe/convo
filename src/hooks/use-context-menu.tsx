import { PointerEvent, useRef } from "react"

export function useContextMenu() {
    const triggerRef = useRef<HTMLSpanElement | null>(null)
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
    const clearLongPress = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }

    function onPointerDown(e: PointerEvent) {
        clearLongPress()
        if (e.pointerType === "mouse") return

        longPressTimerRef.current = setTimeout(() => {
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
