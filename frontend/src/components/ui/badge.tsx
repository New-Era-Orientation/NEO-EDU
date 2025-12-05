import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const variants = {
            default: "bg-primary/10 text-primary",
            secondary: "bg-muted text-muted-foreground",
            success: "bg-green-500/10 text-green-600 dark:text-green-400",
            warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
            destructive: "bg-red-500/10 text-red-600 dark:text-red-400",
            outline: "border border-border bg-transparent",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);

Badge.displayName = "Badge";

export { Badge };
