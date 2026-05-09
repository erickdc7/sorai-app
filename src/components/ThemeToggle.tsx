"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-surface-alt transition-colors">
                <span className="w-4 h-4" />
            </button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-surface-alt transition-colors"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? (
                <Sun size={16} className="text-text-secondary" />
            ) : (
                <Moon size={16} className="text-text-secondary" />
            )}
        </button>
    );
}
