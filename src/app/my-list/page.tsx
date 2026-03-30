"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
    Star,
    Trash2,
    Grid3X3,
    List as ListIcon,
    ChevronDown,
    Check,
    LayoutList,
    Search,
    X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import {
    getUserAnimeList,
    updateAnimeStatus,
    updateAnimeScore,
    removeAnimeFromList,
} from "@/lib/user-anime-list";
import { AnimeStatus, UserAnimeListItem } from "@/types/anime";

const statusLabels: Record<string, string> = {
    watching: "Watching",
    completed: "Completed",
    paused: "On Hold",
    dropped: "Dropped",
    planned: "Plan to Watch",
};

const statusColors: Record<string, string> = {
    watching: "var(--color-success)",
    completed: "var(--color-primary)",
    paused: "var(--color-warning)",
    dropped: "var(--color-error)",
    planned: "var(--color-info)",
};

const statusOrder: AnimeStatus[] = [
    "watching",
    "planned",
    "paused",
    "completed",
    "dropped",
];

export default function MyListPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [supabase] = useState(() => createClient());

    const [list, setList] = useState<UserAnimeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [deleteTarget, setDeleteTarget] = useState<UserAnimeListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openScoreDropdown, setOpenScoreDropdown] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [authLoading, user, router]);

    // Fetch list
    useEffect(() => {
        if (!user) return;

        const fetchList = async () => {
            setLoading(true);
            try {
                const data = await getUserAnimeList(supabase, user.id);
                setList(data);
            } catch {
                // Silent
            }
            setLoading(false);
        };

        fetchList();
    }, [user, supabase]);

    // Filter by search query
    const filteredList = searchQuery.trim()
        ? list.filter((item) =>
            item.anime_title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : list;

    // Group by status
    const groupedList = statusOrder.reduce(
        (acc, status) => {
            const items = filteredList.filter((item) => item.status === status);
            if (items.length > 0) acc.push({ status, items });
            return acc;
        },
        [] as { status: AnimeStatus; items: UserAnimeListItem[] }[]
    );

    const handleStatusChange = async (
        malId: number,
        newStatus: AnimeStatus
    ) => {
        if (!user) return;
        setList((prev) =>
            prev.map((item) =>
                item.mal_id === malId ? { ...item, status: newStatus } : item
            )
        );
        try {
            await updateAnimeStatus(supabase, user.id, malId, newStatus);
        } catch {
            // Revert
            const data = await getUserAnimeList(supabase, user.id);
            setList(data);
        }
    };

    const handleScoreChange = async (malId: number, score: number) => {
        if (!user) return;
        setOpenScoreDropdown(null);
        setList((prev) =>
            prev.map((item) =>
                item.mal_id === malId ? { ...item, score } : item
            )
        );
        try {
            await updateAnimeScore(supabase, user.id, malId, score);
        } catch {
            const data = await getUserAnimeList(supabase, user.id);
            setList(data);
        }
    };

    const handleDelete = async () => {
        if (!user || !deleteTarget) return;
        setIsDeleting(true);
        try {
            await removeAnimeFromList(supabase, user.id, deleteTarget.mal_id);
            setList((prev) =>
                prev.filter((item) => item.mal_id !== deleteTarget.mal_id)
            );
            toast.success("Removed from your list", {
                description: `${deleteTarget.anime_title || "Anime"} has been removed.`,
            });
        } catch {
            // Revert
            const data = await getUserAnimeList(supabase, user.id);
            setList(data);
            toast.error("Failed to remove from list");
        }
        setIsDeleting(false);
        setDeleteTarget(null);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <AuthModal />
                <main className="max-w-container mx-auto px-6 md:px-10 py-10">
                    <div className="h-8 skeleton w-48 mb-8" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i}>
                                <div className="aspect-[2/3] skeleton rounded-card mb-2" />
                                <div className="h-4 skeleton w-3/4 mb-1" />
                                <div className="h-3 skeleton w-1/2" />
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AuthModal />

            <main className="max-w-container mx-auto px-6 md:px-10 py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-text-primary text-[1.5rem] font-bold">
                            My List
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {list.length} anime{list.length !== 1 ? "s" : ""} in your list
                        </p>
                    </div>

                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-border">
                        <button
                            onClick={() => setViewMode("grid")}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm transition-colors"
                            style={{
                                backgroundColor: viewMode === "grid" ? "var(--color-primary)" : "transparent",
                                color: viewMode === "grid" ? "white" : "var(--color-text-secondary)",
                            }}
                        >
                            <Grid3X3 size={14} />
                            <span className="hidden sm:inline">Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm transition-colors"
                            style={{
                                backgroundColor: viewMode === "list" ? "var(--color-primary)" : "transparent",
                                color: viewMode === "list" ? "white" : "var(--color-text-secondary)",
                            }}
                        >
                            <LayoutList size={14} />
                            <span className="hidden sm:inline">List</span>
                        </button>
                    </div>
                </div>

                {/* Search bar */}
                {!loading && list.length > 0 && (
                    <div className="relative mb-6">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search in my list..."
                            className="w-full pl-10 pr-4 h-10 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                )}

                {/* Loading skeleton */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i}>
                                <div className="aspect-[2/3] skeleton rounded-2xl mb-2" />
                                <div className="h-4 skeleton w-3/4 mb-1" />
                                <div className="h-3 skeleton w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : list.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary-light">
                            <ListIcon size={28} className="text-primary" />
                        </div>
                        <h3 className="text-text-primary mb-2 text-[1.1rem] font-semibold">
                            Your list is empty
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Browse the catalog and add your favorite anime
                        </p>
                        <Link
                            href="/"
                            className="inline-flex px-6 py-2.5 rounded-xl text-sm text-white font-medium bg-primary hover:bg-primary-hover transition-colors"
                        >
                            Browse anime
                        </Link>
                    </div>
                ) : searchQuery && filteredList.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary-light">
                            <Search size={24} className="text-primary" />
                        </div>
                        <h3 className="text-text-primary mb-2 text-[1.05rem] font-semibold">
                            No results
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            No results for &ldquo;{searchQuery}&rdquo; in your list
                        </p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="text-sm text-primary hover:text-primary-hover transition-colors"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {groupedList.map(({ status, items }) => (
                            <section key={status}>
                                <div className="flex items-center gap-2 mb-4">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: statusColors[status] }}
                                    />
                                    <h2 className="text-text-primary text-[1.05rem] font-semibold">
                                        {statusLabels[status]}
                                    </h2>
                                    <span className="text-gray-400 text-sm">
                                        ({items.length})
                                    </span>
                                </div>

                                <div
                                    className={
                                        viewMode === "grid"
                                            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                                            : "flex flex-col gap-3"
                                    }
                                >
                                    {items.map((item) =>
                                        viewMode === "grid" ? (
                                            <GridCard
                                                key={item.id}
                                                item={item}
                                                onDelete={() => setDeleteTarget(item)}
                                            />
                                        ) : (
                                            <ListCard
                                                key={item.id}
                                                item={item}
                                                onDelete={() => setDeleteTarget(item)}
                                                onScoreChange={handleScoreChange}
                                                onStatusChange={handleStatusChange}
                                                openScoreDropdown={openScoreDropdown}
                                                setOpenScoreDropdown={setOpenScoreDropdown}
                                            />
                                        )
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                animeTitle={deleteTarget?.anime_title || ""}
                isDeleting={isDeleting}
            />
            <Footer />
        </div>
    );
}

/* ─── Grid Card ─── */
function GridCard({
    item,
    onDelete,
}: {
    item: UserAnimeListItem;
    onDelete: () => void;
}) {
    return (
        <div className="group relative">
            <Link href={`/anime/${item.mal_id}`}>
                <div
                    className="rounded-2xl overflow-hidden bg-white transition-all duration-300 "
                    style={{ boxShadow: "var(--shadow-card)" }}
                    onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                        "var(--shadow-card-hover)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow = "var(--shadow-card)")
                    }
                >
                    <div className="relative aspect-[2/3] overflow-hidden bg-surface-alt">
                        <img
                            src={item.anime_image_url || ""}
                            alt={item.anime_title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div
                            className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-white text-xs"
                            style={{ backgroundColor: statusColors[item.status] }}
                        >
                            {statusLabels[item.status]}
                        </div>
                        {item.score && (
                            <div
                                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
                                style={{
                                    backgroundColor: "var(--color-overlay-badge)",
                                    backdropFilter: "blur(4px)",
                                    color: "var(--color-star)",
                                }}
                            >
                                <Star size={10} fill="currentColor" />
                                <span className="text-white">{item.score}</span>
                            </div>
                        )}
                    </div>
                    <div className="p-3">
                        <h3
                            className="text-text-primary truncate text-[1.15rem] leading-snug font-medium uppercase"
                            style={{ fontFamily: "var(--font-bebas-neue), sans-serif", letterSpacing: "0.01em" }}
                        >
                            {item.anime_title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1" style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                            {item.anime_type || "—"} · {item.anime_year || "—"}
                        </p>
                    </div>
                </div>
            </Link>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                }}
                className="absolute md:opacity-0 group-hover:opacity-100 transition-all duration-200 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 z-10"
                style={{
                    top: "auto",
                    right: "8px",
                    bottom: "52px",
                    backgroundColor: "var(--color-glass-white-90)",
                    backdropFilter: "blur(4px)",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-error)";
                    e.currentTarget.style.color = "#FFFFFF";
                    e.currentTarget.style.boxShadow = "var(--shadow-delete-hover)";
                    e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-glass-white-90)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "scale(1)";
                }}
            >
                <Trash2 size={13} />
            </button>
        </div>
    );
}

