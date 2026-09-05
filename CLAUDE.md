@AGENTS.md

# br-frontend

React Native (**Expo SDK 57**, expo-router, TypeScript) frontend for **BrainRot** — a
WebSocket party game where players watch social-media "brain rot" (Instagram/TikTok reels,
posts, slideshows) and guess which participant it belongs to. The Java backend lives in a
sibling repo `../BrainRotBackend` (its `docs/media-item-protocol.md` defines the media wire
format).

## Golden rules
- **Expo v57 changed things** — read https://docs.expo.dev/versions/v57.0.0/ for any Expo
  API before writing code (see AGENTS.md).
- **Typecheck:** `npx tsc --noEmit 2>&1 | grep -E "^src/"`. Filter to `^src/` — reanimated's
  own source emits unrelated `node_modules` errors that are not ours.
- **Native modules:** always `npx expo install <pkg>` (never bare npm), so versions match SDK 57.
- **Testing runs in Expo Go.** Every native module used is a standard Expo SDK module included
  in Expo Go, so `npx expo start` → Expo Go works; no APK/dev-build needed. A dev build is only
  required if a *non-SDK* native module or a config-plugin *option* (e.g. background playback)
  is added. JS changes hot-reload either way.

## Layout
- `src/app/**` — expo-router routes. `index` → `login`/`register` → `menu/` group →
  `game/` group. Root `_layout.tsx` wraps everything in `AuthProvider` + `ConnectionProvider`.
- `src/main/**` — infrastructure: `MessageProtocol.ts` (all WS message types), `connection*.ts`
  (socket + listener registry), `auth_provider.tsx` / `account_data.ts` (JWT auth),
  `GameData.ts` (shared types).
- `src/game/**` — game runtime: `media_renderers.tsx` (renders a round's media),
  `game_data.ts` (participants set by `started_game`).
- `src/components/**`, `src/styles/**` — shared UI + style tokens (`room_style.tsx` exports
  `ACCENT`/`SURFACE`/`MUTED`).

## Auth (account_data.ts)
- JWT bearer. **The `/login` response field for the access token is `authToken`** — not
  `accessToken`, not `token`. `/refresh` returns `{ token }`. This asymmetry has bitten before;
  `getAccessToken()` / `getRefreshToken()` are the accessors.
- After manual login, `login.tsx` drives `router.replace("/game/menu")` itself once connected —
  `index`'s `<Redirect>` can't, since it's a background screen in the stack.

## Connection (connection_data.ts / connection_provider.tsx)
- One WebSocket. Inbound: `addListener("<type>", handler)` returns an unsubscribe fn (register
  in a `useEffect`, clean up on unmount). Outbound: `getConnection()?.sendMessage({...})`.
- `AppState` listener **reconnects on foreground**: Android drops the socket while a native
  picker/file dialog backgrounds the app; the reconnect is transparent. You cannot keep a
  backgrounded socket alive from JS.

## Media protocol — the core of the game
`NextRoundMessage` = `{ type: "next_round", mediaItem: MediaItem }`. `MediaItem` is a
**discriminated union on `distinctionType`** (mirrors backend `docs/media-item-protocol.md`),
five kinds: `instagram_mixed_media` (`entries: {type:IMAGE|VIDEO,url}[]`),
`tiktok_slide_show_media` (`imageUrls[]` + looping `audioUrl`), `tiktok_video_media`
(`postId`,`roomId` — played through the backend stream proxy, not a direct URL),
`string_media_item` (`stringMedia`), `missing_media`.

Rendering lives in **`src/game/media_renderers.tsx`**: `MEDIA_RENDERERS` is a
`Record<DistinctionType, Component>` — **exhaustive by type**, so adding a backend kind is a
compile error until it has a renderer. `RoundMedia` is the single dispatch point; screens never
branch on kind. Carousels (`MediaCarousel`) page horizontally with a dot bar and pause the
non-visible video. All media are **direct CDN URLs played natively** (`expo-video` /
`expo-image` / `expo-audio`) — there is **no WebView** anymore (`react-native-webview` was removed).

## The active game screen
**`src/app/game/game_screen.tsx`** is the real, self-contained game screen: it applies rounds via
`applyRound`, runs the round countdown, and hosts the between-rounds scoreboard and game-over modals.
(The former `src/app/debug/debug_game_screen.tsx` hand-crafting harness was removed after the first
draft.)

## TikTok video 403 — resolved via backend stream proxy
`tiktok_video_media` plays from **tiktok.com** hosts (not the open `tiktokcdn.com` used for
TikTok images/audio and Instagram, which all work direct). Its CDN returned **403** to the app
even with every header correct — the block is **TLS/HTTP-client fingerprinting** (JA3 / HTTP-2
profile / header order), a layer beneath headers that `expo-video` gives no access to, so it was
**not fixable client-side** (curl with the same headers 200s from the phone; both ExoPlayer and
RN `fetch`/OkHttp 403).

**Fix (done):** the backend stream-proxies the video. `tiktok_video_media` now carries only
`postId` + `roomId`; the client builds the proxy URL with `tiktokStreamUrl(roomId, postId)`
(`config/endpoints.ts`) → **`/api/stream/tiktok/{roomId}/{postId}`** and plays it with no headers. The
backend forwards to the CDN with the right cookie and streams the response back (200/206, with
`Range` forwarding). See `TikTokVideoView` in `media_renderers.tsx` — a plain `NativeVideo`, no
header block.

## Gotchas
- `GradientBorderBox` / `GradientBorderBoxButton` inner view is `flex:1` — it **collapses to
  zero height unless its parent has a fixed height**. Don't drop it into an auto-height container.
- Custom radios/sliders are hand-built (`ThemedRadio`, the slider's continuous-offset model) —
  RN has no native equivalents; reuse those patterns.
- Screens that must trap the user (running game, menu): `<Stack.Screen options={{gestureEnabled:false}}/>`
  **plus** a focused `BackHandler` returning `true`.
