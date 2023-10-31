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

export function formatDateToTimestamp(date: Date | string) {
    let dateObject: Date

    if (typeof date === "string") {
        dateObject = new Date(date)
    } else {
        dateObject = date
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(dateObject)
}

export function formatDate(
    date: Date | string,
    month: "long" | "short",
    formatTodayToTimestamp = true
) {
    let dateObject: Date

    if (typeof date === "string") {
        dateObject = new Date(date)
    } else {
        dateObject = date
    }

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    const beforeYesterday = new Date(now)
    beforeYesterday.setDate(now.getDate() - 2)

    if (dateObject.toDateString() === now.toDateString()) {
        if (formatTodayToTimestamp) {
            return new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }).format(dateObject)
        }

        return "Today"
    } else if (dateObject.toDateString() === yesterday.toDateString()) {
        return "Yesterday"
    } else {
        return new Intl.DateTimeFormat("en-US", {
            month,
            day: "numeric",
        }).format(dateObject)
    }
}

export function reverseArray<T>(arr: T[]) {
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

export function groupByDate<T extends Record<string, any>>(arr: T[]) {
    let prevDate: string | null = null

    return arr.map((item) => {
        const currentDate = formatDate(item.createdAt, "long", false)
        if (currentDate !== prevDate) {
            prevDate = currentDate
            return { ...item, dateAbove: currentDate }
        }
        return item
    }) as (T & { dateAbove: string | undefined })[]
}
