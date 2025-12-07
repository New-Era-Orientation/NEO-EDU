"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { syncService, type SyncState, type SyncStatus } from "./sync";

// ============================================
// Hook: Use Sync State
// ============================================
export function useSyncState(): SyncState {
    const [state, setState] = useState<SyncState>({
        status: "idle",
        lastSyncAt: null,
        pendingChanges: 0,
        error: null,
    });

    useEffect(() => {
        return syncService.subscribe(setState);
    }, []);

    return state;
}

// ============================================
// Hook: Use Online Status
// ============================================
export function useOnlineStatus(): boolean {
    const getSnapshot = () => (typeof navigator !== "undefined" ? navigator.onLine : true);
    const getServerSnapshot = () => true;

    const subscribe = (callback: () => void) => {
        window.addEventListener("online", callback);
        window.addEventListener("offline", callback);
        return () => {
            window.removeEventListener("online", callback);
            window.removeEventListener("offline", callback);
        };
    };

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ============================================
// Hook: Use Offline Data
// ============================================
export function useOfflineData<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { refetchOnFocus?: boolean }
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetcher();
                if (!cancelled) {
                    setData(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to fetch");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // Refetch on focus if online
        const handleFocus = () => {
            if (options?.refetchOnFocus && isOnline) {
                fetchData();
            }
        };

        window.addEventListener("focus", handleFocus);
        return () => {
            cancelled = true;
            window.removeEventListener("focus", handleFocus);
        };
    }, [key, isOnline, options?.refetchOnFocus]);

    return { data, loading, error, refetch: () => fetcher().then(setData) };
}

// ============================================
// Sync Actions
// ============================================
export function useSyncActions() {
    const [isSyncing, setIsSyncing] = useState(false);

    const pullFromServer = async () => {
        setIsSyncing(true);
        try {
            await syncService.pullFromServer();
        } finally {
            setIsSyncing(false);
        }
    };

    const pushToServer = async () => {
        setIsSyncing(true);
        try {
            await syncService.pushToServer();
        } finally {
            setIsSyncing(false);
        }
    };

    const fullSync = async () => {
        setIsSyncing(true);
        try {
            await syncService.fullSync();
        } finally {
            setIsSyncing(false);
        }
    };

    return {
        isSyncing,
        pullFromServer,
        pushToServer,
        fullSync,
    };
}
