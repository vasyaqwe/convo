"use client"

import * as React from "react"
import Textarea, { TextareaAutosizeProps } from "react-textarea-autosize"

import { cn } from "@/lib/utils"

export type TextareaProps = TextareaAutosizeProps

const TextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <Textarea
                onHeightChange={(height) =>
                    document.documentElement.style.setProperty(
                        "--message-form-height",
                        `${height + 2}px`
                    )
                }
                className={cn(
                    "resize-none bg-transparent p-5 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
TextArea.displayName = "TextArea"

export { TextArea }
