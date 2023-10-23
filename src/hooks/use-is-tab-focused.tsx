import { useCallback, useEffect, useState } from "react"

export function useIsTabFocused() {
    const [isTabFocused, setIsTabFocused] = useState(true)

    const onVisibilityChange = useCallback(() => {
        setIsTabFocused(document.visibilityState === "visible")
    }, [])

    useEffect(() => {
        document.addEventListener("visibilitychange", onVisibilityChange)

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { isTabFocused }
}
