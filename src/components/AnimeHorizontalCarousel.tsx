"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const typeColors: Record<string, string> = {
    TV: "#6B3FA0",
    Movie: "#1565C0",
    OVA: "#2E7D32",
    Special: "#D4700A",
    ONA: "#0097A7",
    Music: "#E91E63",
};

export interface CarouselAnimeItem {
    mal_id: number;
    title: string;
    image_url: string;
    type?: string | null;
    year?: number | null;
    score?: number | null;
    relation?: string;
}

interface Props {
    title: string;
    icon: React.ReactNode;
    items: CarouselAnimeItem[];
}

export default function AnimeHorizontalCarousel({ title, icon, items }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", checkScroll, { passive: true });
        window.addEventListener("resize", checkScroll);
        return () => {
            el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [checkScroll, items]);

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.7;
        el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
    };

    if (items.length === 0) return null;

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-text-primary flex items-center gap-2 text-[1.5rem] font-semibold">
                    <span className="w-1 h-5 rounded-full inline-block bg-primary" />
                    {icon}
                    {title}
                </h2>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{
                            backgroundColor: canScrollLeft ? "#F3EBF9" : "#F3F4F6",
                            color: canScrollLeft ? "#6B3FA0" : "#D1D5DB",
                            cursor: canScrollLeft ? "pointer" : "default",
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{
                            backgroundColor: canScrollRight ? "#F3EBF9" : "#F3F4F6",
                            color: canScrollRight ? "#6B3FA0" : "#D1D5DB",
                            cursor: canScrollRight ? "pointer" : "default",
                        }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                {items.map((item) => (
                    <Link
                        key={`${item.mal_id}-${item.relation || ""}`}
                        href={`/anime/${item.mal_id}`}
                        className="group shrink-0"
                        style={{ width: "160px" }}
                    >
                        <div
                            className="rounded-2xl overflow-hidden bg-white transition-all duration-300  "
                            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                            onMouseEnter={(e) =>
                            (e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(107,63,160,0.12)")
                            }
                            onMouseLeave={(e) =>
                            (e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(0,0,0,0.06)")
                            }
                        >
                            <div className="relative aspect-[2/3] overflow-hidden bg-surface-alt">
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                                {item.score && (
                                    <div
                                        className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
                                        style={{
                                            backgroundColor: "rgba(0,0,0,0.55)",
                                            backdropFilter: "blur(4px)",
                                            color: "#FBBF24",
                                        }}
                                    >
                                        <Star size={10} fill="currentColor" />
                                        <span className="text-white">{item.score}</span>
                                    </div>
                                )}
                                {item.type && (
                                    <div
                                        className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-white text-xs font-medium"
                                        style={{
                                            backgroundColor: typeColors[item.type] || "#6B3FA0",
                                        }}
                                    >
                                        {item.type}
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h3
                                    className="text-text-primary truncate text-[0.85rem] leading-snug font-medium mb-1 uppercase"
                                    style={{ fontFamily: "var(--font-bebas-neue), sans-serif", letterSpacing: "0.04em" }}
                                >
                                    {item.title}
                                </h3>
                                <p className="text-gray-400 text-xs" style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                                    {item.relation || (item.year ? String(item.year) : "—")}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Hide scrollbar CSS */}
            <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </section>
    );
}
