import * as React from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "default" | "lg" | "xl";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, size = "default", ...props }, ref) => {
        const [hasError, setHasError] = React.useState(false);

        const sizes = {
            sm: "h-8 w-8 text-xs",
            default: "h-10 w-10 text-sm",
            lg: "h-12 w-12 text-base",
            xl: "h-16 w-16 text-lg",
        };

        const initials = fallback ? getInitials(fallback) : alt ? getInitials(alt) : "?";

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex shrink-0 overflow-hidden rounded-full",
                    sizes[size],
                    className
                )}
                {...props}
            >
                {src && !hasError ? (
                    <img
                        src={src}
                        alt={alt || "Avatar"}
                        className="aspect-square h-full w-full object-cover"
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center gradient-primary text-white font-medium">
                        {initials}
                    </div>
                )}
            </div>
        );
    }
);

Avatar.displayName = "Avatar";

export { Avatar };
