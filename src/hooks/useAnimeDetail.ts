import { useState, useEffect } from "react";
import {
    getAnimeById,
    getAnimeCharacters,
    getAnimeEpisodes,
    getAnimeRelations,
    getAnimeRecommendations,
    JikanError,
} from "@/lib/jikan";
import type { JikanAnime, JikanCharacter, JikanEpisode } from "@/types/jikan";
import type { CarouselAnimeItem } from "@/components/AnimeHorizontalCarousel";

const RELATION_LABELS: Record<string, string> = {
    Sequel: "Sequel",
    Prequel: "Prequel",
    "Alternative setting": "Alternative Setting",
    "Alternative version": "Alternative Version",
    "Side story": "Side Story",
    "Parent story": "Parent Story",
    Summary: "Summary",
    "Full story": "Full Story",
    Spin_off: "Spin-off",
    "Spin-off": "Spin-off",
    Adaptation: "Adaptation",
    Character: "Character",
    Other: "Other",
};

/**
 * Encapsulates all data-fetching logic for the anime detail page.
 *
 * Returns the core anime data plus related/similar anime, characters,
 * and episodes — each with independent loading states.
 */
export function useAnimeDetail(animeId: number) {
    const [anime, setAnime] = useState<JikanAnime | null>(null);
    const [characters, setCharacters] = useState<JikanCharacter[]>([]);
    const [episodes, setEpisodes] = useState<JikanEpisode[]>([]);
    const [relatedAnime, setRelatedAnime] = useState<CarouselAnimeItem[]>([]);
    const [similarAnime, setSimilarAnime] = useState<CarouselAnimeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingRelated, setLoadingRelated] = useState(true);
    const [loadingSimilar, setLoadingSimilar] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchCore = async () => {
            setLoading(true);
            setLoadingRelated(true);
            setLoadingSimilar(true);
            setError(null);

            try {
                const [animeData, charsData, epsData] = await Promise.all([
                    getAnimeById(animeId),
                    getAnimeCharacters(animeId).catch(() => []),
                    getAnimeEpisodes(animeId).catch(() => []),
                ]);

                if (cancelled) return;
                setAnime(animeData);
                setCharacters(charsData.slice(0, 12));
                setEpisodes(epsData);
            } catch (err) {
                if (cancelled) return;
                if (err instanceof JikanError) {
                    setError(err.message);
                } else {
                    setError("Error loading anime. Please try again.");
                }
            }
            if (!cancelled) setLoading(false);

            // Staggered fetch for relations (avoid 429)
            setTimeout(async () => {
                if (cancelled) return;
                try {
                    const relData = await getAnimeRelations(animeId);
                    const relItems: CarouselAnimeItem[] = [];

                    for (const rel of relData) {
                        const label = RELATION_LABELS[rel.relation] || rel.relation;
                        for (const entry of rel.entry) {
                            if (entry.type === "anime") {
                                relItems.push({
                                    mal_id: entry.mal_id,
                                    title: entry.name,
                                    image_url: "",
                                    relation: label,
                                });
                            }
                        }
                    }

                    // Enrich with images
                    const withImages: CarouselAnimeItem[] = [];
                    for (const item of relItems.slice(0, 10)) {
                        if (cancelled) return;
                        try {
                            await new Promise((r) => setTimeout(r, 200));
                            const d = await getAnimeById(item.mal_id);
                            withImages.push({
                                ...item,
                                image_url:
                                    d.images?.webp?.large_image_url ||
                                    d.images?.jpg?.large_image_url ||
                                    d.images?.jpg?.image_url ||
                                    "",
                                type: d.type || null,
                                year: d.year || d.aired?.prop?.from?.year || null,
                                score: d.score || null,
                            });
                        } catch { }
                        if (!cancelled) setRelatedAnime([...withImages]);
                    }
                } catch { }
                if (!cancelled) setLoadingRelated(false);

                // Staggered fetch for recommendations
                setTimeout(async () => {
                    if (cancelled) return;
                    try {
                        const recData = await getAnimeRecommendations(animeId);
                        const baseItems = recData
                            .slice(0, 8)
                            .map((rec) => ({
                                mal_id: rec.entry?.mal_id,
                                title: rec.entry?.title || "",
                                image_url:
                                    rec.entry?.images?.webp?.large_image_url ||
                                    rec.entry?.images?.jpg?.large_image_url ||
                                    rec.entry?.images?.jpg?.image_url ||
                                    "",
                                type: null as string | null,
                                year: null as number | null,
                                score: null as number | null,
                            }))
                            .filter((i) => i.mal_id && i.image_url);

                        const enriched: CarouselAnimeItem[] = [];
                        for (const item of baseItems) {
                            if (cancelled) return;
                            try {
                                await new Promise((r) => setTimeout(r, 200));
                                const d = await getAnimeById(item.mal_id);
                                enriched.push({
                                    ...item,
                                    type: d.type || null,
                                    year: d.year || d.aired?.prop?.from?.year || null,
                                    score: d.score || null,
                                });
                            } catch {
                                enriched.push(item);
                            }
                            if (!cancelled) setSimilarAnime([...enriched]);
                        }
                    } catch { }
                    if (!cancelled) setLoadingSimilar(false);
                }, 600);
            }, 600);
        };

        fetchCore();

        return () => {
            cancelled = true;
        };
    }, [animeId]);

    return {
        anime,
        characters,
        episodes,
        relatedAnime,
        similarAnime,
        loading,
        loadingRelated,
        loadingSimilar,
        error,
    };
}
