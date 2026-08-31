import {useCallback, useEffect, useMemo, useState} from "react";
import {View, Text, Pressable, ScrollView, BackHandler, useWindowDimensions} from "react-native";
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from "react-native-reanimated";
import {WebView} from "react-native-webview";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router, Stack, useFocusEffect} from "expo-router";
import {GameEmbed} from "@/main/GameData";
import {game_style} from "@/styles/game_style";
import {addListener} from "@/main/connection_data";

/* ------------------------------------------------------------------ */
/* Embed HTML builders                                                 */
/* ------------------------------------------------------------------ */

function buildInstagramHtml(url: string): string {
    return `
        <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"
            style="margin:0;width:100%;max-width:540px;"></blockquote>
        <script async src="https://www.instagram.com/embed.js"></script>
    `;
}

function tiktokVideoId(url: string): string {
    // e.g. https://www.tiktok.com/@user/video/1234567890  ->  1234567890
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : "";
}

function buildTiktokHtml(url: string): string {
    const id = tiktokVideoId(url);
    return `
        <blockquote class="tiktok-embed" cite="${url}" data-video-id="${id}"
            style="margin:0;max-width:340px;min-width:280px;">
            <section></section>
        </blockquote>
        <script async src="https://www.tiktok.com/embed.js"></script>
    `;
}

function buildEmbedHtml(embed: GameEmbed): {html: string; baseUrl: string} {
    const body = embed.platform === "instagram" ? buildInstagramHtml(embed.url) : buildTiktokHtml(embed.url);
    const baseUrl = embed.platform === "instagram" ? "https://www.instagram.com" : "https://www.tiktok.com";
    const html = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
            <style>
                html, body { margin:0; padding:0; height:100%; background:#000; }
                body { display:flex; align-items:center; justify-content:center; overflow:hidden; }
            </style>
        </head>
        <body>${body}</body>
        </html>`;
    return {html, baseUrl};
}

/* ------------------------------------------------------------------ */
/* Game_screen screen                                                         */
/* ------------------------------------------------------------------ */

export default function Game_screen() {
    const insets = useSafeAreaInsets();
    const {height} = useWindowDimensions();

    // ---- injected round state (drive these from game state / router params later) ----
    const [embed, setEmbed] = useState<GameEmbed>({
        platform: "instagram",
        url: "https://www.instagram.com/reel/C0bZ8m6Iabc/",
    });
    const [score, setScore] = useState(0);
    const [timerLabel, setTimerLabel] = useState("0:00");

    const source = useMemo(() => buildEmbedHtml(embed), [embed]);

    // ---- pull-up sheet (press-to-toggle) ----
    const bandHeight = 56;
    const sheetHeight = Math.round(height * 0.58); // a bit above the middle
    const [sheetOpen, setSheetOpen] = useState(false);

    const translateY = useSharedValue(sheetHeight);
    useEffect(() => {
        translateY.value = withTiming(sheetOpen ? 0 : sheetHeight, {duration: 240});
    }, [sheetOpen, sheetHeight]);
    const sheetStyle = useAnimatedStyle(() => ({transform: [{translateY: translateY.value}]}));

    // Block leaving back to the menu: consume the Android hardware back button
    // while this screen is focused (the swipe gesture is disabled via Stack.Screen below).
    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
            return () => sub.remove();
        }, [])
    );

    useEffect(() => {
        const listeners = [
            addListener("next_round", (msg) => {
                console.log("Next round started")
            }),
            addListener("confirm_submission", (msg) => {
                console.log("Submission started")
            }),
            addListener("denied_submission", (msg) => {
                console.log("Denied submission")
            }),
            addListener("game_score_state", (msg) => {
                console.log("Updated game score state")
            }),
            addListener("game_over", (msg) => {
                console.log("Game over")
            })
        ];
        return () => listeners.forEach((listener) => listener());
    }, []);

    return (
        <View style={game_style.root}>
            <Stack.Screen options={{gestureEnabled: false}}/>
            {/* The embed */}
            <WebView
                style={game_style.webview}
                originWhitelist={["*"]}
                source={{html: source.html, baseUrl: source.baseUrl}}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                bounces={false}
                setBuiltInZoomControls={false}
                allowsInlineMediaPlayback
            />

            {/* Touch lock — swallows every tap so the video can't be paused/interacted with */}
            <View style={game_style.touchLock} onStartShouldSetResponder={() => true}/>

            {/* Leave (top-left) */}
            <Pressable
                style={[game_style.leaveButton, {top: insets.top + 12, left: 16}]}
                onPress={() => router.replace("/game/menu")}
            >
                <Text style={game_style.leaveIcon}>✕</Text>
            </Pressable>

            {/* Timer (top-center) — placeholder for now */}
            <View style={[game_style.timerBox, {top: insets.top + 12}]}>
                <Text style={game_style.timerText}>{timerLabel}</Text>
            </View>

            {/* Score chip (top-right) */}
            <View style={[game_style.scoreChip, {top: insets.top + 12, right: 16}]}>
                <Text style={game_style.scoreText}>{score}</Text>
            </View>

            {/* Dim backdrop while the sheet is open */}
            {sheetOpen && <Pressable style={game_style.sheetBackdrop} onPress={() => setSheetOpen(false)}/>}

            {/* Pull-up band + list sheet.
                paddingBottom = insets.bottom lifts the band/content above the Android nav bar,
                while the container background still fills to the screen edge behind it. */}
            <Animated.View
                style={[
                    game_style.sheetContainer,
                    {height: bandHeight + sheetHeight + insets.bottom, paddingBottom: insets.bottom},
                    sheetStyle,
                ]}
            >
                <Pressable style={[game_style.band, {height: bandHeight}]} onPress={() => setSheetOpen((o) => !o)}>
                    <View style={game_style.bandGrabber}/>
                    <Text style={game_style.bandLabel}>{sheetOpen ? "Close" : "Open"}</Text>
                </Pressable>

                <View style={[game_style.sheetBody, {height: sheetHeight}]}>
                    <ScrollView contentContainerStyle={game_style.sheetBodyContent}>
                        {/* TODO: real list content goes here */}
                        {[1, 2, 3, 4, 5].map((n) => (
                            <View key={n} style={game_style.placeholderRow}>
                                <Text style={game_style.placeholderText}>List item {n} — TBD</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Animated.View>
        </View>
    );
}
