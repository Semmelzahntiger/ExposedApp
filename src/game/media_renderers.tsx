import React, {useEffect, useState} from "react";
import {FlatList, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {Image} from "expo-image";
import {useVideoPlayer, VideoView} from "expo-video";
import {useAudioPlayer} from "expo-audio";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {tiktokStreamUrl} from "@/config/endpoints";
import {getAccessToken} from "@/main/account_data";
import {
    DistinctionType,
    InstagramMediaType,
    MediaItem,
    MissingMediaItem,
    StringMediaItem,
    TikTokSlideshowItem,
    TikTokVideoItem,
} from "@/main/MessageProtocol";

/* ------------------------------------------------------------------ */
/* Media renderers                                                     */
/*                                                                     */
/* One renderer per media-item kind, keyed by distinctionType (see     */
/* BrainRotBackend/docs/media-item-protocol.md). The mapped type over  */
/* DistinctionType makes a missing renderer a compile error, so a new  */
/* backend kind cannot be forgotten here. RoundMedia is the single     */
/* dispatch point; screens never branch on the kind themselves.        */
/* ------------------------------------------------------------------ */

type Page = {width: number; height: number};

/* ---- Primitives --------------------------------------------------- */

// A natively played video. `headers` are attached to the media request
// (expo-video supports this on Android and iOS). Only plays while `active`.
export function NativeVideo({uri, headers, active, page}: {
    uri: string;
    headers?: Record<string, string>;
    active: boolean;
    page: Page;
}) {
    const [error, setError] = useState<string | null>(null);
    const player = useVideoPlayer({uri, headers}, (p) => {
        p.loop = true;
        p.muted = false;
        if (active) p.play();
    });
    useEffect(() => {
        if (active) player.play();
        else player.pause();
    }, [active, player]);

    // Load logging: expo-video reports failures (403, network, codec) via statusChange,
    // otherwise they're silent. Logs every transition and surfaces the error on screen.
    useEffect(() => {
        const headerKeys = headers ? Object.keys(headers).join(", ") : "none";
        console.log(`[video] loading uri=${uri} headers=[${headerKeys}]`);
        const sub = player.addListener("statusChange", ({status, error: err}) => {
            if (err) {
                console.warn(`[video] status=${status} error="${err.message}" uri=${uri}`);
                setError(err.message);
            } else {
                console.log(`[video] status=${status} uri=${uri}`);
                if (status === "readyToPlay") setError(null);
            }
        });
        return () => sub.remove();
        // player is stable while the source value is unchanged (expo-video keys on it).
    }, [player, uri]);

    return (
        <View style={page}>
            <VideoView player={player} style={page} contentFit="contain" nativeControls={false}/>
            {error && (
                <View style={s.videoError}>
                    <Text style={s.videoErrorText}>Video failed to load</Text>
                    <Text style={s.videoErrorDetail}>{error}</Text>
                </View>
            )}
        </View>
    );
}

export function NativeImage({uri, page}: {uri: string; page: Page}) {
    return <Image source={{uri}} style={page} contentFit="contain" transition={100}/>;
}

// Horizontally paged carousel with a dotted position bar. Only the visible
// page is `active`, so a video swiped out of view pauses. A single page is
// rendered directly without the bar.
export function MediaCarousel({count, renderPage}: {
    count: number;
    renderPage: (index: number, active: boolean, page: Page) => React.ReactNode;
}) {
    const insets = useSafeAreaInsets();
    const {width, height} = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const page: Page = {width, height};

    if (count === 0) return <View style={s.fill}/>;
    if (count === 1) return <>{renderPage(0, true, page)}</>;

    const indices = Array.from({length: count}, (_, i) => i);
    return (
        <View style={s.fill}>
            <FlatList
                data={indices}
                keyExtractor={(i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                renderItem={({item: i}) => <View style={page}>{renderPage(i, i === activeIndex, page)}</View>}
            />
            <View style={[s.dots, {top: insets.top + 64}]}>
                {indices.map((i) => (
                    <View key={i} style={[s.dot, i === activeIndex && s.dotActive]}/>
                ))}
            </View>
        </View>
    );
}

/* ---- Renderers, one per kind ------------------------------------- */

function InstagramMixedView({item}: {item: InstagramMediaType}) {
    const entries = item.entries ?? [];
    return (
        <MediaCarousel
            count={entries.length}
            renderPage={(i, active, page) => {
                const entry = entries[i];
                if (entry.type === "IMAGE") {
                    return <NativeImage uri={entry.url} page={page}/>;
                }
                return <NativeVideo uri={entry.url} active={active} page={page}/>;
            }}
        />
    );
}

function TikTokSlideshowView({item}: {item: TikTokSlideshowItem}) {
    const images = item.imageUrls ?? [];
    // One audio player for the whole slideshow. It lives here, not per slide, so it
    // keeps playing across swipes and stops when this renderer unmounts (next round).
    const audio = useAudioPlayer(item.audioUrl ? {uri: item.audioUrl} : null);
    useEffect(() => {
        if (!item.audioUrl) return;
        audio.loop = true;
        audio.play();
        return () => {
            audio.pause();
        };
    }, [audio, item.audioUrl]);
    return (
        <MediaCarousel
            count={images.length}
            renderPage={(i, _active, page) => <NativeImage uri={images[i]} page={page}/>}
        />
    );
}

// TikTok's video host fingerprints the HTTP client and 403s the app's stack even
// when every header is correct, so the video is played through the backend proxy
// (see tiktokStreamUrl). The proxy attaches the CDN cookie and streams it back. The
// proxy lives under /api/**, which the backend guards with JWT, so the request
// carries the same Bearer token the app's other API calls use.
function TikTokVideoView({item}: {item: TikTokVideoItem}) {
    const {width, height} = useWindowDimensions();
    const token = getAccessToken();
    const headers = token ? {Authorization: `Bearer ${token}`} : undefined;
    return <NativeVideo uri={tiktokStreamUrl(item.roomId, item.postId)} headers={headers} active page={{width, height}}/>;
}

function StringMediaItemView({item}: {item: StringMediaItem}) {
    return (
        <View style={s.center}>
            <Text style={s.caption}>{item.platform}</Text>
            <Text style={s.quote}>“{item.stringMedia}”</Text>
        </View>
    );
}

function MissingMediaItemView({item}: {item: MissingMediaItem}) {
    return (
        <View style={s.center}>
            <Text style={s.caption}>{item.platform}</Text>
            <Text style={s.missing}>This content couldn’t be resolved.</Text>
        </View>
    );
}

/* ---- Registry ----------------------------------------------------- */

export const MEDIA_RENDERERS: {
    [K in DistinctionType]: React.ComponentType<{item: Extract<MediaItem, {distinctionType: K}>}>;
} = {
    instagram_mixed_media: InstagramMixedView,
    tiktok_slide_show_media: TikTokSlideshowView,
    tiktok_video_media: TikTokVideoView,
    string_media_item: StringMediaItemView,
    missing_media: MissingMediaItemView,
};

export const DISTINCTION_TYPES = Object.keys(MEDIA_RENDERERS) as DistinctionType[];

export function isDistinctionType(value: string): value is DistinctionType {
    return (DISTINCTION_TYPES as string[]).includes(value);
}

// The single dispatch point: pick the renderer for the item's kind.
export function RoundMedia({item}: {item: MediaItem}) {
    const Renderer = MEDIA_RENDERERS[item.distinctionType] as React.ComponentType<{item: MediaItem}>;
    return <Renderer item={item}/>;
}

const s = StyleSheet.create({
    fill: {
        flex: 1,
        backgroundColor: "#000000",
    },
    dots: {
        position: "absolute",
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.35)",
    },
    dotActive: {
        backgroundColor: "#FFFFFF",
    },
    center: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        gap: 12,
    },
    caption: {
        color: "#8a90a0",
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    quote: {
        color: "#FFFFFF",
        fontSize: 26,
        fontStyle: "italic",
        fontWeight: "600",
        textAlign: "center",
    },
    missing: {
        color: "#8a90a0",
        fontSize: 18,
        textAlign: "center",
    },
    videoError: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        gap: 8,
    },
    videoErrorText: {
        color: "#ff6b6b",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    videoErrorDetail: {
        color: "#8a90a0",
        fontSize: 13,
        textAlign: "center",
    },
});
