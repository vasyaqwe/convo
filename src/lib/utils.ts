import { ExtendedMessage } from "@/types"
import { type ClassValue, clsx } from "clsx"
import { NextResponse } from "next/server"
import { twMerge } from "tailwind-merge"
import * as z from "zod"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function withErrorHandling(
    handler: (
        req: Request,
        { params }: { params?: any }
    ) => Promise<NextResponse>
) {
    return async function (req: Request, { params }: { params?: any }) {
        try {
            return await handler(req, { params })
        } catch (error) {
            console.log(error)
            if (error instanceof z.ZodError) {
                return new NextResponse(error.message, { status: 422 })
            }

            return new NextResponse("Unknown server error occurred", {
                status: 500,
            })
        }
    }
}

export function formatDate(date: Date | string) {
    let dateObject: Date

    if (typeof date === "string") {
        dateObject = new Date(date)
    } else {
        dateObject = date
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })

    return formatter.format(dateObject)
}
export function reverseArray(arr: any[]) {
    const reversed = arr.reverse()
    return reversed
}

export function addDisplaySender(messages: ExtendedMessage[]) {
    let prevSenderId: string | null = null
    let prevMessageTimestamp: number | null = null

    const newMessages = [...messages].map((message) => {
        if (message.senderId === prevSenderId) {
            const currentTimestamp = new Date(message.createdAt).getTime()
            const timeDiff = currentTimestamp - prevMessageTimestamp!
            if (timeDiff < 5 * 60 * 1000) {
                // 5 minutes in milliseconds
                message.displaySender = false
            } else {
                message.displaySender = true
            }
            prevMessageTimestamp = currentTimestamp // Update timestamp
        } else {
            prevSenderId = message.senderId
            prevMessageTimestamp = new Date(message.createdAt).getTime()
            message.displaySender = true
        }
        return message
    })

    return newMessages
}
