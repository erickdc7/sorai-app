const JIKAN_BASE = "https://api.jikan.moe/v4";

class JikanError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = "JikanError";
        this.status = status;
    }
}

async function jikanFetch<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${JIKAN_BASE}${endpoint}`);

    if (res.status === 429) {
        throw new JikanError(
            "Too many requests. Please wait a moment and try again.",
            429
        );
    }

    if (!res.ok) {
        throw new JikanError(
            `Error al conectar con la API de anime (${res.status})`,
            res.status
        );
    }

    return res.json();
}

export async function getTopAnime(
    filter: string = "bypopularity",
    limit: number = 12,
    page: number = 1
) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/top/anime?filter=${filter}&limit=${limit}&page=${page}`);
    return data;
}

export async function getSeasonNow(limit: number = 12, page: number = 1) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/seasons/now?limit=${limit}&page=${page}`);
    return data;
}

export async function searchAnime(
    query: string,
    page: number = 1,
    limit: number = 16
) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return data;
}

export async function getAnimeById(id: number) {
    const data = await jikanFetch<{ data: any }>(`/anime/${id}/full`);
    return data.data;
}

export async function getAnimeCharacters(id: number) {
    const data = await jikanFetch<{ data: any[] }>(`/anime/${id}/characters`);
    return data.data;
}

export async function getAnimeEpisodes(id: number) {
    const data = await jikanFetch<{ data: any[] }>(`/anime/${id}/episodes`);
    return data.data;
}

export async function getAnimeRelations(id: number) {
    const data = await jikanFetch<{ data: any[] }>(`/anime/${id}/relations`);
    return data.data;
}

export async function getAnimeRecommendations(id: number) {
    const data = await jikanFetch<{ data: any[] }>(
        `/anime/${id}/recommendations`
    );
    return data.data;
}

export { JikanError };
