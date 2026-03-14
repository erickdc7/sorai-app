export interface JikanAnime {
    mal_id: number;
    url: string;
    images: {
        jpg: {
            image_url: string;
            small_image_url: string;
            large_image_url: string;
        };
    };
    trailer: {
        youtube_id: string | null;
        url: string | null;
    };
    title: string;
    title_english: string | null;
    title_japanese: string | null;
    type: string | null;
    episodes: number | null;
    status: string | null;
    score: number | null;
    rank: number | null;
    synopsis: string | null;
    year: number | null;
    studios: { mal_id: number; name: string }[];
    genres: { mal_id: number; name: string }[];
    themes: { mal_id: number; name: string }[];
    demographics: { mal_id: number; name: string }[];
    theme?: {
        openings: string[];
        endings: string[];
    };
}

export interface JikanCharacter {
    character: {
        mal_id: number;
        url: string;
        images: {
            jpg: { image_url: string };
        };
        name: string;
    };
    role: string;
    voice_actors: {
        person: {
            mal_id: number;
            name: string;
            images: { jpg: { image_url: string } };
        };
        language: string;
    }[];
}

export interface JikanEpisode {
    mal_id: number;
    title: string;
    title_japanese: string | null;
    aired: string | null;
    filler: boolean;
    recap: boolean;
}

export interface UserAnimeListItem {
    id: string;
    user_id: string;
    mal_id: number;
    status: "watching" | "completed" | "paused" | "dropped" | "planned";
    score: number | null;
    anime_title: string;
    anime_image_url: string | null;
    anime_year: number | null;
    anime_type: string | null;
    created_at: string;
}

export type AnimeStatus = "watching" | "completed" | "paused" | "dropped" | "planned";

export interface AnimeCardData {
    mal_id: number;
    title: string;
    image_url: string;
    type: string | null;
    year: number | null;
    score: number | null;
}
