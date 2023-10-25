type DateProps = React.ComponentProps<"small">

export default function Date({ children, ...props }: DateProps) {
    return <small {...props}>{children}</small>
}
