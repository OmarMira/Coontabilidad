import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

        let variantStyles = "border-transparent bg-blue-600 text-white hover:bg-blue-900/80";

        if (variant === "secondary") {
            variantStyles = "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80";
        } else if (variant === "destructive") {
            variantStyles = "border-transparent bg-red-500 text-white hover:bg-red-500/80";
        } else if (variant === "outline") {
            variantStyles = "text-slate-200 border-slate-700";
        }

        // Allow className to override styles
        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variantStyles} ${className || ''}`}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge }
