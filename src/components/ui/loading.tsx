import { cn } from "@/lib/utils"

type LoadingProps = React.ComponentProps<"span">

export function Loading({ className, ...props }: LoadingProps) {
    return (
        <span
            className={cn("inline-flex items-center gap-px", className)}
            {...props}
        >
            <span className="mx-px h-[5px] w-[5px] animate-blink rounded-full bg-current"></span>
            <span className="mx-px h-[5px] w-[5px] animate-blink rounded-full bg-current animation-delay-150"></span>
            <span className="mx-px h-[5px] w-[5px] animate-blink rounded-full bg-current animation-delay-300"></span>
        </span>
    )
}
