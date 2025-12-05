import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
    max?: number;
    showLabel?: boolean;
    size?: "sm" | "default" | "lg";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value, max = 100, showLabel = false, size = "default", ...props }, ref) => {
        const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

        const sizes = {
            sm: "h-1",
            default: "h-2",
            lg: "h-3",
        };

        return (
            <div className={cn("w-full", className)} ref={ref} {...props}>
                <div
                    className={cn(
                        "w-full overflow-hidden rounded-full bg-muted",
                        sizes[size]
                    )}
                >
                    <div
                        className="h-full gradient-primary transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {showLabel && (
                    <span className="mt-1 text-xs text-muted-foreground">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
        );
    }
);

Progress.displayName = "Progress";

export { Progress };
