import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"
type ErrorMessageProps = {
    error: string | undefined
} & React.ComponentProps<"p">

function ErrorMessage({ error, className, ...props }: ErrorMessageProps) {
    return error ? (
        <p
            className={cn("mt-2 text-sm text-destructive", className)}
            {...props}
        >
            {error}
        </p>
    ) : null
}

export { Input, ErrorMessage }
