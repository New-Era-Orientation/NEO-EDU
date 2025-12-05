import { cn } from "@/lib/utils";

interface LoadingProps {
    size?: "sm" | "default" | "lg";
    className?: string;
    text?: string;
}

export function Loading({ size = "default", className, text }: LoadingProps) {
    const sizes = {
        sm: "h-4 w-4",
        default: "h-8 w-8",
        lg: "h-12 w-12",
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <div className={cn("relative", sizes[size])}>
                <div className="absolute inset-0 rounded-full border-2 border-muted" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
            {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
    );
}

export function LoadingPage({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Loading size="lg" text={text} />
        </div>
    );
}

export function LoadingSkeleton({ className }: { className?: string }) {
    return <div className={cn("skeleton rounded-lg", className)} />;
}
