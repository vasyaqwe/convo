import { useEffect, useState } from "react"

export function useDebounce<T extends string>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(
            () => setDebouncedValue(value),
            value.length === 1 ? 0 : delay || 500
        )

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}
