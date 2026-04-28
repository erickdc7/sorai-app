"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { updateUserProfile } from "@/lib/user-profile";
import type { SupabaseClient } from "@supabase/supabase-js";

interface PreferencesSectionProps {
    supabase: SupabaseClient;
    userId: string;
    showSensitiveContent: boolean;
    refreshProfile: () => Promise<void>;
}

export default function PreferencesSection({
    supabase,
    userId,
    showSensitiveContent,
    refreshProfile,
}: PreferencesSectionProps) {
    const [sensitive, setSensitive] = useState(showSensitiveContent);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSensitive(showSensitiveContent);
    }, [showSensitiveContent]);

    const handleToggle = async () => {
        const newValue = !sensitive;
        setSensitive(newValue);
        setSaving(true);
        try {
            await updateUserProfile(supabase, userId, {
                show_sensitive_content: newValue,
            });
            await refreshProfile();
            toast.success(newValue ? "Sensitive content enabled" : "Sensitive content disabled");
        } catch {
            setSensitive(!newValue);
            toast.error("Failed to update preference");
        }
        setSaving(false);
    };

    return (
        <section className="bg-surface rounded-2xl border border-border p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                Preferences
            </h2>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-text-primary font-medium">
                        Sensitive Content
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                        Show anime with mature or explicit content
                    </p>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={saving}
                    className="relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    style={{
                        backgroundColor: sensitive
                            ? "var(--color-primary)"
                            : "var(--color-text-disabled)",
                    }}
                >
                    <span
                        className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200"
                        style={{
                            transform: sensitive ? "translateX(20px)" : "translateX(0)",
                        }}
                    />
                </button>
            </div>
        </section>
    );
}
