import * as SecureStore from "expo-secure-store";

// The backend is self-hostable, so the server address is chosen at runtime (see the
// settings wheel on index) and persisted. Every URL is derived from the live origin
// on demand — never captured into a module-load constant — so switching servers takes
// effect immediately without reloading the app.

const DEFAULT_ORIGIN = "http://192.168.178.24:8090";
const SERVER_KEY = "serverOrigin";

let origin = DEFAULT_ORIGIN;
let apiBase = origin + "/api";
let wssBase = "ws://192.168.178.24:8090/game";

// Normalize a user-entered origin: default a missing scheme to http://, drop any
// trailing slashes so appended paths don't double up.
function normalizeOrigin(raw: string): string {
    let value = raw.trim();
    if (!/^wss?:\/\//i.test(value) && !/^https?:\/\//i.test(value)) {
        value = "http://" + value;
    }
    return value.replace(/\/+$/, "");
}

function deriveFrom(clean: string) {
    origin = clean;
    apiBase = clean + "/api";
    // http -> ws, https -> wss (the trailing "s" is preserved by only replacing "http").
    wssBase = clean.replace(/^http/i, "ws") + "/game";
}

export function getServerOrigin(): string {
    return origin;
}
export function setServerOrigin(raw: string) {
    deriveFrom(normalizeOrigin(raw));
}

// Load the persisted server on startup, before anything hits the network.
export async function loadServerConfig() {
    const stored = await SecureStore.getItemAsync(SERVER_KEY);
    if (stored) setServerOrigin(stored);
}
// Apply and persist a newly chosen server.
export async function saveServerConfig(raw: string) {
    setServerOrigin(raw);
    await SecureStore.setItemAsync(SERVER_KEY, origin);
}

export function apiBaseUrl(): string { return apiBase; }
export function wssBaseUrl(): string { return wssBase; }

export function loginUrl(): string { return apiBase + "/auth/login"; }
export function registerUrl(): string { return apiBase + "/auth/register"; }
export function verifyUrl(): string { return apiBase + "/auth/verify"; }
export function refreshUrl(): string { return apiBase + "/auth/get-access-token"; }

export function uploadUrl(): string { return apiBase + "/data/upload"; }
export function deleteUrl(): string { return apiBase + "/data/delete"; }

// tiktok_video_media streams through the backend proxy (see media_renderers). The
// proxy forwards to the CDN with the right cookie and streams the response (200/206)
// back. Endpoint: /api/stream/tiktok/{roomId}/{postId}.
export function tiktokStreamUrl(roomId: string, postId: string): string {
    return `${apiBase}/stream/tiktok/${encodeURIComponent(roomId)}/${encodeURIComponent(postId)}`;
}
