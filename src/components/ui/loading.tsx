import { cn } from "@/lib/utils"

type LoadingProps = React.ComponentProps<"span">

export function Loading({ className, ...props }: LoadingProps) {
    return (
        <span
            className={cn("inline-flex items-center gap-px", className)}
            {...props}
        >
            <span className="animate-blink mx-px h-1.5 w-1.5 rounded-full bg-current"></span>
            <span className="animate-blink animation-delay-150 mx-px h-1.5 w-1.5 rounded-full bg-current"></span>
            <span className="animate-blink animation-delay-300 mx-px h-1.5 w-1.5 rounded-full bg-current"></span>
        </span>
    )
}
