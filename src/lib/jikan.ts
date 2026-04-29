import type {
    JikanAnime,
    JikanCharacter,
    JikanEpisode,
    JikanRelation,
    JikanRecommendation,
    JikanPaginatedResponse,
} from "@/types/jikan";

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

/* ─── Rate-Limited Fetch Queue ─── */

let lastFetchTime = 0;
const MIN_DELAY_MS = 334; // ~3 req/sec max (Jikan allows 3/sec)

/**
 * Ensures a minimum gap between Jikan API calls to prevent 429s.
 * All requests go through the same queue so staggered fetching is automatic.
 */
async function rateLimitedFetch<T>(endpoint: string): Promise<T> {
    const now = Date.now();
    const elapsed = now - lastFetchTime;
    if (elapsed < MIN_DELAY_MS) {
        await new Promise((r) => setTimeout(r, MIN_DELAY_MS - elapsed));
    }
    lastFetchTime = Date.now();
    return jikanFetch<T>(endpoint);
}

/**
 * Processes an array of async tasks sequentially with rate limiting.
 * Calls `onProgress` after each successful task, enabling progressive UI updates.
 */
export async function fetchSequential<TInput, TOutput>(
    items: TInput[],
    fetchFn: (item: TInput) => Promise<TOutput>,
    onProgress?: (results: TOutput[]) => void
): Promise<TOutput[]> {
    const results: TOutput[] = [];
    for (const item of items) {
        try {
            const result = await fetchFn(item);
            results.push(result);
            onProgress?.([...results]);
        } catch {
            // Skip failed items, continue with the rest
        }
    }
    return results;
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
): Promise<JikanPaginatedResponse<JikanAnime>> {
    return jikanFetch<JikanPaginatedResponse<JikanAnime>>(
        `/top/anime?filter=${filter}&limit=${limit}&page=${page}${type ? `&type=${type}` : ""}${sfw ? "&sfw" : ""}`
    );
}

export async function getSeasonNow(
    limit: number = 12,
    page: number = 1,
    sfw: boolean = true,
    type?: string
): Promise<JikanPaginatedResponse<JikanAnime>> {
    return jikanFetch<JikanPaginatedResponse<JikanAnime>>(
        `/seasons/now?limit=${limit}&page=${page}${sfw ? "&sfw" : ""}${type ? `&filter=${type}` : ""}`
    );
}

export async function getSeasonUpcoming(
    limit: number = 12,
    page: number = 1,
    sfw: boolean = true,
    type?: string
): Promise<JikanPaginatedResponse<JikanAnime>> {
    return jikanFetch<JikanPaginatedResponse<JikanAnime>>(
        `/seasons/upcoming?limit=${limit}&page=${page}${sfw ? "&sfw" : ""}${type ? `&filter=${type}` : ""}`
    );
}

export async function getAnimeByGenre(
    genreId: number,
    limit: number = 12,
    page: number = 1,
    sfw: boolean = true,
    type?: string
): Promise<JikanPaginatedResponse<JikanAnime>> {
    return jikanFetch<JikanPaginatedResponse<JikanAnime>>(
        `/anime?genres=${genreId}&order_by=members&sort=desc&limit=${limit}&page=${page}${sfw ? "&sfw" : ""}${type ? `&type=${type}` : ""}`
    );
}

export async function getSeasonByYear(
    year: number,
    season: string,
    limit: number = 12,
    page: number = 1,
    sfw: boolean = true,
    type?: string
): Promise<JikanPaginatedResponse<JikanAnime>> {
    return jikanFetch<JikanPaginatedResponse<JikanAnime>>(
        `/seasons/${year}/${season}?limit=${limit}&page=${page}${sfw ? "&sfw" : ""}${type ? `&filter=${type}` : ""}`
    );
}

export async function searchAnime(
    query: string,
    page: number = 1,
    limit: number = 16,
    sfw: boolean = true,
    type?: string
): Promise<JikanPaginatedResponse<JikanAnime>> {
    return jikanFetch<JikanPaginatedResponse<JikanAnime>>(
        `/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}${sfw ? "&sfw" : ""}${type ? `&type=${type}` : ""}`
    );
}

export async function getAnimeById(id: number): Promise<JikanAnime> {
    const data = await jikanFetch<{ data: JikanAnime }>(`/anime/${id}/full`);
    return data.data;
}

export async function getAnimeCharacters(id: number): Promise<JikanCharacter[]> {
    const data = await jikanFetch<{ data: JikanCharacter[] }>(`/anime/${id}/characters`);
    return data.data;
}

export async function getAnimeEpisodes(id: number): Promise<JikanEpisode[]> {
    const data = await jikanFetch<{ data: JikanEpisode[] }>(`/anime/${id}/episodes`);
    return data.data;
}

export async function getAnimeRelations(id: number): Promise<JikanRelation[]> {
    const data = await jikanFetch<{ data: JikanRelation[] }>(`/anime/${id}/relations`);
    return data.data;
}

export async function getAnimeRecommendations(id: number): Promise<JikanRecommendation[]> {
    const data = await jikanFetch<{ data: JikanRecommendation[] }>(
        `/anime/${id}/recommendations`
    );
    return data.data;
}

export { JikanError };

/**
 * Rate-limited version of getAnimeById for sequential enrichment loops.
 * Automatically waits between requests to avoid 429s.
 */
export async function getAnimeByIdThrottled(id: number): Promise<JikanAnime> {
    const data = await rateLimitedFetch<{ data: JikanAnime }>(`/anime/${id}/full`);
    return data.data;
}
