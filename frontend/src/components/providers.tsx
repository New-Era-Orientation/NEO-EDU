"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time of 5 minutes for offline-first approach
                        staleTime: 5 * 60 * 1000,
                        // Cache for 30 minutes
                        gcTime: 30 * 60 * 1000,
                        // Retry 3 times with exponential backoff
                        retry: 3,
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                        // Refetch on window focus for fresh data
                        refetchOnWindowFocus: true,
                        // Don't refetch on reconnect if data is fresh
                        refetchOnReconnect: "always",
                    },
                    mutations: {
                        retry: 2,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
