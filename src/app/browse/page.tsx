"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp, Sparkles, ChevronLeft, ChevronRight, Clock, Film, Tag, Radio, Tv, Star, CalendarDays, Snowflake, Flower2, Sun, Leaf } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import AnimeCard from "@/components/AnimeCard";
import AnimeCardSkeleton from "@/components/AnimeCardSkeleton";
import { getTopAnime, getSeasonNow, getSeasonUpcoming, getSeasonByYear, getAnimeByGenre, JikanError } from "@/lib/jikan";
import { mapToCardData, deduplicateByMalId } from "@/lib/mappers";
import { AnimeCardData } from "@/types/anime";
import { TYPE_FILTERS } from "@/constants/filters";
import { useAuth } from "@/context/AuthContext";



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
        icon: <TrendingUp size={18} style={{ color: "var(--color-primary)" }} />,
        iconBg: "var(--color-primary-light)",
    },
    season: {
        title: "In Season",
        subtitle: "Anime currently airing this season",
        icon: <Sparkles size={18} style={{ color: "var(--color-type-special)" }} />,
        iconBg: "var(--color-season-icon-bg)",
    },
    upcoming: {
        title: "Upcoming Anime",
        subtitle: "Anime coming soon in the next season",
        icon: <Clock size={18} style={{ color: "var(--color-cat-upcoming)" }} />,
        iconBg: "var(--color-cat-upcoming-bg)",
    },
    movies: {
        title: "Top Movies",
        subtitle: "Highest rated anime movies",
        icon: <Film size={18} style={{ color: "var(--color-cat-movies)" }} />,
        iconBg: "var(--color-cat-movies-bg)",
    },
    airing: {
        title: "Top Airing",
        subtitle: "Highest rated anime currently on air",
        icon: <Radio size={18} style={{ color: "var(--color-cat-airing)" }} />,
        iconBg: "var(--color-cat-airing-bg)",
    },
    ona: {
        title: "ONAs",
        subtitle: "Original Net Animations — web-exclusive anime",
        icon: <Tv size={18} style={{ color: "var(--color-cat-ovaona)" }} />,
        iconBg: "var(--color-cat-ovaona-bg)",
    },
    ova: {
        title: "OVAs",
        subtitle: "Original Video Animations — special home-release anime",
        icon: <Tv size={18} style={{ color: "var(--color-cat-ovaona)" }} />,
        iconBg: "var(--color-cat-ovaona-bg)",
    },
    special: {
        title: "Specials",
        subtitle: "Special anime episodes and one-offs",
        icon: <Star size={18} style={{ color: "var(--color-cat-special)" }} />,
        iconBg: "var(--color-cat-special-bg)",
    },
};

function BrowseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get("type") || "popular";
    const genre = searchParams.get("genre");
    const genreId = genre ? parseInt(genre) : null;
    const seasonYear = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;
    const seasonName = searchParams.get("season") || null;

    // Read filter and page from URL params
    const urlFilter = searchParams.get("filter") || "all";
    const urlPage = parseInt(searchParams.get("page") || "1");

    const SEASON_ICONS: Record<string, React.ReactNode> = {
        winter: <Snowflake size={18} style={{ color: "var(--color-season-winter)" }} />,
        spring: <Flower2 size={18} style={{ color: "var(--color-season-spring)" }} />,
        summer: <Sun size={18} style={{ color: "var(--color-season-summer)" }} />,
        fall: <Leaf size={18} style={{ color: "var(--color-season-fall)" }} />,
    };

    const SEASON_ICON_BG: Record<string, string> = {
        winter: "var(--color-season-winter-bg)",
        spring: "var(--color-season-spring-bg)",
        summer: "var(--color-season-summer-bg)",
        fall: "var(--color-season-fall-bg)",
    };

    const seasonArchiveConfig = (type === "season-archive" && seasonYear && seasonName) ? {
        title: `${SEASON_LABELS[seasonName] || seasonName} ${seasonYear}`,
        subtitle: `Anime from the ${SEASON_LABELS[seasonName] || seasonName} ${seasonYear} season`,
        icon: SEASON_ICONS[seasonName] || <CalendarDays size={18} style={{ color: "var(--color-primary)" }} />,
        iconBg: SEASON_ICON_BG[seasonName] || "var(--color-primary-light)",
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
        icon: <Tag size={18} style={{ color: "var(--color-primary)" }} />,
        iconBg: "var(--color-primary-light)",
    } : null;

    const config = seasonArchiveConfig || genreConfig || PAGE_CONFIG[type] || PAGE_CONFIG.popular;

    // Pages that are already type-specific — no filter needed
    const FORMAT_TYPES = ["ona", "ova", "special", "movies"];
    const showTypeFilter = !FORMAT_TYPES.includes(type);



    const [results, setResults] = useState<AnimeCardData[]>([]);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>(urlFilter);
    const { profile } = useAuth();
    const showSensitive = profile?.show_sensitive_content ?? false;
    const sfw = !showSensitive;

    const DISPLAY_LIMIT = 12;
    const FETCH_LIMIT = 16; // overfetch to compensate for API duplicates

    const fetchData = useCallback(
        async (page: number, filterType: string = typeFilter) => {
            setLoading(true);
            setError(null);
            const apiType = filterType === "all" ? undefined : filterType;
            try {
                let result;
                if (genreId) {
                    result = await getAnimeByGenre(genreId, FETCH_LIMIT, page, sfw, apiType);
                } else if (type === "season-archive" && seasonYear && seasonName) {
                    result = await getSeasonByYear(seasonYear, seasonName, FETCH_LIMIT, page, sfw, apiType);
                } else if (type === "season") {
                    result = await getSeasonNow(FETCH_LIMIT, page, sfw, apiType);
                } else if (type === "upcoming") {
                    result = await getSeasonUpcoming(FETCH_LIMIT, page, sfw, apiType);
                } else if (type === "movies") {
                    result = await getTopAnime("bypopularity", FETCH_LIMIT, page, "movie", sfw);
                } else if (type === "airing") {
                    result = await getTopAnime("airing", FETCH_LIMIT, page, apiType, sfw);
                } else if (type === "ona") {
                    result = await getTopAnime("bypopularity", FETCH_LIMIT, page, "ona", sfw);
                } else if (type === "ova") {
                    result = await getTopAnime("bypopularity", FETCH_LIMIT, page, "ova", sfw);
                } else if (type === "special") {
                    result = await getTopAnime("bypopularity", FETCH_LIMIT, page, "special", sfw);
                } else {
                    // popular
                    result = await getTopAnime("bypopularity", FETCH_LIMIT, page, apiType, sfw);
                }
                const mapped = result.data.map(mapToCardData);
                const unique = deduplicateByMalId(mapped);
                setResults(unique.slice(0, DISPLAY_LIMIT));
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
        [type, genreId, seasonYear, seasonName, sfw, typeFilter]
    );

    // Build URL with current params + filter/page overrides
    const buildUrl = useCallback((overrides: { filter?: string; page?: number }) => {
        const params = new URLSearchParams(searchParams.toString());
        const f = overrides.filter ?? typeFilter;
        const p = overrides.page ?? currentPage;
        if (f && f !== "all") params.set("filter", f); else params.delete("filter");
        if (p > 1) params.set("page", String(p)); else params.delete("page");
        return `/browse?${params.toString()}`;
    }, [searchParams, typeFilter, currentPage]);

    // Initial fetch on mount (reads from URL)
    useEffect(() => {
        setResults([]);
        fetchData(urlPage, urlFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (filter: string) => {
        if (filter === typeFilter) return;
        setTypeFilter(filter);
        setCurrentPage(1);
        fetchData(1, filter);
        router.push(buildUrl({ filter, page: 1 }), { scroll: false });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchData(page);
        router.push(buildUrl({ page }), { scroll: false });
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
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
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
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: config.iconBg }}
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

            {/* Type Filters */}
            {showTypeFilter && (
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
                <BrowseContentWrapper />
            </Suspense>
            <Footer />
        </div>
    );
}

function BrowseContentWrapper() {
    const searchParams = useSearchParams();
    const key = searchParams.toString();
    return <BrowseContent key={key} />;
}
