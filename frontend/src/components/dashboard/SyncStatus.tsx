"use client";

import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, Check } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useSyncState, useOnlineStatus, useSyncActions } from "@/lib/syncHooks";

export function SyncStatusIndicator() {
    const syncState = useSyncState();
    const isOnline = useOnlineStatus();
    const { fullSync, isSyncing } = useSyncActions();

    return (
        <div className="flex items-center gap-2">
            {/* Online/Offline Badge */}
            <div className="flex items-center gap-1 text-xs">
                {isOnline ? (
                    <Badge variant="default" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                        <Wifi className="w-3 h-3" />
                        Online
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        <WifiOff className="w-3 h-3" />
                        Offline
                    </Badge>
                )}
            </div>

            {/* Pending Changes */}
            {syncState.pendingChanges > 0 && (
                <Badge variant="outline" className="gap-1">
                    <CloudOff className="w-3 h-3" />
                    {syncState.pendingChanges} pending
                </Badge>
            )}

            {/* Sync Button */}
            {isOnline && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fullSync}
                    disabled={isSyncing}
                    className="h-7 px-2 text-xs"
                >
                    {isSyncing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : syncState.status === "success" ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                        <Cloud className="w-3.5 h-3.5" />
                    )}
                </Button>
            )}
        </div>
    );
}

export function SyncStatusBar() {
    const syncState = useSyncState();
    const isOnline = useOnlineStatus();
    const { fullSync, isSyncing } = useSyncActions();

    if (isOnline && syncState.pendingChanges === 0 && syncState.status !== "syncing") {
        return null;
    }

    return (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-3 ${!isOnline
            ? "bg-yellow-500/90 text-yellow-950"
            : syncState.status === "syncing"
                ? "bg-blue-500/90 text-white"
                : syncState.pendingChanges > 0
                    ? "bg-orange-500/90 text-white"
                    : "bg-green-500/90 text-white"
            }`}>
            {!isOnline ? (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">You're offline - changes will sync later</span>
                </>
            ) : syncState.status === "syncing" ? (
                <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Syncing...</span>
                </>
            ) : syncState.pendingChanges > 0 ? (
                <>
                    <CloudOff className="w-4 h-4" />
                    <span className="text-sm font-medium">{syncState.pendingChanges} changes pending</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fullSync}
                        disabled={isSyncing}
                        className="h-6 px-2 text-xs"
                    >
                        Sync Now
                    </Button>
                </>
            ) : null}
        </div>
    );
}
