"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Camera,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Download,
    AlertTriangle,
    Loader2,
    Check,
    Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import {
    uploadAvatar,
    removeAvatar,
    updateUserProfile,
    exportUserData,
    deactivateAccount,
} from "@/lib/user-profile";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";

export default function SettingsPage() {
    const router = useRouter();
    const { user, username, isLoading: authLoading, profile, refreshProfile } = useAuth();
    const [supabase] = useState(() => createClient());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [sensitiveContent, setSensitiveContent] = useState(false);

    // Loading states
    const [savingUsername, setSavingUsername] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [savingSensitive, setSavingSensitive] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

    // Init form values from user
    useEffect(() => {
        if (user) {
            setNewUsername(user.user_metadata?.username || "");
            setNewEmail(user.email || "");
        }
    }, [user]);

    useEffect(() => {
        if (profile) {
            setSensitiveContent(profile.show_sensitive_content);
        }
    }, [profile]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [authLoading, user, router]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <AuthModal />
                <main className="max-w-2xl mx-auto px-6 py-10">
                    <div className="h-8 skeleton w-48 mb-8" />
                    <div className="space-y-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-40 skeleton rounded-2xl" />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    const avatarUrl = profile?.avatar_url || null;
    const initial = (username?.[0] || "U").toUpperCase();

    // ── Handlers ──

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type", { description: "Use JPG, PNG, WebP, or GIF." });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File too large", { description: "Max file size is 2MB." });
            return;
        }

        setUploadingAvatar(true);
        try {
            await uploadAvatar(supabase, user.id, file);
            await refreshProfile();
            toast.success("Profile photo updated");
        } catch {
            toast.error("Failed to upload photo");
        }
        setUploadingAvatar(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveAvatar = async () => {
        setUploadingAvatar(true);
        try {
            await removeAvatar(supabase, user.id);
            await refreshProfile();
            toast.success("Profile photo removed");
        } catch {
            toast.error("Failed to remove photo");
        }
        setUploadingAvatar(false);
    };

    const handleSaveUsername = async () => {
        if (!newUsername.trim()) {
            toast.error("Username cannot be empty");
            return;
        }
        if (newUsername.trim() === username) return;

        setSavingUsername(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { username: newUsername.trim() },
            });
            if (error) throw error;
            toast.success("Username updated");
        } catch {
            toast.error("Failed to update username");
        }
        setSavingUsername(false);
    };

    const handleSaveEmail = async () => {
        if (!newEmail.trim()) {
            toast.error("Email cannot be empty");
            return;
        }
        if (newEmail.trim() === user.email) return;

        setSavingEmail(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/update-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ email: newEmail.trim() }),
            });
            const result = await res.json();
            if (!res.ok) {
                toast.error("Failed to update email", {
                    description: result.error || "Unknown error",
                });
            } else {
                toast.success("Email updated successfully");
                // Refresh session to get updated email
                await supabase.auth.refreshSession();
            }
        } catch {
            toast.error("Failed to update email");
        }
        setSavingEmail(false);
    };

    const handleSavePassword = async () => {
        if (!newPassword) {
            toast.error("Password cannot be empty");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password too short", { description: "Minimum 6 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        setSavingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
            toast.success("Password updated");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            toast.error("Failed to update password");
        }
        setSavingPassword(false);
    };

    const handleToggleSensitive = async () => {
        const newValue = !sensitiveContent;
        setSensitiveContent(newValue);
        setSavingSensitive(true);
        try {
            await updateUserProfile(supabase, user.id, {
                show_sensitive_content: newValue,
            });
            await refreshProfile();
            toast.success(newValue ? "Sensitive content enabled" : "Sensitive content disabled");
        } catch {
            setSensitiveContent(!newValue);
            toast.error("Failed to update preference");
        }
        setSavingSensitive(false);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const jsonData = await exportUserData(supabase, user.id);
            if (!jsonData) {
                toast.error("Your list is empty", {
                    description: "Add some anime to your list before exporting.",
                });
                setExporting(false);
                return;
            }
            const blob = new Blob([jsonData], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sorai-my-list-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Data exported", { description: "Your anime list has been downloaded." });
        } catch {
            toast.error("Failed to export data");
        }
        setExporting(false);
    };

    const handleDeactivate = async () => {
        setDeactivating(true);
        try {
            await deactivateAccount(supabase, user.id);
            await supabase.auth.signOut();
            toast.success("Account deactivated", {
                description: "Your account has been deactivated. Contact support to reactivate.",
            });
            router.push("/");
        } catch {
            toast.error("Failed to deactivate account");
        }
        setDeactivating(false);
        setShowDeactivateConfirm(false);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AuthModal />

            <main className="max-w-2xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-surface-alt transition-colors"
                    >
                        <ArrowLeft size={18} className="text-text-secondary" />
                    </button>
                    <h1
                        className="text-3xl text-text-primary"
                        style={{ fontFamily: "var(--font-bebas-neue), sans-serif" }}
                    >
                        Settings
                    </h1>
                </div>

                <div className="space-y-6">
                    {/* ── Profile Photo ── */}
                    <section className="bg-surface rounded-2xl border border-border p-6">
                        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <Camera size={16} className="text-primary" />
                            Profile Photo
                        </h2>
                        <div className="flex items-start gap-5">
                            <div className="relative">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="w-28 h-28 rounded-2xl object-cover border-2 border-border"
                                    />
                                ) : (
                                    <div
                                        className="w-28 h-28 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                                        style={{
                                            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-medium))",
                                        }}
                                    >
                                        {initial}
                                    </div>
                                )}
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                                        <Loader2 size={20} className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="px-4 h-9 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{
                                        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-medium))",
                                    }}
                                >
                                    Upload photo
                                </button>
                                {avatarUrl && (
                                    <button
                                        onClick={handleRemoveAvatar}
                                        disabled={uploadingAvatar}
                                        className="px-4 h-9 text-sm text-text-secondary border border-border rounded-xl hover:bg-surface-alt transition-colors disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                )}
                                <p className="text-xs text-text-secondary">JPG, PNG, WebP or GIF. Max 2MB.</p>
                            </div>
                        </div>
                    </section>

                    {/* ── Account ── */}
                    <section className="bg-surface rounded-2xl border border-border p-6">
                        <h2 className="text-sm font-semibold text-text-primary mb-5 flex items-center gap-2">
                            <User size={16} className="text-primary" />
                            Account
                        </h2>
                        <div className="space-y-5">
                            {/* Username */}
                            <div>
                                <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                    Username
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="flex-1 h-10 px-4 bg-surface-hover rounded-xl border border-border text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
                                    />
                                    <button
                                        onClick={handleSaveUsername}
                                        disabled={savingUsername || newUsername.trim() === username}
                                        className="px-4 h-10 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                        style={{
                                            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-medium))",
                                        }}
                                    >
                                        {savingUsername ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Check size={14} />
                                        )}
                                        Save
                                    </button>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={13} />
                                        Email
                                    </div>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="flex-1 h-10 px-4 bg-surface-hover rounded-xl border border-border text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
                                    />
                                    <button
                                        onClick={handleSaveEmail}
                                        disabled={savingEmail || newEmail.trim() === user.email}
                                        className="px-4 h-10 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                        style={{
                                            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-medium))",
                                        }}
                                    >
                                        {savingEmail ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Check size={14} />
                                        )}
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Password ── */}
                    <section className="bg-surface rounded-2xl border border-border p-6">
                        <h2 className="text-sm font-semibold text-text-primary mb-5 flex items-center gap-2">
                            <Lock size={16} className="text-primary" />
                            Password
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full h-10 px-4 pr-10 bg-surface-hover rounded-xl border border-border text-sm text-text-primary placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat new password"
                                        className="w-full h-10 px-4 pr-10 bg-surface-hover rounded-xl border border-border text-sm text-text-primary placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleSavePassword}
                                disabled={savingPassword || !newPassword || !confirmPassword}
                                className="px-5 h-10 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2 mt-2"
                                style={{
                                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-medium))",
                                }}
                            >
                                {savingPassword ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Lock size={14} />
                                )}
                                Update Password
                            </button>
                        </div>
                    </section>

                    {/* ── Preferences ── */}
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
                                onClick={handleToggleSensitive}
                                disabled={savingSensitive}
                                className="relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                                style={{
                                    backgroundColor: sensitiveContent
                                        ? "var(--color-primary)"
                                        : "var(--color-text-disabled)",
                                }}
                            >
                                <span
                                    className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200"
                                    style={{
                                        transform: sensitiveContent
                                            ? "translateX(20px)"
                                            : "translateX(0)",
                                    }}
                                />
                            </button>
                        </div>
                    </section>

                    {/* ── Export Data ── */}
                    <section className="bg-surface rounded-2xl border border-border p-6">
                        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <Download size={16} className="text-primary" />
                            Your Data
                        </h2>
                        <p className="text-sm text-text-secondary mb-4">
                            Download your anime list as a JSON file including titles, status, scores, and dates.
                        </p>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="px-5 h-10 text-sm font-medium text-primary border-2 border-primary rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {exporting ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Download size={14} />
                            )}
                            Export Anime List
                        </button>
                    </section>

                    {/* ── Danger Zone ── */}
                    <section
                        className="rounded-2xl border-2 p-6"
                        style={{ borderColor: "var(--color-error)" }}
                    >
                        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-error)" }}>
                            <AlertTriangle size={16} />
                            Danger Zone
                        </h2>
                        <p className="text-sm text-text-secondary mb-4">
                            Deactivating your account will sign you out and hide your profile. Your data will be preserved and you can reactivate by contacting support.
                        </p>

                        {!showDeactivateConfirm ? (
                            <button
                                onClick={() => setShowDeactivateConfirm(true)}
                                className="px-5 h-10 text-sm font-medium rounded-xl border-2 transition-colors flex items-center gap-2"
                                style={{
                                    color: "var(--color-error)",
                                    borderColor: "var(--color-error)",
                                }}
                            >
                                <AlertTriangle size={14} />
                                Deactivate Account
                            </button>
                        ) : (
                            <div
                                className="rounded-xl p-4 space-y-3"
                                style={{ backgroundColor: "rgba(220, 38, 38, 0.05)" }}
                            >
                                <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>
                                    Are you sure? This action will sign you out immediately.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeactivate}
                                        disabled={deactivating}
                                        className="px-5 h-10 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                        style={{ backgroundColor: "var(--color-error)" }}
                                    >
                                        {deactivating ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <AlertTriangle size={14} />
                                        )}
                                        Yes, deactivate
                                    </button>
                                    <button
                                        onClick={() => setShowDeactivateConfirm(false)}
                                        className="px-5 h-10 text-sm text-text-secondary border border-border rounded-xl hover:bg-surface-alt transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
