"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import AnimeCard from "@/components/AnimeCard";
import AnimeCardSkeleton from "@/components/AnimeCardSkeleton";
import { getTopAnime, getSeasonNow, JikanError } from "@/lib/jikan";
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

const PAGE_CONFIG = {
    popular: {
        title: "Most Popular",
        subtitle: "Most popular anime of all time",
        icon: <TrendingUp size={18} className="text-primary" />,
        iconBg: "bg-primary-light",
    },
    season: {
        title: "In Season",
        subtitle: "Anime currently airing this season",
        icon: <Sparkles size={18} style={{ color: "#D4700A" }} />,
        iconBg: "",
    },
};

function BrowseContent() {
    const searchParams = useSearchParams();
    const type = (searchParams.get("type") as "popular" | "season") || "popular";
    const config = PAGE_CONFIG[type] || PAGE_CONFIG.popular;

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
                const result =
                    type === "season"
                        ? await getSeasonNow(12, page)
                        : await getTopAnime("bypopularity", 12, page);
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
        [type]
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
                            currentPage === p ? "#6B3FA0" : "transparent",
                        color: currentPage === p ? "white" : "#6B7280",
                        border:
                            currentPage === p ? "none" : "1px solid #E5E7EB",
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
                                ? { backgroundColor: "#FFF3E0" }
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
        </div>
    );
}
