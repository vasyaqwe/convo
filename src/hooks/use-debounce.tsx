import { useEffect, useState } from "react"

type UseDebounceArgs<T extends string> = {
    value: T
    delay?: number
    delayFirstLetter?: boolean
}

export function useDebounce<T extends string>({
    value,
    delay,
    delayFirstLetter = true,
}: UseDebounceArgs<T>): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(
            () => setDebouncedValue(value),
            value.length === 1 && delayFirstLetter ? 0 : delay ?? 500
        )

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay, delayFirstLetter])

    return debouncedValue
}
