"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp, Sparkles, ChevronLeft, ChevronRight, Clock, Film, Tag, Radio, PlayCircle, Tv, Star, CalendarDays } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import AnimeCard from "@/components/AnimeCard";
import AnimeCardSkeleton from "@/components/AnimeCardSkeleton";
import { getTopAnime, getSeasonNow, getSeasonUpcoming, getSeasonByYear, getAnimeByGenre, JikanError } from "@/lib/jikan";
import { AnimeCardData } from "@/types/anime";

function mapToCardData(anime: any): AnimeCardData {
    return {
        mal_id: anime.mal_id,
        title: anime.title,
        image_url:
            anime.images?.jpg?.large_image_url ||
            anime.images?.jpg?.image_url ||
            "",
        type: anime.type,
        year: anime.year ?? (anime.aired?.prop?.from?.year || null),
        score: anime.score,
    };
}

const SEASON_LABELS: Record<string, string> = {
    winter: "Winter",
    spring: "Spring",
    summer: "Summer",
    fall: "Fall",
};

const PAGE_CONFIG: Record<string, { title: string; subtitle: string; icon: React.ReactNode; iconBg: string }> = {
    popular: {
        title: "Most Popular",
        subtitle: "Most popular anime of all time",
        icon: <TrendingUp size={18} className="text-primary" />,
        iconBg: "bg-primary-light",
    },
    season: {
        title: "In Season",
        subtitle: "Anime currently airing this season",
        icon: <Sparkles size={18} style={{ color: "var(--color-type-special)" }} />,
        iconBg: "",
    },
    upcoming: {
        title: "Upcoming Anime",
        subtitle: "Anime coming soon in the next season",
        icon: <Clock size={18} className="text-blue-500" />,
        iconBg: "",
    },
    movies: {
        title: "Top Movies",
        subtitle: "Highest rated anime movies",
        icon: <Film size={18} className="text-amber-500" />,
        iconBg: "",
    },
    airing: {
        title: "Top Airing",
        subtitle: "Highest rated anime currently on air",
        icon: <Radio size={18} className="text-green-500" />,
        iconBg: "",
    },
    ona: {
        title: "ONAs",
        subtitle: "Original Net Animations — web-exclusive anime",
        icon: <PlayCircle size={18} className="text-cyan-500" />,
        iconBg: "",
    },
    ova: {
        title: "OVAs",
        subtitle: "Original Video Animations — special home-release anime",
        icon: <Tv size={18} className="text-indigo-500" />,
        iconBg: "",
    },
    special: {
        title: "Specials",
        subtitle: "Special anime episodes and one-offs",
        icon: <Star size={18} className="text-yellow-500" />,
        iconBg: "",
    },
};

function BrowseContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get("type") || "popular";
    const genre = searchParams.get("genre");
    const genreId = genre ? parseInt(genre) : null;
    const seasonYear = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;
    const seasonName = searchParams.get("season") || null;

    const seasonArchiveConfig = (type === "season-archive" && seasonYear && seasonName) ? {
        title: `${SEASON_LABELS[seasonName] || seasonName} ${seasonYear}`,
        subtitle: `Anime from the ${SEASON_LABELS[seasonName] || seasonName} ${seasonYear} season`,
        icon: <CalendarDays size={18} className="text-primary" />,
        iconBg: "bg-primary-light",
    } : null;

    const GENRE_NAMES: Record<number, string> = {
        1: "Action", 2: "Adventure", 4: "Comedy", 8: "Drama",
        10: "Fantasy", 14: "Horror", 22: "Romance", 24: "Sci-Fi",
        27: "Shounen", 25: "Shoujo", 36: "Slice of Life", 30: "Sports",
        7: "Mystery", 37: "Supernatural",
    };

    const genreConfig = genreId ? {
        title: GENRE_NAMES[genreId] || "Genre",
        subtitle: `Popular ${GENRE_NAMES[genreId] || ""} anime`,
        icon: <Tag size={18} className="text-primary" />,
        iconBg: "bg-primary-light",
    } : null;

    const config = seasonArchiveConfig || genreConfig || PAGE_CONFIG[type] || PAGE_CONFIG.popular;

    const [results, setResults] = useState<AnimeCardData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(
        async (page: number) => {
            setLoading(true);
            setError(null);
            try {
                let result;
                if (genreId) {
                    result = await getAnimeByGenre(genreId, 12, page);
                } else if (type === "season-archive" && seasonYear && seasonName) {
                    result = await getSeasonByYear(seasonYear, seasonName, 12, page);
                } else if (type === "season") {
                    result = await getSeasonNow(12, page);
                } else if (type === "upcoming") {
                    result = await getSeasonUpcoming(12, page);
                } else if (type === "movies") {
                    result = await getTopAnime("bypopularity", 12, page, "movie");
                } else if (type === "airing") {
                    result = await getTopAnime("airing", 12, page);
                } else if (type === "ona") {
                    result = await getTopAnime("bypopularity", 12, page, "ona");
                } else if (type === "ova") {
                    result = await getTopAnime("bypopularity", 12, page, "ova");
                } else if (type === "special") {
                    result = await getTopAnime("bypopularity", 12, page, "special");
                } else {
                    result = await getTopAnime("bypopularity", 12, page);
                }
                setResults(result.data.map(mapToCardData));
                setTotalPages(result.pagination.last_visible_page);
                setCurrentPage(result.pagination.current_page);
            } catch (err) {
                if (err instanceof JikanError && err.status === 429) {
                    setError(err.message);
                } else {
                    setError("Error loading anime. Please try again.");
                }
            }
            setLoading(false);
        },
        [type, genreId, seasonYear, seasonName]
    );

    useEffect(() => {
        setCurrentPage(1);
        fetchData(1);
    }, [type, fetchData]);

    const handlePageChange = (page: number) => {
        fetchData(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const renderPageButtons = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }

        return pages.map((p, i) =>
            typeof p === "string" ? (
                <span
                    key={`ellipsis-${i}`}
                    className="w-9 h-9 flex items-center justify-center text-text-secondary text-sm"
                >
                    ...
                </span>
            ) : (
                <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className="w-9 h-9 rounded-xl text-sm transition-colors"
                    style={{
                        backgroundColor:
                            currentPage === p ? "var(--color-primary)" : "transparent",
                        color: currentPage === p ? "white" : "var(--color-text-secondary)",
                        border:
                            currentPage === p ? "none" : "1px solid var(--color-border)",
                    }}
                >
                    {p}
                </button>
            )
        );
    };

    return (
        <main className="max-w-container mx-auto px-6 md:px-10 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Link
                        href="/"
                        className="text-gray-400 hover:text-primary text-sm transition-colors"
                    >
                        Home
                    </Link>
                    <span className="text-gray-300 text-sm">/</span>
                    <span className="text-text-primary text-sm font-medium">
                        {config.title}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.iconBg}`}
                        style={
                            type === "season"
                                ? { backgroundColor: "var(--color-season-icon-bg)" }
                                : {}
                        }
                    >
                        {config.icon}
                    </div>
                    <h1 className="text-text-primary text-[1.5rem] font-bold">
                        {config.title}
                    </h1>
                </div>
                <p className="text-gray-400 text-sm mt-1 ml-10">
                    {config.subtitle}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                    <p className="text-red-600 text-sm mb-2">{error}</p>
                    <button
                        onClick={() => fetchData(currentPage)}
                        className="text-sm px-4 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Results */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                {loading
                    ? Array.from({ length: 12 }).map((_, i) => (
                        <AnimeCardSkeleton key={i} />
                    ))
                    : results.map((anime) => (
                        <AnimeCard key={anime.mal_id} anime={anime} />
                    ))}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() =>
                            handlePageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {renderPageButtons()}

                    <button
                        onClick={() =>
                            handlePageChange(
                                Math.min(totalPages, currentPage + 1)
                            )
                        }
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </main>
    );
}

export default function BrowsePage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AuthModal />
            <Suspense
                fallback={
                    <main className="max-w-container mx-auto px-6 md:px-10 py-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <AnimeCardSkeleton key={i} />
                            ))}
                        </div>
                    </main>
                }
            >
                <BrowseContent />
            </Suspense>
            <Footer />
        </div>
    );
}
