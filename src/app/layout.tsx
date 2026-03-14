import type { Metadata } from "next";
import { Nunito_Sans, Bebas_Neue, Marck_Script } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const nunitoSans = Nunito_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-nunito-sans",
});

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-bebas-neue",
});

const marckScript = Marck_Script({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-marck-script",
});

export const metadata: Metadata = {
    title: "Sorai — Your Personal Anime Tracker",
    description:
        "Explore, search, and organize your personal anime list. Track what you watch, your scores, and much more.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${nunitoSans.variable} ${bebasNeue.variable} ${marckScript.variable}`}
        >
            <body className="font-sans min-h-screen">
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                borderRadius: "12px",
                                fontSize: "14px",
                            },
                        }}
                        richColors
                        closeButton
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
