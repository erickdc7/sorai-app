"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Sparkles, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import HeroCarousel from "@/components/HeroCarousel";
import AnimeCard from "@/components/AnimeCard";
import AnimeCardSkeleton from "@/components/AnimeCardSkeleton";
import { getTopAnime, getSeasonNow, getAnimeById, JikanError } from "@/lib/jikan";
import { useAuth } from "@/context/AuthContext";
import { AnimeCardData } from "@/types/anime";

function mapToCardData(anime: any): AnimeCardData {
    return {
        mal_id: anime.mal_id,
        title: anime.title,
        image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "",
        type: anime.type,
        year: anime.year ?? (anime.aired?.prop?.from?.year || null),
        score: anime.score,
    };
}

function mapToHeroData(anime: any, backgroundUrl: string) {
    return {
        mal_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english || null,
        score: anime.score,
        type: anime.type,
        year: anime.year ?? (anime.aired?.prop?.from?.year || null),
        episodes: anime.episodes,
        status: anime.status,
        synopsis: anime.synopsis,
        image_url: backgroundUrl,
        genres: [
            ...(anime.genres || []),
            ...(anime.themes || []),
        ].map((g: any) => g.name),
        studios: (anime.studios || []).map((s: any) => s.name),
    };
}

// Hardcoded hero anime IDs with local background images
const HERO_ANIME = [
    { mal_id: 16498, bg: "/images/16498.webp" },   // Shingeki no Kyojin
    { mal_id: 1535,  bg: "/images/1535.webp" },     // Death Note
    { mal_id: 5114,  bg: "/images/5114.webp" },     // Fullmetal Alchemist: Brotherhood
    { mal_id: 30276, bg: "/images/30276.webp" },  // One Punch Man
    { mal_id: 38000, bg: "/images/38000.webp" },    // Kimetsu no Yaiba
];

export default function HomePage() {
    const { user, setOpenModal, profile } = useAuth();
    const showSensitive = profile?.show_sensitive_content ?? false;
    const [heroAnimes, setHeroAnimes] = useState<any[]>([]);
    const [popular, setPopular] = useState<AnimeCardData[]>([]);
    const [season, setSeason] = useState<AnimeCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch hero animes from hardcoded IDs
            const heroPromises = HERO_ANIME.map(async (hero, i) => {
                if (i > 0) await new Promise((r) => setTimeout(r, 350 * i));
                const data = await getAnimeById(hero.mal_id);
                return mapToHeroData(data, hero.bg);
            });
            const heroResults = await Promise.all(heroPromises);
            setHeroAnimes(heroResults);

            // Fetch popular anime separately
            await new Promise((r) => setTimeout(r, 400));
            const popularResult = await getTopAnime("bypopularity", 16, 1, undefined, !showSensitive);
            const popularMapped = popularResult.data.map(mapToCardData);
            const popularUnique = popularMapped.filter(
                (anime, index, self) => self.findIndex((a) => a.mal_id === anime.mal_id) === index
            );
            setPopular(popularUnique.slice(0, 12));

            // Fetch seasonal anime
            await new Promise((r) => setTimeout(r, 400));
            const seasonResult = await getSeasonNow(16, 1, !showSensitive);
            const seasonMapped = seasonResult.data.map(mapToCardData);
            const seasonUnique = seasonMapped.filter(
                (anime, index, self) => self.findIndex((a) => a.mal_id === anime.mal_id) === index
            );
            setSeason(seasonUnique.slice(0, 12));
        } catch (err) {
            if (err instanceof JikanError && err.status === 429) {
                setError(err.message);
            } else {
                setError("Error loading anime. Please try again.");
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const isLoggedIn = !!user;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AuthModal />

            {/* Hero Carousel */}
            {heroAnimes.length > 0 && <HeroCarousel animes={heroAnimes} />}

            {/* Hero skeleton while loading */}
            {loading && heroAnimes.length === 0 && (
                <div className="w-full skeleton" style={{ height: "560px" }} />
            )}

            <main className="max-w-container mx-auto px-6 md:px-10 py-10">
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                        <p className="text-red-600 text-sm mb-2">{error}</p>
                        <button
                            onClick={fetchData}
                            className="text-sm px-4 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Season */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: "var(--color-season-icon-bg)" }}
                            >
                                <Sparkles size={14} style={{ color: "var(--color-type-special)" }} />
                            </div>
                            <h2 className="text-text-primary text-[1.5rem] font-semibold">
                                In Season
                            </h2>
                        </div>
                        <Link
                            href="/browse?type=season"
                            className="flex items-center gap-1 text-sm text-primary transition-all hover:gap-2"
                        >
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {loading
                            ? Array.from({ length: 12 }).map((_, i) => (
                                <AnimeCardSkeleton key={i} />
                            ))
                            : season.map((anime) => (
                                <AnimeCard key={anime.mal_id} anime={anime} />
                            ))}
                    </div>
                </section>

                {/* Popular */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary-light">
                                <TrendingUp size={14} className="text-primary" />
                            </div>
                            <h2 className="text-text-primary text-[1.5rem] font-semibold">
                                Most Popular
                            </h2>
                        </div>
                        <Link
                            href="/browse?type=popular"
                            className="flex items-center gap-1 text-sm text-primary transition-all hover:gap-2"
                        >
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {loading
                            ? Array.from({ length: 12 }).map((_, i) => (
                                <AnimeCardSkeleton key={i} />
                            ))
                            : popular.map((anime) => (
                                <AnimeCard key={anime.mal_id} anime={anime} />
                            ))}
                    </div>
                </section>

                {/* CTA Banner */}
                {!isLoggedIn && (
                    <section>
                        <div
                            className="rounded-2xl overflow-hidden relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
                            style={{
                                background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                            }}
                        >
                            <div
                                className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                                style={{
                                    backgroundColor: "var(--color-glass-white-08)",
                                    transform: "translate(35%, -35%)",
                                }}
                            />

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen size={18} className="text-purple-200" />
                                    <span className="text-purple-200 text-sm">
                                        Completely free
                                    </span>
                                </div>
                                <h3 className="text-white mb-2 text-[1.5rem] font-bold leading-tight">
                                    Track your progress,
                                    <br />
                                    organize your anime list
                                </h3>
                                <p className="text-purple-200 text-sm">
                                    Keep track of everything you watch, your scores, and much more.
                                </p>
                            </div>

                            <div className="relative z-10 flex gap-3 shrink-0">
                                <button
                                    onClick={() => setOpenModal("register")}
                                    className="px-6 h-11 bg-white rounded-xl text-sm transition-all hover:bg-purple-50 hover:shadow-lg active:scale-[0.98] text-primary font-medium"
                                >
                                    Create free account
                                </button>
                                <button
                                    onClick={() => setOpenModal("login")}
                                    className="px-6 h-11 rounded-xl text-sm text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                                    style={{ border: "1px solid var(--color-glass-white-35)" }}
                                >
                                    Sign in
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </main>
            <Footer />
        </div>
    );
}