/* ─── List Card ─── */
function ListCard({
    item,
    onDelete,
    onScoreChange,
    onStatusChange,
    openScoreDropdown,
    setOpenScoreDropdown,
}: {
    item: UserAnimeListItem;
    onDelete: () => void;
    onScoreChange: (malId: number, score: number) => void;
    onStatusChange: (malId: number, status: AnimeStatus) => void;
    openScoreDropdown: number | null;
    setOpenScoreDropdown: (id: number | null) => void;
}) {
    const [showStatus, setShowStatus] = useState(false);
    const isScoreOpen = openScoreDropdown === item.mal_id;

    return (
        <div
            className="flex items-center gap-4 bg-white rounded-2xl p-3 pr-5 hover:shadow-md transition-all"
            style={{ boxShadow: "var(--shadow-soft)" }}
        >
            <Link href={`/anime/${item.mal_id}`} className="shrink-0">
                <img
                    src={item.anime_image_url || ""}
                    alt={item.anime_title}
                    className="w-14 h-20 rounded-xl object-cover"
                    loading="lazy"
                />
            </Link>

            <div className="flex-1 min-w-0">
                <Link href={`/anime/${item.mal_id}`}>
                    <h4
                        className="text-text-primary font-medium text-[1.15rem] truncate transition-colors"
                        style={{ fontFamily: "var(--font-bebas-neue), sans-serif", letterSpacing: "0.01em" }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = statusColors[item.status];
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "";
                        }}
                    >
                        {item.anime_title}
                    </h4>
                </Link>
                <p className="text-gray-400 text-xs" style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                    {item.anime_type || "—"} · {item.anime_year || "—"}
                </p>
            </div>

            {/* Status selector */}
            <div className="relative hidden sm:block">
                <button
                    onClick={() => {
                        setShowStatus(!showStatus);
                        setOpenScoreDropdown(null);
                    }}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-colors"
                    style={{
                        backgroundColor: statusColors[item.status] + "15",
                        color: statusColors[item.status],
                    }}
                >
                    <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: statusColors[item.status] }}
                    />
                    {statusLabels[item.status]}
                    <ChevronDown size={12} />
                </button>

                {showStatus && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowStatus(false)}
                        />
                        <div
                            className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-surface-alt overflow-hidden z-20"
                            style={{ boxShadow: "var(--shadow-dropdown)" }}
                        >
                            {Object.entries(statusLabels).map(([status, label]) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        onStatusChange(item.mal_id, status as AnimeStatus);
                                        setShowStatus(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover flex items-center gap-2 transition-colors"
                                    style={{
                                        color:
                                            item.status === status ? statusColors[status] : "var(--color-text-primary)",
                                        fontWeight: item.status === status ? 600 : 400,
                                    }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: statusColors[status] }}
                                    />
                                    {label}
                                    {item.status === status && (
                                        <Check size={12} className="ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Score */}
            <div className="relative hidden sm:block">
                <button
                    onClick={() => {
                        setOpenScoreDropdown(isScoreOpen ? null : item.mal_id);
                        setShowStatus(false);
                    }}
                    className="flex items-center gap-1 px-3 h-8 rounded-lg text-xs text-gray-700 hover:bg-surface-alt transition-colors border border-border"
                >
                    <Star
                        size={12}
                        fill={item.score ? "var(--color-star)" : "none"}
                        style={{ color: item.score ? "var(--color-star)" : "var(--color-text-disabled)" }}
                    />
                    {item.score ? `${item.score}/10` : "—"}
                </button>

                {isScoreOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenScoreDropdown(null)}
                        />
                        <div
                            className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-surface-alt overflow-hidden z-20 max-h-[300px] overflow-y-auto"
                            style={{ boxShadow: "var(--shadow-dropdown)" }}
                        >
                            {[...Array(10)].map((_, i) => {
                                const score = i + 1;
                                const isSelected = item.score === score;
                                return (
                                    <button
                                        key={score}
                                        onClick={() => onScoreChange(item.mal_id, score)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover flex items-center gap-2 transition-colors"
                                        style={{
                                            color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                                            fontWeight: isSelected ? 600 : 400,
                                        }}
                                    >
                                        <Star
                                            size={10}
                                            fill="var(--color-star)"
                                            style={{ color: "var(--color-star)" }}
                                        />
                                        {score}
                                        <span className="text-gray-400">/10</span>
                                        {isSelected && (
                                            <Check size={10} className="ml-auto text-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <button
                onClick={onDelete}
                className="p-2 rounded-lg text-gray-400 hover:text-error hover:bg-red-50 transition-colors shrink-0"
            >
                <Trash2 size={15} />
            </button>
        </div>
    );
}
