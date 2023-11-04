import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type ComponentProps, type ReactNode, useRef } from "react"

type FileButtonProps = ComponentProps<"input"> & {
    children: ReactNode
    disabled: boolean
}

export const FileButton = ({
    className = "",
    children,
    disabled = false,
    ...props
}: FileButtonProps) => {
    const inputRef = useRef<HTMLInputElement>(null)

    const onKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            inputRef.current?.click()
        }
    }

    return (
        <label
            aria-disabled={disabled}
            onKeyDown={onKeyDown}
            role="button"
            aria-controls="image"
            tabIndex={0}
            htmlFor="image"
            className={cn(
                "aria-disabled:pointer-events-none aria-disabled:opacity-70",
                buttonVariants({ variant: "ghost", size: "icon" }),
                className
            )}
        >
            <input
                ref={inputRef}
                name="image"
                id="image"
                type="file"
                className={`hidden`}
                {...props}
            />
            {children}
        </label>
    )
}
