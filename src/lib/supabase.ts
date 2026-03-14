import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function createClient() {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

export function isSupabaseConfigured(): boolean {
    return (
        !!supabaseUrl &&
        supabaseUrl !== "tu_url_de_supabase" &&
        supabaseUrl.startsWith("https://") &&
        !!supabaseAnonKey &&
        supabaseAnonKey !== "tu_anon_key_de_supabase"
    );
}
