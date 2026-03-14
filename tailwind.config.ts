import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#6B3FA0",
                    hover: "#5a3388",
                    light: "#F3EBF9",
                    gradient: "#9B6FD0",
                },
                background: "#F9F9F9",
                surface: {
                    DEFAULT: "#FFFFFF",
                    alt: "#F3F4F6",
                },
                "text-primary": "#111827",
                "text-secondary": "#6B7280",
                border: "#E5E7EB",
                error: "#DC2626",
                success: "#16A34A",
            },
            borderRadius: {
                card: "12px",
                button: "8px",
                modal: "16px",
            },
            fontFamily: {
                sans: ["var(--font-nunito-sans)", "system-ui", "-apple-system", "sans-serif"],
                heading: ["var(--font-bebas-neue)", "sans-serif"],
                logo: ["var(--font-marck-script)", "cursive"],
            },
            maxWidth: {
                container: "1440px",
            },
            animation: {
                "skeleton-pulse": "skeleton-pulse 1.5s ease-in-out infinite",
            },
            keyframes: {
                "skeleton-pulse": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.4" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
