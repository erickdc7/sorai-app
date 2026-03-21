"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Eye,
    EyeOff,
    User,
    Mail,
    Lock,
    LogIn,
    UserPlus,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal() {
    const { openModal, setOpenModal, signIn, signUp } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [usernameField, setUsernameField] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isLogin = openModal === "login";
    const isRegister = openModal === "register";
    const isOpen = isLogin || isRegister;

    useEffect(() => {
        if (!isOpen) {
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setUsernameField("");
            setError("");
            setShowPassword(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleClose = () => setOpenModal(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (isRegister) {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            if (password.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
            }
        }

        setIsLoading(true);

        try {
            if (isLogin) {
                const { error: authError } = await signIn(email, password);
                if (authError) {
                    setError("Incorrect email or password.");
                    toast.error("Login failed", {
                        description: "Please check your email and password.",
                    });
                } else {
                    toast.success("Welcome back!", {
                        description: "You have signed in successfully.",
                    });
                }
            } else {
                const { error: authError, needsConfirmation } = await signUp(email, password, usernameField);
                if (authError) {
                    setError(authError);
                    toast.error("Error creating account", {
                        description: authError,
                    });
                } else if (needsConfirmation) {
                    handleClose();
                    toast.info("Check your email", {
                        description: "We sent you a confirmation link to activate your account.",
                        duration: 8000,
                    });
                } else {
                    toast.success(`Welcome, ${usernameField || "user"}!`, {
                        description: "Your account was created and you are now signed in.",
                    });
                }
            }
        } catch {
            setError("An error occurred. Please try again.");
            toast.error("An unexpected error occurred");
        }

        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
                backgroundColor: "var(--color-overlay-medium)",
                backdropFilter: "blur(4px)",
            }}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-modal-in">
                {/* Gradient header */}
                <div
                    className="h-2 w-full"
                    style={{
                        background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-gradient))",
                    }}
                />

                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-light">
                                    {isLogin ? (
                                        <LogIn size={16} className="text-primary" />
                                    ) : (
                                        <UserPlus size={16} className="text-primary" />
                                    )}
                                </div>
                                <h2 className="text-text-primary text-[1.375rem] font-medium">
                                    {isLogin ? "Sign In" : "Create Account"}
                                </h2>
                            </div>
                            <p className="text-text-secondary text-sm">
                                {isLogin
                                    ? "Welcome back to Sorai"
                                    : "Join the Sorai community"}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl flex items-center gap-2 bg-red-50 border border-red-200">
                            <AlertCircle size={16} className="text-red-500 shrink-0" />
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username (register only) */}
                        {isRegister && (
                            <div>
                                <label className="block text-text-primary mb-1.5 text-sm font-medium">
                                    Username
                                </label>
                                <div className="relative">
                                    <User
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        value={usernameField}
                                        onChange={(e) => setUsernameField(e.target.value)}
                                        placeholder="my_username"
                                        className="w-full h-11 pl-9 pr-4 bg-surface-hover rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-text-primary placeholder-gray-400 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-text-primary mb-1.5 text-sm font-medium">
                                Email
                            </label>
                            <div className="relative">
                                <Mail
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full h-11 pl-9 pr-4 bg-surface-hover rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-text-primary placeholder-gray-400 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-text-primary mb-1.5 text-sm font-medium">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-11 pl-9 pr-10 bg-surface-hover rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-text-primary placeholder-gray-400 transition-colors"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-secondary"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm password (register only) */}
                        {isRegister && (
                            <div>
                                <label className="block text-text-primary mb-1.5 text-sm font-medium">
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <Lock
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter your password"
                                        className="w-full h-11 pl-9 pr-4 bg-surface-hover rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-text-primary placeholder-gray-400 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            style={{
                                background: isLoading
                                    ? "var(--color-primary-gradient)"
                                    : "linear-gradient(135deg, var(--color-primary), var(--color-primary-medium))",
                            }}
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isLogin ? (
                                <>
                                    <LogIn size={16} />
                                    Sign In
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-text-secondary mt-5 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() =>
                                setOpenModal(isLogin ? "register" : "login")
                            }
                            className="text-primary hover:underline transition-colors"
                        >
                            {isLogin ? "Sign up free" : "Sign in"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
