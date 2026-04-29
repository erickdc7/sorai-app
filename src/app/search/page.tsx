"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import AnimeCard from "@/components/AnimeCard";
import AnimeGridSkeleton from "@/components/AnimeGridSkeleton";
import Pagination from "@/components/Pagination";
import { searchAnime, JikanError } from "@/lib/jikan";
import { mapToCardData, deduplicateByMalId } from "@/lib/mappers";
import { AnimeCardData } from "@/types/anime";
import { TYPE_FILTERS } from "@/constants/filters";
import { useAuth } from "@/context/AuthContext";

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { profile } = useAuth();
    const query = searchParams.get("q") || "";
    const urlFilter = searchParams.get("filter") || "all";
    const urlPage = parseInt(searchParams.get("page") || "1");
    const showSensitive = profile?.show_sensitive_content ?? false;
    const [results, setResults] = useState<AnimeCardData[]>([]);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>(urlFilter);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const prevQueryRef = useRef(query);

    const DISPLAY_LIMIT = 12;
    const FETCH_LIMIT = 16;

    const getResultsLabel = () => {
        if (totalPages <= 1) return `${results.length} result${results.length !== 1 ? "s" : ""}`;
        const estimated = totalPages * DISPLAY_LIMIT;
        if (estimated <= 50) return `${estimated} results`;
        const rounded = Math.floor(estimated / 50) * 50;
        return `More than ${rounded} results`;
    };

    const buildUrl = useCallback((overrides: { filter?: string; page?: number }) => {
        const params = new URLSearchParams(searchParams.toString());
        const f = overrides.filter ?? typeFilter;
        const p = overrides.page ?? currentPage;
        if (f && f !== "all") params.set("filter", f); else params.delete("filter");
        if (p > 1) params.set("page", String(p)); else params.delete("page");
        return `/search?${params.toString()}`;
    }, [searchParams, typeFilter, currentPage]);

    const fetchResults = useCallback(
        async (page: number, type: string = typeFilter) => {
            if (!query) {
                setResults([]);
                setTotalPages(1);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const apiType = type === "all" ? undefined : type;
                const data = await searchAnime(query, page, FETCH_LIMIT, !showSensitive, apiType);
                const mapped = data.data.map(mapToCardData);
                const unique = deduplicateByMalId(mapped);
                setResults(unique.slice(0, DISPLAY_LIMIT));
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
        [query, showSensitive, typeFilter]
    );

    // Reset filter/page only when the search query itself changes
    useEffect(() => {
        if (prevQueryRef.current !== query) {
            prevQueryRef.current = query;
            setCurrentPage(1);
            setTypeFilter("all");
            fetchResults(1, "all");
        } else {
            fetchResults(urlPage, urlFilter);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const handleFilterChange = (type: string) => {
        if (type === typeFilter) return;
        setTypeFilter(type);
        setCurrentPage(1);
        fetchResults(1, type);
        router.push(buildUrl({ filter: type, page: 1 }), { scroll: false });
    };

    const handlePageChange = (page: number) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setCurrentPage(page);
            fetchResults(page);
            router.push(buildUrl({ page }), { scroll: false });
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 400);
    };



    return (
        <main className="max-w-container mx-auto px-6 md:px-10 py-10">
            {/* Header */}
            <div className="mb-6">
                {query ? (
                    <>
                        <div className="flex items-center gap-2 mb-1">
                            <SearchIcon size={18} className="text-primary" />
                            <h1 className="text-text-primary text-[1.5rem] font-bold">
                                Results for &ldquo;{query}&rdquo;
                            </h1>
                        </div>
                        <p className="text-gray-400 text-sm ml-7">
                            {!loading && getResultsLabel()}
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

            {/* Type Filters */}
            {query && (
                <div className="flex flex-wrap gap-2 mb-8">
                    {TYPE_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => handleFilterChange(filter.value)}
                            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                            style={{
                                backgroundColor: typeFilter === filter.value
                                    ? "var(--color-primary)"
                                    : "var(--color-surface)",
                                color: typeFilter === filter.value
                                    ? "white"
                                    : "var(--color-text-secondary)",
                                boxShadow: typeFilter === filter.value
                                    ? "var(--shadow-card-hover)"
                                    : "var(--shadow-soft)",
                                border: typeFilter === filter.value
                                    ? "1px solid var(--color-primary)"
                                    : "1px solid var(--color-border)",
                            }}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            )}

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
                <div className="mb-10">
                    <AnimeGridSkeleton count={12} />
                </div>
            ) : results.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                        {results.map((anime) => (
                            <AnimeCard key={anime.mal_id} anime={anime} />
                        ))}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
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
                        No results found for &ldquo;{query}&rdquo;{typeFilter !== "all" ? ` with type "${TYPE_FILTERS.find(f => f.value === typeFilter)?.label}"` : ""}
                    </p>
                </div>
            ) : null}
        </main>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-background">
            <Suspense
                fallback={
                    <main className="max-w-container mx-auto px-6 md:px-10 py-10">
                        <AnimeGridSkeleton count={16} />
                    </main>
                }
            >
                <SearchContent />
            </Suspense>
        </div>
    );
}
