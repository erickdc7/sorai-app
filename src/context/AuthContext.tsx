"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    openModal: "login" | "register" | null;
    setOpenModal: (modal: "login" | "register" | null) => void;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (
        email: string,
        password: string,
        username: string
    ) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
    signOut: () => Promise<void>;
    username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [supabase] = useState(() => createClient());
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [openModal, setOpenModal] = useState<"login" | "register" | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signIn = useCallback(
        async (email: string, password: string) => {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) return { error: error.message };
            setOpenModal(null);
            return { error: null };
        },
        [supabase]
    );

    const signUp = useCallback(
        async (email: string, password: string, username: string) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                },
            });
            if (error) return { error: error.message };

            // If Supabase returned a session, user is auto-logged in (email confirmation disabled)
            // If no session, email confirmation is required
            const hasSession = !!data.session;
            if (hasSession) {
                setOpenModal(null);
            }
            return { error: null, needsConfirmation: !hasSession };
        },
        [supabase]
    );

    const signOutFn = useCallback(async () => {
        await supabase.auth.signOut();
    }, [supabase]);

    const username =
        user?.user_metadata?.username ??
        user?.email?.split("@")[0] ??
        "usuario";

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isLoading,
                openModal,
                setOpenModal,
                signIn,
                signUp,
                signOut: signOutFn,
                username,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
