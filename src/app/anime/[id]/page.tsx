"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    Star,
    Play,
    Check,
    ChevronDown,
    Trash2,
    ArrowLeft,
    Music,
    Users,
    Tv,
    AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import AnimeHorizontalCarousel from "@/components/AnimeHorizontalCarousel";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import { getUserAnimeItem } from "@/lib/user-anime-list";
import { useAnimeDetail } from "@/hooks/useAnimeDetail";
import { useAnimeListActions } from "@/hooks/useAnimeListActions";
import { AnimeStatus } from "@/types/anime";
import type { JikanCharacter, JikanEpisode, JikanNamedResource } from "@/types/jikan";
import {
    STATUS_LABELS,
    STATUS_COLORS,
    STATUS_BG_COLORS,
    STATUS_BORDER_COLORS,
} from "@/constants/anime-status";

/**
 * Validates that an embed URL is from a trusted YouTube domain.
 * Prevents injection of malicious URLs via compromised API data.
 */
function isValidYouTubeEmbedUrl(url: string | undefined | null): boolean {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"].includes(
            parsed.hostname
        );
    } catch {
        return false;
    }
}

/**
 * Extracts YouTube video ID from a Jikan embed_url and returns HD thumbnail URLs.
 * maxresdefault (1280x720) may not exist; hqdefault (480x360) always exists.
 */
function getYouTubeThumbnails(embedUrl: string | undefined | null): { maxres: string; hq: string } | null {
    if (!embedUrl || !isValidYouTubeEmbedUrl(embedUrl)) return null;
    const match = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    return {
        maxres: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`,
        hq: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`,
    };
}

