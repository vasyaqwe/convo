"use client"

import { ExtendedMessage } from "@/types"
import { useEffect } from "react"

type UseDynamicFaviconProps = {
    messages: ExtendedMessage[]
    currentUserId: string
}

export function useDynamicFavicon({
    messages,
    currentUserId,
}: UseDynamicFaviconProps) {
    useEffect(() => {
        const favicon =
            document.querySelector<HTMLAnchorElement>("link[rel='icon']")

        if (!favicon) return

        if (messages.every((m) => m?.seenByIds.includes(currentUserId))) {
            favicon.href = "/favicon.ico"
        } else {
            favicon.href =
                "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACqVVUDiV5iQY1naaKhgYTgq46P/KiMjfWad3jNiGJkf4taWh8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMWVkUkWpspb2nqPrn39//8+/v//Xy8v/08fH/8e3t/9vP0P+ojI3qiWBjZFVVVQMAAAAAAAAAAAAAAAB/WVkUmXV4v9vQ0P/08fH/9fLy//Xy8v/18vL/9fLy//Xy8v/18vL/8u/v/7ynqPuJYmR6fwAAAgAAAAB/f38CkGlrn9rPz//18vL/9PDw/+Tb2//z8PD/9fLy//Xy8v/18vL/9fLy//Xy8v/z8PD/uKCh9ohdYEcAAAAAiF9fOLqjpPn08fH/9PHx/9PFxf+dfH3/tJuc/8y6u//bz8//8/Dw//Xy8v/18vL/9fLy/+3n5/+ad3nIf1VVBo1laZvm3t7/9fLy/9rOzv+zmZr/5Nvb/+LY2P/Txsb/tJyd/6eJi//j2tv/9fLy//Xy8v/18vL/v6ur+oZdXTmggIHX8+/v//Xy8v/Htbb/2MvL//Xy8v/18vL/9fLy/9zQ0P+ff4D/rJCR/+Xe3v/18vL/9fLy/9zQ0P+LYmR3qYyO+fXx8f/18vL/x7W1/9jLy//18vL/9fLy//Xy8v/c0NH/wq6v/+LY2f+ukpT/8/Dw//Xy8v/o4eH/jGVnl6mNjvv08fH/9fLy/9LExP/Aq6z/59/g/+jg4f/o4OH/wq6v/8+/wP/z8PD/qJCe/9DM7f/i4PH/5+Dh/4xkZpWfgIHZ8+/v//Xy8v/z8PD/vKan/6eJiv+3n6D/t5+g/8i1tv/w7O7/p6bw/1ZV6/9PT+//U1Pv/4R92v+FX252jWdol+be3v/18vL/9fLy/9fKyv/HtLX/9fLy//Xy8v/18vL/vLrx/05O7/9MTO//TEzv/0xM7/9MTO7/TkzphYpdYjm5oqP59PHx//Xy8v/t6Oj/qY2O/8u6u//QwMH/z8DC/3Rx5f9MTO//TEzv/0xM7/9MTO//TEzv/0xM7+NVVVUDjmZoodrOz//18vL/9fLy/+vl5f/SxMT/0MDB/82+wv9oZeb/TEzv/0xM7/9MTO//TEzv/0xM7/9LS+/6AAAAAH9ZWRSZdni/3NDR//Tx8f/18vL/9fLy//Xy8v/08fL/kI7w/0xM7/9MTO//TEzv/0xM7/9MTO//S0vvyAAAAAAAAAAAjFlmFI9qbKW9qKj66ODh//Pv7//18fL/9PHx/9nV7f9YVuj/TEzv/0xM7/9MTO//S0vv8ktL8EQAAAAAAAAAAAAAAACqVVUDiV9fQ41pa6KhhITeqY6P+6iKjPSZeHnOd1uMhktL7ptLS+/ITEzvpkxM8DUAAAAA+D8AAOAPAADABwAAgAMAAIABAAAAAQAAAAEAAAAAAAAAAAAAAAEAAAAAAACAAAAAgAAAAMAAAADgAQAA+AMAAA=="
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages])

    return null
}
