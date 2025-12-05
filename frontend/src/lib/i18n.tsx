"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

// ============================================
// Types
// ============================================
export type Locale = "en" | "vi";

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = typeof en;

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale, sync?: boolean) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    isLoading: boolean;
    loadFromServer: () => Promise<void>;
}

// ============================================
// Translations Map
// ============================================
const translations: Record<Locale, Translations> = {
    en,
    vi,
};

// ============================================
// Helper: Get nested value from object
// ============================================
function getNestedValue(obj: TranslationValue, path: string): string {
    const keys = path.split(".");
    let result: TranslationValue = obj;

    for (const key of keys) {
        if (result && typeof result === "object" && key in result) {
            result = result[key];
        } else {
            return path; // Return key if not found
        }
    }

    return typeof result === "string" ? result : path;
}

// ============================================
// Storage Keys
// ============================================
const LOCALE_STORAGE_KEY = "neo-edu-locale";

// ============================================
// Context
// ============================================
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// ============================================
// Lazy imports for API
// ============================================
const getApi = () => import("@/lib/api").then(m => m.api);
const getAuthStore = () => import("@/stores").then(m => m.useAuthStore);

// ============================================
// Provider
// ============================================
export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("vi"); // Default to Vietnamese
    const [isLoading, setIsLoading] = useState(true);

    // Initialize locale from localStorage only
    useEffect(() => {
        try {
            const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
            if (savedLocale && (savedLocale === "en" || savedLocale === "vi")) {
                setLocaleState(savedLocale);
            }
            // If no saved preference, keep default (vi)
        } catch (error) {
            console.error("Failed to load locale:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Set locale and save to localStorage, optionally sync to server
    const setLocale = useCallback(async (newLocale: Locale, sync = true) => {
        setLocaleState(newLocale);
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);

        // Sync to server if authenticated
        if (sync) {
            try {
                const authStore = await getAuthStore();
                if (authStore.getState().isAuthenticated) {
                    const api = await getApi();
                    await api.updatePreferences({ language: newLocale });
                }
            } catch (error) {
                console.error("Failed to sync language to server:", error);
            }
        }
    }, []);

    // Load locale from server (called after login)
    const loadFromServer = useCallback(async () => {
        try {
            const api = await getApi();
            const { preferences } = await api.getPreferences();
            if (preferences.language && (preferences.language === "en" || preferences.language === "vi")) {
                setLocaleState(preferences.language);
                localStorage.setItem(LOCALE_STORAGE_KEY, preferences.language);
            }
        } catch (error) {
            console.error("Failed to load language from server:", error);
        }
    }, []);

    // Translation function
    const t = useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            const translation = getNestedValue(translations[locale], key);

            if (!params) return translation;

            // Replace placeholders: {{name}} -> value
            return translation.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
                return String(params[paramKey] ?? `{{${paramKey}}}`);
            });
        },
        [locale]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, isLoading, loadFromServer }}>
            {children}
        </I18nContext.Provider>
    );
}

// ============================================
// Hook
// ============================================
export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}

// ============================================
// Language Names
// ============================================
export const languageNames: Record<Locale, string> = {
    en: "English",
    vi: "Tiếng Việt",
};

export const locales: Locale[] = ["vi", "en"];