export default function AnimeDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const { id } = params;
    const router = useRouter();
    const { user, setOpenModal } = useAuth();
    const [supabase] = useState(() => createClient());

    const animeId = Number(id);

    // Data fetching via hook
    const {
        anime,
        characters,
        episodes,
        relatedAnime,
        similarAnime,
        loading,
        loadingRelated,
        loadingSimilar,
        error,
    } = useAnimeDetail(animeId);

    // List actions via hook
    const {
        userListItem,
        setUserListItem,
        actionLoading,
        handleAddToList: hookAddToList,
        handleStatusChange: hookStatusChange,
        handleScoreChange: hookScoreChange,
        handleRemove: hookRemove,
    } = useAnimeListActions(supabase, user?.id);

    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showScoreDropdown, setShowScoreDropdown] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAllEpisodes, setShowAllEpisodes] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Check if anime is in user's list
    useEffect(() => {
        if (!user) { setUserListItem(null); return; }
        getUserAnimeItem(supabase, user.id, animeId)
            .then(setUserListItem)
            .catch(() => { });
    }, [user, animeId]);

    // Wrapper handlers that close dropdowns and pass payloads
    const handleAddToList = () => {
        if (!user) { setOpenModal("login"); return; }
        if (!anime) return;
        hookAddToList({
            mal_id: animeId,
            anime_title: anime.title,
            anime_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
            anime_year: anime.year ?? null,
            anime_type: anime.type ?? null,
        });
    };

    const handleStatusChange = (status: AnimeStatus) => {
        setShowStatusDropdown(false);
        hookStatusChange(animeId, status);
    };

    const handleScoreChange = (score: number) => {
        setShowScoreDropdown(false);
        hookScoreChange(animeId, score);
    };

    const handleRemove = () => {
        setShowDeleteModal(false);
        hookRemove(animeId, anime?.title);
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <AuthModal />
                {/* Hero skeleton */}
                <div className="relative h-[480px] skeleton" />
                <main className="max-w-container mx-auto px-6 md:px-10 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-6 skeleton w-32" />
                            <div className="h-48 skeleton" />
                        </div>
                        <div className="space-y-6">
                            <div className="h-64 skeleton" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Error state
    if (error || !anime) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <AuthModal />
                <div className="max-w-container mx-auto px-10 py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50">
                        <AlertCircle size={28} className="text-error" />
                    </div>
                    <p className="text-text-secondary mb-4">
                        {error || "Anime not found."}
                    </p>
                    <div className="flex gap-3 justify-center">
                        {error && (
                            <button
                                onClick={() => window.location.reload()}
                                className="text-sm px-4 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover transition-colors"
                            >
                                Retry
                            </button>
                        )}
                        <Link
                            href="/"
                            className="text-sm px-4 py-2 rounded-xl border border-border text-text-primary hover:bg-surface-alt transition-colors"
                        >
                            Go to home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const studio = anime.studios?.[0]?.name || "Unknown";
    const genres = [
        ...(anime.genres || []),
        ...(anime.themes || []),
    ];
    const isAiring = anime.status === "Currently Airing";
    const posterUrl =
        anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "";
    // Use YouTube trailer thumbnail (1280x720 HD) for banner, fallback to poster
    const ytThumbs = getYouTubeThumbnails(anime.trailer?.embed_url);
    const bannerUrl = ytThumbs?.maxres || ytThumbs?.hq || posterUrl;
    const bannerIsLowRes = !ytThumbs;
    const displayedEpisodes = showAllEpisodes ? episodes : episodes.slice(0, 12);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AuthModal />

            {/* Hero Banner */}
            <div className="relative" style={{ height: "480px" }}>
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src={bannerUrl}
                        alt={anime.title}
                        className="w-full h-full object-cover"
                        style={{
                            objectPosition: ytThumbs ? "center center" : "center 20%",
                            filter: bannerIsLowRes ? "blur(2px)" : "none",
                            transform: bannerIsLowRes ? "scale(1.05)" : "none",
                        }}
                        onError={(e) => {
                            const img = e.currentTarget;
                            // If maxresdefault failed, try hqdefault
                            if (ytThumbs && img.src === ytThumbs.maxres) {
                                img.src = ytThumbs.hq;
                            } else if (ytThumbs && img.src === ytThumbs.hq) {
                                // hqdefault also failed, use poster with blur
                                img.src = posterUrl;
                                img.style.filter = "blur(2px)";
                                img.style.transform = "scale(1.05)";
                            }
                        }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(to right, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.1) 100%)",
                        }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(to top, var(--color-background) 0%, rgba(249,249,249,0) 40%)",
                        }}
                    />
                </div>

                {/* Back button - aligned with page content */}
                <div className="absolute top-6 left-0 right-0 z-20">
                    <div className="max-w-container mx-auto px-6 md:px-10">
                        <button
                            onClick={() => {
                                if (window.history.length > 1) {
                                    router.back();
                                } else {
                                    router.push("/");
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm text-white transition-colors hover:bg-white/10 cursor-pointer"
                            style={{
                                backgroundColor: "var(--color-overlay-back-btn)",
                                backdropFilter: "blur(4px)",
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                    </div>
                </div>

                {/* Hero content */}
                <div className="absolute inset-0 flex items-end z-10">
                    <div className="max-w-container w-full mx-auto px-6 md:px-10 pb-12 flex gap-8 items-end">
                        {/* Poster */}
                        <div className="hidden md:block shrink-0">
                            <img
                                src={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || posterUrl}
                                alt={anime.title}
                                className="w-[180px] rounded-2xl shadow-2xl"
                                style={{ aspectRatio: "2/3", objectFit: "cover" }}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 pb-2">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {anime.rank && (
                                    <span
                                        className="text-xs px-2.5 py-1 rounded-full text-white"
                                        style={{
                                            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-gradient))",
                                        }}
                                    >
                                        #{anime.rank} Ranking
                                    </span>
                                )}
                                {anime.type && (
                                    <span
                                        className="text-xs px-2.5 py-1 rounded-full text-white"
                                        style={{
                                            backgroundColor: "var(--color-glass-white-18)",
                                            backdropFilter: "blur(4px)",
                                        }}
                                    >
                                        {anime.type}
                                    </span>
                                )}
                                <span
                                    className="text-xs px-2.5 py-1 rounded-full text-white"
                                    style={{
                                        backgroundColor: isAiring
                                            ? "var(--color-overlay-status-airing)"
                                            : "var(--color-glass-white-18)",
                                        backdropFilter: "blur(4px)",
                                    }}
                                >
                                    {isAiring ? "● Airing" : "Finished"}
                                </span>
                            </div>

                            <h1
                                className="text-white mb-1 font-bold leading-tight tracking-tight"
                                style={{
                                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                }}
                            >
                                {anime.title}
                            </h1>
                            {anime.title_english && anime.title_english !== anime.title && (
                                <p className="text-white/60 mb-4">{anime.title_english}</p>
                            )}

                            {/* Stats row */}
                            <div className="flex flex-wrap items-center gap-4 mb-4 text-white/80 text-sm">
                                {anime.score && (
                                    <>
                                        <div className="flex items-center gap-1.5 text-yellow-400">
                                            <Star size={15} fill="currentColor" />
                                            <span className="text-white">{anime.score}</span>
                                            <span className="text-white/50 text-xs">/10</span>
                                        </div>
                                        <span className="text-white/30">|</span>
                                    </>
                                )}
                                <span>{studio}</span>
                                <span className="text-white/30">|</span>
                                <span>{anime.year || "—"}</span>
                                <span className="text-white/30">|</span>
                                <span>{anime.episodes || "?"} episodes</span>
                            </div>

                            {/* Genres */}
                            <div className="flex flex-wrap gap-2 mb-5">
                                {genres.map((g: JikanNamedResource) => (
                                    <span
                                        key={g.mal_id}
                                        className="text-xs px-2.5 py-1 rounded-full text-white border"
                                        style={{
                                            borderColor: "var(--color-glass-white-25)",
                                            backgroundColor: "var(--color-glass-white-10)",
                                        }}
                                    >
                                        {g.name}
                                    </span>
                                ))}
                            </div>

                            {/* List actions */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {!userListItem ? (
                                    <div className="relative">
                                        <button
                                            onClick={handleAddToList}
                                            onMouseEnter={() => !user && setShowTooltip(true)}
                                            onMouseLeave={() => setShowTooltip(false)}
                                            disabled={actionLoading}
                                            className="flex items-center gap-2 px-5 h-10 text-white rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, var(--color-primary), var(--color-primary-medium))",
                                            }}
                                        >
                                            {actionLoading ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Plus size={16} />
                                            )}
                                            Add to my list
                                        </button>
                                        {showTooltip && !user && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
                                                Sign in to save this anime
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        {/* Status dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    setShowStatusDropdown(!showStatusDropdown);
                                                    setShowScoreDropdown(false);
                                                }}
                                                className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm text-white transition-all hover:opacity-90"
                                                style={{
                                                    backgroundColor:
                                                        STATUS_BG_COLORS[userListItem.status],
                                                    backdropFilter: "blur(4px)",
                                                    border: `1px solid`,
                                                    borderColor: STATUS_BORDER_COLORS[userListItem.status],
                                                }}
                                            >
                                                <Check size={15} />
                                                {STATUS_LABELS[userListItem.status]}
                                                <ChevronDown
                                                    size={14}
                                                    className={`transition-transform ${showStatusDropdown ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>

                                            {showStatusDropdown && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[100]"
                                                        onClick={() => setShowStatusDropdown(false)}
                                                    />
                                                    <div
                                                        className="absolute left-0 mt-2 w-52 bg-white rounded-2xl border border-surface-alt overflow-hidden z-[101]"
                                                        style={{
                                                            top: "100%",
                                                            boxShadow: "var(--shadow-poster)",
                                                        }}
                                                    >
                                                        {Object.entries(STATUS_LABELS).map(
                                                            ([status, label]) => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() =>
                                                                        handleStatusChange(status as AnimeStatus)
                                                                    }
                                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-surface-hover transition-colors flex items-center justify-between"
                                                                    style={{
                                                                        color:
                                                                            userListItem.status === status
                                                                                ? STATUS_COLORS[status as AnimeStatus]
                                                                                : "var(--color-text-primary)",
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className="w-2 h-2 rounded-full shrink-0"
                                                                            style={{
                                                                                backgroundColor: STATUS_COLORS[status as AnimeStatus],
                                                                            }}
                                                                        />
                                                                        {label}
                                                                    </div>
                                                                    {userListItem.status === status && (
                                                                        <Check size={14} />
                                                                    )}
                                                                </button>
                                                            )
                                                        )}
                                                        <div className="border-t border-surface-alt" />
                                                        <button
                                                            onClick={() => {
                                                                setShowStatusDropdown(false);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className="w-full text-left px-4 py-3 text-sm text-error hover:bg-red-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} />
                                                            Remove from my list
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Score dropdown — hidden for On Hold and Plan to Watch */}
                                        {userListItem.status !== "paused" && userListItem.status !== "planned" && (
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    setShowScoreDropdown(!showScoreDropdown);
                                                    setShowStatusDropdown(false);
                                                }}
                                                className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm text-white transition-all hover:opacity-90"
                                                style={{
                                                    backgroundColor: "var(--color-glass-white-15)",
                                                    backdropFilter: "blur(4px)",
                                                    border: "1px solid var(--color-glass-white-30)",
                                                }}
                                            >
                                                <Star
                                                    size={14}
                                                    fill={userListItem.score ? "var(--color-star)" : "none"}
                                                    style={{
                                                        color: userListItem.score
                                                            ? "var(--color-star)"
                                                            : "var(--color-glass-white-70)",
                                                    }}
                                                />
                                                <span>
                                                    {userListItem.score
                                                        ? `${userListItem.score} / 10`
                                                        : "Rate"}
                                                </span>
                                                <ChevronDown
                                                    size={14}
                                                    className={`transition-transform ${showScoreDropdown ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>

                                            {showScoreDropdown && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[100]"
                                                        onClick={() => setShowScoreDropdown(false)}
                                                    />
                                                    <div
                                                        className="absolute left-0 mt-2 w-44 bg-white rounded-2xl border border-surface-alt overflow-hidden z-[101] max-h-[360px] overflow-y-auto"
                                                        style={{
                                                            top: "100%",
                                                            boxShadow: "var(--shadow-poster)",
                                                        }}
                                                    >
                                                        {!userListItem.score && (
                                                            <>
                                                                <div className="px-4 py-2.5 text-xs text-gray-400">
                                                                    Not rated
                                                                </div>
                                                                <div className="border-t border-surface-alt" />
                                                            </>
                                                        )}
                                                        {[...Array(10)].map((_, i) => {
                                                            const score = i + 1;
                                                            const isSelected = userListItem.score === score;
                                                            return (
                                                                <button
                                                                    key={score}
                                                                    onClick={() => handleScoreChange(score)}
                                                                    className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 hover:bg-surface-hover"
                                                                    style={{
                                                                        color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                                                                    }}
                                                                >
                                                                    <div className="flex gap-0.5">
                                                                        {[...Array(5)].map((_, si) => (
                                                                            <Star
                                                                                key={si}
                                                                                size={10}
                                                                                fill={
                                                                                    si < Math.ceil(score / 2)
                                                                                        ? "var(--color-star)"
                                                                                        : "none"
                                                                                }
                                                                                style={{
                                                                                    color:
                                                                                        si < Math.ceil(score / 2)
                                                                                            ? "var(--color-star)"
                                                                                            : "var(--color-text-disabled)",
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span
                                                                        style={{
                                                                            fontWeight: isSelected ? 600 : 400,
                                                                        }}
                                                                    >
                                                                        {score}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">
                                                                        / 10
                                                                    </span>
                                                                    {isSelected && (
                                                                        <Check size={12} className="ml-auto" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="max-w-container mx-auto px-6 md:px-10 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Synopsis */}
                        {anime.synopsis && (
                            <section>
                                <h2 className="text-text-primary mb-4 flex items-center gap-2 text-[1.5rem] font-semibold">
                                    <span className="w-1 h-5 rounded-full inline-block bg-primary" />
                                    Synopsis
                                </h2>
                                <div
                                    className="p-5 rounded-2xl bg-white"
                                    style={{ boxShadow: "var(--shadow-info-card)" }}
                                >
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {anime.synopsis}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Trailer */}
                        <section>
                            <h2 className="text-text-primary mb-4 flex items-center gap-2 text-[1.5rem] font-semibold">
                                <span className="w-1 h-5 rounded-full inline-block bg-primary" />
                                <Play size={16} className="text-text-secondary" />
                                Trailer
                            </h2>
                            {anime.trailer?.embed_url && isValidYouTubeEmbedUrl(anime.trailer.embed_url) ? (
                                <div
                                    className="rounded-2xl overflow-hidden bg-white"
                                    style={{ boxShadow: "var(--shadow-info-card)" }}
                                >
                                    <div className="relative aspect-video">
                                        <iframe
                                            src={anime.trailer.embed_url.replace("autoplay=1", "autoplay=0")}
                                            title="Trailer"
                                            className="absolute inset-0 w-full h-full"
                                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            ) : anime.trailer?.youtube_id ? (
                                <div
                                    className="rounded-2xl overflow-hidden bg-white"
                                    style={{ boxShadow: "var(--shadow-info-card)" }}
                                >
                                    <div className="relative aspect-video">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${anime.trailer.youtube_id}`}
                                            title="Trailer"
                                            className="absolute inset-0 w-full h-full"
                                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="rounded-2xl overflow-hidden bg-white flex items-center justify-center"
                                    style={{ boxShadow: "var(--shadow-info-card)", aspectRatio: "16/9" }}
                                >
                                    <div className="text-center">
                                        <Play size={32} className="text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">Trailer not available</p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Characters */}
                        {characters.length > 0 && (
                            <section>
                                <h2 className="text-text-primary mb-4 flex items-center gap-2 text-[1.5rem] font-semibold">
                                    <span className="w-1 h-5 rounded-full inline-block bg-primary" />
                                    <Users size={16} className="text-text-secondary" />
                                    Characters
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {characters.map((char: JikanCharacter, i: number) => {
                                        const japaneseVA = char.voice_actors?.find(
                                            (va) => va.language === "Japanese"
                                        );
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 p-3 bg-white rounded-2xl"
                                                style={{
                                                    boxShadow: "var(--shadow-info-card)",
                                                }}
                                            >
                                                <img
                                                    src={char.character?.images?.jpg?.image_url}
                                                    alt={char.character?.name}
                                                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                                                    loading="lazy"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-text-primary text-sm truncate font-medium">
                                                        {char.character?.name}
                                                    </p>
                                                    <p className="text-gray-400 text-xs">{char.role}</p>
                                                    {japaneseVA && (
                                                        <p className="text-text-secondary text-xs truncate">
                                                            {japaneseVA.person?.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Episodes */}
                        {episodes.length > 0 && (
                            <section>
                                <h2 className="text-text-primary mb-4 flex items-center gap-2 text-[1.5rem] font-semibold">
                                    <span className="w-1 h-5 rounded-full inline-block bg-primary" />
                                    <Tv size={16} className="text-text-secondary" />
                                    Episodes
                                </h2>
                                <div
                                    className="bg-white rounded-2xl overflow-hidden"
                                    style={{ boxShadow: "var(--shadow-info-card)" }}
                                >
                                    {displayedEpisodes.map((ep: JikanEpisode, i: number) => (
                                        <div
                                            key={ep.mal_id}
                                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors"
                                            style={{
                                                borderBottom:
                                                    i < displayedEpisodes.length - 1
                                                        ? "1px solid var(--color-surface-alt)"
                                                        : "none",
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 bg-primary-light text-primary font-semibold">
                                                {ep.mal_id}
                                            </div>
                                            <p className="flex-1 text-gray-700 text-sm">
                                                {ep.title || `Episode ${ep.mal_id}`}
                                            </p>
                                            {ep.aired && (
                                                <p className="text-gray-400 text-xs shrink-0">
                                                    {new Date(ep.aired).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {episodes.length > 12 && !showAllEpisodes && (
                                    <button
                                        onClick={() => setShowAllEpisodes(true)}
                                        className="mt-3 w-full py-2.5 text-sm text-primary hover:bg-primary-light rounded-xl transition-colors font-medium"
                                    >
                                        View all episodes ({episodes.length})
                                    </button>
                                )}
                            </section>
                        )}

                        {/* Related Anime */}
                        {loadingRelated ? (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-1 h-5 rounded-full inline-block bg-primary" />
                                    <Tv size={16} className="text-text-secondary" />
                                    <h2 className="text-text-primary text-[1.5rem] font-semibold">Related Anime</h2>
                                </div>
                                <div className="flex gap-4 overflow-hidden">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="shrink-0 animate-pulse" style={{ width: "160px" }}>
                                            <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "var(--shadow-card)" }}>
                                                <div className="aspect-[2/3] bg-gray-200" />
                                                <div className="p-3 space-y-2">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : relatedAnime.length > 0 && (
                            <AnimeHorizontalCarousel
                                title="Related Anime"
                                icon={<Tv size={16} className="text-text-secondary" />}
                                items={relatedAnime}
                            />
                        )}

                        {/* Similar Anime (Recommendations) */}
                        {loadingSimilar ? (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-1 h-5 rounded-full inline-block bg-primary" />
                                    <Star size={16} className="text-text-secondary" />
                                    <h2 className="text-text-primary text-[1.5rem] font-semibold">Similar Anime</h2>
                                </div>
                                <div className="flex gap-4 overflow-hidden">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="shrink-0 animate-pulse" style={{ width: "160px" }}>
                                            <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "var(--shadow-card)" }}>
                                                <div className="aspect-[2/3] bg-gray-200" />
                                                <div className="p-3 space-y-2">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : similarAnime.length > 0 && (
                            <AnimeHorizontalCarousel
                                title="Similar Anime"
                                icon={<Star size={16} className="text-text-secondary" />}
                                items={similarAnime}
                            />
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {/* Info card */}
                        <div
                            className="bg-white rounded-2xl p-5"
                            style={{ boxShadow: "var(--shadow-info-card)" }}
                        >
                            <h3 className="text-text-primary mb-4 text-sm font-semibold">
                                Information
                            </h3>
                            <dl className="space-y-3">
                                {[
                                    { label: "Score", value: anime.score ? `${anime.score} / 10` : "—" },
                                    { label: "Ranking", value: anime.rank ? `#${anime.rank}` : "—" },
                                    { label: "Studio", value: studio },
                                    { label: "Type", value: anime.type || "—" },
                                    { label: "Year", value: anime.year ? String(anime.year) : "—" },
                                    { label: "Episodes", value: anime.episodes ? String(anime.episodes) : "—" },
                                    {
                                        label: "Status",
                                        value: isAiring ? "Airing" : "Finished",
                                    },
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="flex justify-between items-start gap-4"
                                    >
                                        <dt className="text-gray-400 text-xs shrink-0">{label}</dt>
                                        <dd className="text-gray-700 text-xs text-right font-medium">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        {/* Theme Songs */}
                        {((anime.theme?.openings?.length ?? 0) > 0 ||
                            (anime.theme?.endings?.length ?? 0) > 0) && (
                                <div
                                    className="bg-white rounded-2xl p-5"
                                    style={{ boxShadow: "var(--shadow-info-card)" }}
                                >
                                    <h3 className="text-text-primary mb-4 text-sm font-semibold flex items-center gap-2">
                                        <Music size={14} className="text-text-secondary" />
                                        Theme Songs
                                    </h3>

                                    {(anime.theme?.openings?.length ?? 0) > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-400 mb-2">Opening</p>
                                            <div className="space-y-1.5">
                                                {anime.theme!.openings.map((song: string, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-primary-light"
                                                    >
                                                        <Play
                                                            size={10}
                                                            className="text-primary shrink-0"
                                                            fill="var(--color-primary)"
                                                        />
                                                        <span className="text-gray-700">{song}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(anime.theme?.endings?.length ?? 0) > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">Ending</p>
                                            <div className="space-y-1.5">
                                                {anime.theme!.endings.map((song: string, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-surface-alt"
                                                    >
                                                        <Play
                                                            size={10}
                                                            className="text-text-secondary shrink-0"
                                                            fill="var(--color-text-secondary)"
                                                        />
                                                        <span className="text-gray-700">{song}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            </main>

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleRemove}
                animeTitle={anime.title}
            />
            <Footer />
        </div>
    );
}
