"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import AnimeCard from "@/components/AnimeCard";
import AnimeCardSkeleton from "@/components/AnimeCardSkeleton";
import { searchAnime, JikanError } from "@/lib/jikan";
import { AnimeCardData } from "@/types/anime";
import { useAuth } from "@/context/AuthContext";

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

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { profile } = useAuth();
    const query = searchParams.get("q") || "";
    const showSensitive = profile?.show_sensitive_content ?? false;
    const [results, setResults] = useState<AnimeCardData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const fetchResults = useCallback(
        async (page: number) => {
            if (!query) {
                setResults([]);
                setTotalPages(1);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const data = await searchAnime(query, page, 16, !showSensitive);
                setResults(data.data.map(mapToCardData));
                setTotalPages(data.pagination.last_visible_page);
                setCurrentPage(data.pagination.current_page);
            } catch (err) {
                if (err instanceof JikanError && err.status === 429) {
                    setError(err.message);
                } else {
                    setError("Search error. Please try again.");
                }
            }
            setLoading(false);
        },
        [query, showSensitive]
    );

    useEffect(() => {
        setCurrentPage(1);
        fetchResults(1);
    }, [query, fetchResults]);

    const handlePageChange = (page: number) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchResults(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 400);
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
                <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-text-secondary text-sm">
                    ...
                </span>
            ) : (
                <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className="w-9 h-9 rounded-xl text-sm transition-colors"
                    style={{
                        backgroundColor: currentPage === p ? "var(--color-primary)" : "transparent",
                        color: currentPage === p ? "white" : "var(--color-text-secondary)",
                        border: currentPage === p ? "none" : "1px solid var(--color-border)",
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
                {query ? (
                    <>
                        <div className="flex items-center gap-2 mb-1">
                            <SearchIcon size={18} className="text-primary" />
                            <h1 className="text-text-primary text-[1.5rem] font-bold">
                                Results for &ldquo;{query}&rdquo;
                            </h1>
                        </div>
                        <p className="text-gray-400 text-sm ml-7">
                            {!loading && `${results.length} result${results.length !== 1 ? "s" : ""} found`}
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-text-primary text-[1.5rem] font-bold">
                            Browse catalog
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Use the search bar to find anime
                        </p>
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                    <p className="text-red-600 text-sm mb-2">{error}</p>
                    <button
                        onClick={() => fetchResults(currentPage)}
                        className="text-sm px-4 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <AnimeCardSkeleton key={i} />
                    ))}
                </div>
            ) : results.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                        {results.map((anime) => (
                            <AnimeCard key={anime.mal_id} anime={anime} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {renderPageButtons()}

                            <button
                                onClick={() =>
                                    handlePageChange(Math.min(totalPages, currentPage + 1))
                                }
                                disabled={currentPage === totalPages}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            ) : query ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary-light">
                        <SearchIcon size={28} className="text-primary" />
                    </div>
                    <h3 className="text-text-primary mb-2 text-[1.1rem] font-semibold">
                        No results
                    </h3>
                    <p className="text-gray-400 text-sm">
                        No results found for &ldquo;{query}&rdquo;
                    </p>
                </div>
            ) : null}
        </main>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AuthModal />
            <Suspense
                fallback={
                    <main className="max-w-container mx-auto px-6 md:px-10 py-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {Array.from({ length: 16 }).map((_, i) => (
                                <AnimeCardSkeleton key={i} />
                            ))}
                        </div>
                    </main>
                }
            >
                <SearchContent />
            </Suspense>
            <Footer />
        </div>
    );
}
