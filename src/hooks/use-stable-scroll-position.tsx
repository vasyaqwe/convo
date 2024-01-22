import { useRef, useLayoutEffect, useMemo } from "react"

export const useStableScrollPosition = <T,>(data: T) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const previousScrollPosition = useRef(0)

    useMemo(() => {
        if (wrapperRef?.current) {
            const wrapper = wrapperRef?.current
            previousScrollPosition.current =
                wrapper?.scrollHeight - wrapper?.scrollTop
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    useLayoutEffect(() => {
        if (wrapperRef?.current) {
            const wrapper = wrapperRef?.current || {}
            wrapper.scrollTop =
                wrapper?.scrollHeight - previousScrollPosition.current
        }
    }, [data])

    return {
        wrapperRef,
    }
}
