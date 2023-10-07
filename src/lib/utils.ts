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
            if (error instanceof z.ZodError) {
                return new NextResponse(error.message, { status: 422 })
            }

            return new NextResponse("Unknown server error occurred", {
                status: 500,
            })
        }
    }
}
