import { emojis } from "@/config"
import { cn } from "@/lib/utils"
import {
    type ComponentProps,
    useState,
    type CSSProperties,
    useEffect,
} from "react"
import { FixedSizeList as List, type ListOnScrollProps } from "react-window"
import { FixedSizeGrid as Grid } from "react-window"

type EmojiBarProps = {
    onEmojiClick: (emoji: (typeof emojis)[number]) => void
    direction?: "vertical" | "horizontal"
} & ComponentProps<"div">

const GRID_COLUMNS = 6

export function EmojiPicker({
    onEmojiClick,
    className,
    direction = "vertical",
    ...props
}: EmojiBarProps) {
    const [scrollDirection, setScrollDirection] = useState<
        "backward" | "forward"
    >("backward")

    const onScroll = (props: ListOnScrollProps) => {
        setScrollDirection(props.scrollDirection)
    }

    useEffect(() => {
        setScrollDirection("backward")
    }, [])

    const Item = ({
        index,
        style,
    }: {
        index: number
        style: CSSProperties
    }) => (
        <button
            onClick={() => {
                if (emojis[index]) onEmojiClick(emojis[index]!)
            }}
            className={cn(
                "text-lg transition-transform hover:scale-125",
                direction === "vertical" ? "mt-2" : ""
            )}
            style={style}
        >
            {emojis[index]}
        </button>
    )

    const Cell = ({
        columnIndex,
        rowIndex,
        style,
    }: {
        columnIndex: number
        rowIndex: number
        style: CSSProperties
    }) => {
        const index = rowIndex * GRID_COLUMNS + columnIndex

        return (
            <button
                onClick={() => {
                    if (emojis[index]) onEmojiClick(emojis[index]!)
                }}
                className={cn(
                    "text-2xl transition-transform hover:scale-125",
                    direction === "vertical" ? "mt-2" : ""
                )}
                style={style}
            >
                {emojis[index]}
            </button>
        )
    }

    return (
        <div
            className={cn(
                `group relative rounded-full
             bg-popover transition-transform duration-300 before:pointer-events-none before:absolute before:bottom-0
             before:left-0 before:z-[1] before:h-8 before:w-full before:bg-gradient-to-b before:from-black/0 before:to-background/80
             after:pointer-events-none after:absolute after:left-0
             after:top-0 after:z-[1] after:h-8 after:w-full after:bg-gradient-to-t after:from-black/0 after:to-background/80
             `,
                className,
                direction === "horizontal"
                    ? "before:hidden after:hidden"
                    : "overflow-hidden",
                scrollDirection === "forward" ? "before:hidden" : "after:hidden"
            )}
            {...props}
        >
            {direction === "horizontal" ? (
                <Grid
                    columnCount={GRID_COLUMNS}
                    columnWidth={40}
                    height={150}
                    rowCount={Math.ceil(emojis.length / GRID_COLUMNS)}
                    rowHeight={40}
                    className={cn("emoji-bar flex overflow-y-auto p-2")}
                    width={250}
                >
                    {Cell}
                </Grid>
            ) : (
                <List
                    height={200}
                    itemCount={emojis.length}
                    itemSize={30}
                    width={40}
                    onScroll={onScroll}
                    layout={direction}
                    className={cn(
                        "emoji-bar no-scrollbar flex h-52 flex-col overflow-y-auto p-2"
                    )}
                >
                    {Item}
                </List>
            )}
        </div>
    )
}
