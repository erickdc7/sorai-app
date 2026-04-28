import { Music, Play } from "lucide-react";
import type { JikanAnime } from "@/types/jikan";

interface AnimeInfoSidebarProps {
    anime: JikanAnime;
}

export default function AnimeInfoSidebar({ anime }: AnimeInfoSidebarProps) {
    const studio = anime.studios?.[0]?.name || "Unknown";
    const isAiring = anime.status === "Currently Airing";

    return (
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
                        { label: "Status", value: isAiring ? "Airing" : "Finished" },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-start gap-4">
                            <dt className="text-gray-400 text-xs shrink-0">{label}</dt>
                            <dd className="text-gray-700 text-xs text-right font-medium">{value}</dd>
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
                                        <Play size={10} className="text-primary shrink-0" fill="var(--color-primary)" />
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
                                        <Play size={10} className="text-text-secondary shrink-0" fill="var(--color-text-secondary)" />
                                        <span className="text-gray-700">{song}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
