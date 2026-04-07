const JIKAN_BASE = "https://api.jikan.moe/v4";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

class JikanError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = "JikanError";
        this.status = status;
    }
}

function getCached<T>(key: string): T | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) {
            sessionStorage.removeItem(key);
            return null;
        }
        return data as T;
    } catch {
        return null;
    }
}

function setCache(key: string, data: unknown) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
        // Storage full — clear old entries
        sessionStorage.clear();
    }
}

async function jikanFetch<T>(endpoint: string): Promise<T> {
    const cacheKey = `jikan:${endpoint}`;

    // Return cached data if available
    if (typeof window !== "undefined") {
        const cached = getCached<T>(cacheKey);
        if (cached) return cached;
    }

    const res = await fetch(`${JIKAN_BASE}${endpoint}`);

    if (res.status === 429) {
        throw new JikanError(
            "Too many requests. Please wait a moment and try again.",
            429
        );
    }

    if (!res.ok) {
        throw new JikanError(
            `Error connecting to the anime API (${res.status})`,
            res.status
        );
    }

    const data: T = await res.json();

    // Cache successful responses
    if (typeof window !== "undefined") {
        setCache(cacheKey, data);
    }

    return data;
}

export async function getTopAnime(
    filter: string = "bypopularity",
    limit: number = 12,
    page: number = 1,
    type?: string,
    sfw: boolean = true
) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/top/anime?filter=${filter}&limit=${limit}&page=${page}${type ? `&type=${type}` : ""}${sfw ? "&sfw" : ""}`);
    return data;
}

export async function getSeasonNow(limit: number = 12, page: number = 1, sfw: boolean = true, type?: string) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/seasons/now?limit=${limit}&page=${page}${sfw ? "&sfw" : ""}${type ? `&filter=${type}` : ""}`);
    return data;
}

export async function getSeasonUpcoming(limit: number = 12, page: number = 1, sfw: boolean = true, type?: string) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/seasons/upcoming?limit=${limit}&page=${page}${sfw ? "&sfw" : ""}${type ? `&filter=${type}` : ""}`);
    return data;
}

export async function getAnimeByGenre(genreId: number, limit: number = 12, page: number = 1, sfw: boolean = true, type?: string) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/anime?genres=${genreId}&order_by=members&sort=desc&limit=${limit}&page=${page}${sfw ? "&sfw" : ""}${type ? `&type=${type}` : ""}`);
    return data;
}

export async function getSeasonByYear(
    year: number,
    season: string,
    limit: number = 12,
    page: number = 1,
    sfw: boolean = true,
    type?: string
) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/seasons/${year}/${season}?limit=${limit}&page=${page}${sfw ? "&sfw" : ""}${type ? `&filter=${type}` : ""}`);
    return data;
}

export async function searchAnime(
    query: string,
    page: number = 1,
    limit: number = 16,
    sfw: boolean = true,
    type?: string
) {
    const data = await jikanFetch<{
        data: any[];
        pagination: {
            last_visible_page: number;
            has_next_page: boolean;
            current_page: number;
        };
    }>(`/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}${sfw ? "&sfw" : ""}${type ? `&type=${type}` : ""}`);
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
