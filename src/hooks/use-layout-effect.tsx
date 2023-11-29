import { useEffect, useLayoutEffect as react_useLayoutEffect } from "react"

export const useLayoutEffect =
    typeof window !== "undefined" ? react_useLayoutEffect : useEffect
