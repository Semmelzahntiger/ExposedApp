import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    Animated,
    BackHandler,
    FlatList,
    Modal,
    PanResponder,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    useWindowDimensions,
} from "react-native";
import {setAudioModeAsync} from "expo-audio";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router, Stack, useFocusEffect} from "expo-router";
import {GameOverMessage, MediaItem, NextRoundMessage, Participant, UpdateGameScoreStateMessage} from "@/main/MessageProtocol";
import {addListener, getConnection} from "@/main/connection_data";
import {getParticipants} from "@/game/game_data";
import {isDistinctionType, RoundMedia} from "@/game/media_renderers";

// Self-contained palette (matches the rest of the app).
const ACCENT = "#0084bd";
const SURFACE = "#111318";
const MUTED = "#2a2f3a";
const TEXT_DIM = "#8a90a0";

const HANDLE_HEIGHT = 48;

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

// Whole seconds -> "m:ss".
function formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

// 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11 -> "11th" ...
function ordinal(n: number): string {
    const rem100 = n % 100;
    if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
    switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
    }
}

/* ------------------------------------------------------------------ */
/* Game screen                                                         */
/* ------------------------------------------------------------------ */

export default function Game_screen() {
    const insets = useSafeAreaInsets();
    const {height} = useWindowDimensions();

    // ---- round state ----
    // `roundId` keys the media so a new round always remounts its players, even
    // when the URLs happen to be identical to the previous round.
    const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
    const [roundId, setRoundId] = useState(0);
    const [score, setScore] = useState(0);

    // ---- round countdown ----
    // Seconds left in the current round (null before the first round). The round's
    // length arrives on next_round; roundDurationRef carries it into the countdown
    // effect, which is keyed on roundId so each new round restarts the clock.
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const roundDurationRef = useRef(0);

    // ---- between-rounds scoreboard ----
    // Non-null while the scoreboard modal is shown (set by game_score_state,
    // force-cleared by next_round). pendingOwnScoreRef carries the local player's
    // new total so next_round can push it into the top-right chip without reading
    // stale state inside the (empty-dep) listener closure.
    const [scoreboard, setScoreboard] = useState<UpdateGameScoreStateMessage | null>(null);
    const pendingOwnScoreRef = useRef(0);

    // ---- game over ----
    // Non-null once the game ends; shows the final-results modal. Unmounting the
    // media while it's set stops any video/audio so nothing plays behind the modal.
    const [gameOver, setGameOver] = useState<GameOverMessage | null>(null);

    // ---- participants + guess lock ----
    // Filled by started_game (setParticipants) right before this screen opens.
    const participants = useMemo(() => getParticipants(), []);
    const [locked, setLocked] = useState(false);
    const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

    const onEntryPress = (participant: Participant) => {
        if (locked) return;
        setSelectedUuid(participant.uuid);
        setLocked(true); // stays locked until the next next_round
        getConnection()?.sendMessage({
            type: "submit_guess",
            guessedUUID: participant.uuid,
        });
    };

    // next_round -> screen state. An unknown distinctionType is ignored rather than
    // rendered as a broken round.
    const applyRound = (msg: NextRoundMessage) => {
        const item = msg.mediaItem;
        if (!item || !isDistinctionType(item.distinctionType)) {
            console.warn("next_round with unknown media item, ignoring:", item?.distinctionType);
            return;
        }
        roundDurationRef.current = msg.roundTimeInSeconds;
        setMediaItem(item);
        setRoundId((n) => n + 1); // also restarts the countdown effect
        setLocked(false); // entries become pressable again
        setSelectedUuid(null);
    };

    // Play through the iOS silent switch (slideshow audio and video sound alike).
    useEffect(() => {
        setAudioModeAsync({playsInSilentMode: true}).catch(() => {});
    }, []);

    // Round countdown. Restarts whenever roundId changes (i.e. on next_round). Time
    // left is derived from a wall-clock delta rather than a decrement, so it can't
    // drift; message latency makes the start a hair late, which is negligible.
    useEffect(() => {
        const total = roundDurationRef.current;
        if (roundId === 0 || total <= 0) return; // no round started yet
        setSecondsLeft(total);
        const startedAt = Date.now();
        const id = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const left = Math.max(0, total - elapsed);
            setSecondsLeft(left);
            if (left <= 0) clearInterval(id);
        }, 250);
        return () => clearInterval(id);
    }, [roundId]);

    // ---- pull-up sheet (drag the handle, or tap it to toggle) ----
    const sheetBodyHeight = Math.round(height * 0.55);
    const bodyHeightRef = useRef(sheetBodyHeight);
    bodyHeightRef.current = sheetBodyHeight;

    const translateY = useRef(new Animated.Value(sheetBodyHeight)).current;
    const [sheetOpen, setSheetOpen] = useState(false);
    const openRef = useRef(false);
    const dragStartRef = useRef(sheetBodyHeight);

    const snapTo = useCallback((open: boolean) => {
        openRef.current = open;
        setSheetOpen(open);
        Animated.spring(translateY, {
            toValue: open ? 0 : bodyHeightRef.current,
            useNativeDriver: true,
            bounciness: 2,
        }).start();
    }, [translateY]);

    const handlePan = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            dragStartRef.current = openRef.current ? 0 : bodyHeightRef.current;
        },
        onPanResponderMove: (_e, g) => {
            translateY.setValue(clamp(dragStartRef.current + g.dy, 0, bodyHeightRef.current));
        },
        onPanResponderRelease: (_e, g) => {
            if (Math.abs(g.dy) < 6) { // a tap on the handle toggles
                snapTo(!openRef.current);
                return;
            }
            const max = bodyHeightRef.current;
            const y = clamp(dragStartRef.current + g.dy, 0, max);
            const open = g.vy < -0.3 ? true : g.vy > 0.3 ? false : y < max / 2;
            snapTo(open);
        },
        onPanResponderTerminate: () => snapTo(openRef.current),
    }), [snapTo, translateY]);

    // ---- block back navigation out of a running game ----
    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
            return () => sub.remove();
        }, [])
    );

    // ---- backend events ----
    useEffect(() => {
        const listeners = [
            addListener("next_round", (msg) => {
                console.log("Next round started");
                // Force the scoreboard closed and reveal the local player's new total.
                setScoreboard(null);
                setScore(pendingOwnScoreRef.current);
                applyRound(msg);
            }),
            addListener("confirm_submission", (msg) => {
                console.log("Submission confirmed");
            }),
            addListener("denied_submission", (msg) => {
                console.log("Denied submission");
            }),
            addListener("game_score_state", (msg) => {
                console.log("Updated game score state");
                const own = msg.players.find((p) => p.playerUUID === msg.ownUUID);
                if (own) pendingOwnScoreRef.current = own.score;
                setScoreboard(msg);
            }),
            addListener("game_over", (msg) => {
                console.log("Game over");
                setScoreboard(null); // never let the scoreboard linger into game over
                setGameOver(msg);
            }),
        ];
        return () => listeners.forEach((remove) => remove());
    }, []);

    return (
        <View style={s.root}>
            <Stack.Screen options={{gestureEnabled: false}}/>

            {/* The round's media — full screen, rendered by its distinctionType.
                Unmounted once the game is over so its video/audio stops playing. */}
            {mediaItem && gameOver === null ? <RoundMedia key={roundId} item={mediaItem}/> : <View style={s.fill}/>}

            {/* Top-left: leave game */}
            <Pressable style={[s.leaveButton, {top: insets.top + 12, left: 16}]} onPress={() => router.replace("/game/game_menu")}>
                <Text style={s.leaveIcon}>✕</Text>
            </Pressable>

            {/* Top-center: timer */}
            <View style={[s.timerBox, {top: insets.top + 12}]}>
                <Text style={s.chipText}>{secondsLeft === null ? "0:00" : formatTime(secondsLeft)}</Text>
            </View>

            {/* Top-right: score */}
            <View style={[s.scoreChip, {top: insets.top + 12, right: 16}]}>
                <Text style={s.chipText}>{score}</Text>
            </View>
            {/* Bottom sheet: handle stays visible above the nav bar; body slides up */}
            <Animated.View
                style={[
                    s.sheet,
                    {
                        height: HANDLE_HEIGHT + sheetBodyHeight + insets.bottom,
                        paddingBottom: insets.bottom,
                        transform: [{translateY}],
                    },
                ]}
            >
                <View style={s.handle} {...handlePan.panHandlers}>
                    <View style={s.grabber}/>
                    <Text style={s.handleArrow}>{sheetOpen ? "▼" : "▲"}</Text>
                </View>

                <View style={{height: sheetBodyHeight}}>
                    <FlatList
                        data={participants}
                        keyExtractor={(p) => p.uuid}
                        contentContainerStyle={s.listContent}
                        ListEmptyComponent={<Text style={s.emptyText}>No participants</Text>}
                        renderItem={({item}) => {
                            const selected = item.uuid === selectedUuid;
                            return (
                                <Pressable
                                    disabled={locked}
                                    onPress={() => onEntryPress(item)}
                                    style={[s.entry, selected && s.entrySelected, locked && !selected && s.entryLocked]}
                                >
                                    <Text style={s.entryText}>{item.username}</Text>
                                    {selected && <Text style={s.entryBadge}>PICKED</Text>}
                                </Pressable>
                            );
                        }}
                    />
                </View>
            </Animated.View>

            {/* Between-rounds scoreboard; closes on next_round */}
            <ScoreboardModal state={scoreboard}/>

            {/* Final results; stays until the user leaves */}
            <GameOverModal state={gameOver}/>
        </View>
    );
}

/* ------------------------------------------------------------------ */
/* Scoreboard                                                          */
/* ------------------------------------------------------------------ */

const SCORE_ANIM_MS = 800;

// A score that counts up from `from` to `to`. Text content isn't a natively
// animatable prop, so the Animated.Value is driven in JS and its listener pushes
// rounded integers into state. Remounted per scoreboard (keyed by player) so each
// new round re-animates from that round's previous total.
function AnimatedScore({from, to, style}: {from: number; to: number; style?: StyleProp<TextStyle>}) {
    const anim = useRef(new Animated.Value(from)).current;
    const [display, setDisplay] = useState(from);

    useEffect(() => {
        if (from === to) {
            setDisplay(to);
            return;
        }
        const sub = anim.addListener(({value}) => setDisplay(Math.round(value)));
        const animation = Animated.timing(anim, {
            toValue: to,
            duration: SCORE_ANIM_MS,
            useNativeDriver: false, // driving a JS value, not a native prop
        });
        animation.start();
        return () => {
            animation.stop();
            anim.removeListener(sub);
        };
    }, [anim, from, to]);

    return <Text style={style}>{display}</Text>;
}

function ScoreboardModal({state}: {state: UpdateGameScoreStateMessage | null}) {
    const insets = useSafeAreaInsets();
    // Rank high-to-low without mutating the message's array.
    const ranked = useMemo(
        () => (state ? [...state.players].sort((a, b) => b.score - a.score) : []),
        [state],
    );

    return (
        <Modal visible={state !== null} transparent animationType="fade" onRequestClose={() => {}}>
            <View style={[s.scoreboardBackdrop, {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24}]}>
                <View style={s.scoreboardCard}>
                    <Text style={s.scoreboardTitle}>Round results</Text>
                    <FlatList
                        data={ranked}
                        keyExtractor={(p) => p.playerUUID}
                        contentContainerStyle={s.scoreboardListContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({item, index}) => {
                            const isOwn = state !== null && item.playerUUID === state.ownUUID;
                            const from = item.score - item.earnedThisRound;
                            return (
                                <View style={[s.scoreRow, isOwn && s.scoreRowOwn]}>
                                    <Text style={s.scoreRank}>{index + 1}</Text>
                                    <View style={s.scoreNameCol}>
                                        <Text style={s.scoreName} numberOfLines={1}>{item.username}</Text>
                                        {isOwn && <Text style={s.scoreYouBadge}>YOU</Text>}
                                    </View>
                                    {item.earnedThisRound > 0 && (
                                        <Text style={s.scoreEarned}>+{item.earnedThisRound}</Text>
                                    )}
                                    <AnimatedScore from={from} to={item.score} style={s.scoreValue}/>
                                </View>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
}

/* ------------------------------------------------------------------ */
/* Game over                                                           */
/* ------------------------------------------------------------------ */

function GameOverModal({state}: {state: GameOverMessage | null}) {
    const insets = useSafeAreaInsets();

    const ranked = useMemo(
        () => (state ? [...state.scores].sort((a, b) => b.score - a.score) : []),
        [state],
    );

    if (state === null) return null;

    const place = ranked.findIndex((score) => score.user === state.ownUUID) + 1; // 0 -> not found
    const headline = state.isWinner
        ? "You won! 🏆"
        : place > 0 ? `You finished ${ordinal(place)}` : "Game over";

    return (
        <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
            <View style={[s.scoreboardBackdrop, {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24}]}>
                <View style={s.scoreboardCard}>
                    <Text style={s.gameOverKicker}>Final results</Text>
                    <Text style={s.gameOverHeadline}>{headline}</Text>
                    <FlatList
                        data={ranked}
                        keyExtractor={(score) => score.user}
                        style={s.gameOverList}
                        contentContainerStyle={s.scoreboardListContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({item, index}) => {
                            const isOwn = item.user === state.ownUUID;
                            return (
                                <View style={[s.scoreRow, isOwn && s.scoreRowOwn]}>
                                    <Text style={s.scoreRank}>{index + 1}</Text>
                                    <View style={s.scoreNameCol}>
                                        <Text style={s.scoreName} numberOfLines={1}>{item.username}</Text>
                                        {isOwn && <Text style={s.scoreYouBadge}>YOU</Text>}
                                    </View>
                                    <Text style={s.scoreValue}>{item.score}</Text>
                                </View>
                            );
                        }}
                    />

                    {/* Button logic intentionally left empty — to be wired up later. */}
                    <View style={s.gameOverActions}>
                        <Pressable style={[s.gameOverButton, s.gameOverButtonSecondary]} onPress={() => {
                            getConnection()?.sendMessage({
                                type:"leave_room"
                            })
                        }}>
                            <Text style={s.gameOverButtonSecondaryText}>Leave room</Text>
                        </Pressable>
                        {/* game_screen was pushed on top of room.tsx (the lobby), so back pops to it. */}
                        <Pressable style={[s.gameOverButton, s.gameOverButtonPrimary]} onPress={() => router.back()}>
                            <Text style={s.gameOverButtonPrimaryText}>Return to lobby</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}


const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#000000",
    },
    fill: {
        flex: 1,
        backgroundColor: "#000000",
    },
    // ---- top bar ----
    leaveButton: {
        position: "absolute",
        height: 40,
        width: 40,
        borderRadius: 14,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: MUTED,
        alignItems: "center",
        justifyContent: "center",
    },
    leaveIcon: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "700",
    },
    timerBox: {
        position: "absolute",
        alignSelf: "center",
        minWidth: 96,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: ACCENT,
        alignItems: "center",
    },
    scoreChip: {
        position: "absolute",
        minWidth: 56,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: ACCENT,
        alignItems: "center",
    },
    chipText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    // ---- bottom sheet ----
    sheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: SURFACE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 2,
        borderTopColor: ACCENT,
        overflow: "hidden",
    },
    handle: {
        height: HANDLE_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    grabber: {
        width: 44,
        height: 5,
        borderRadius: 999,
        backgroundColor: MUTED,
    },
    handleArrow: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    listContent: {
        padding: 16,
        gap: 10,
    },
    emptyText: {
        color: TEXT_DIM,
        fontSize: 15,
        textAlign: "center",
        paddingTop: 20,
    },
    entry: {
        height: 60,
        borderRadius: 14,
        backgroundColor: "#000000",
        borderWidth: 2,
        borderColor: ACCENT,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    entrySelected: {
        backgroundColor: ACCENT,
    },
    entryLocked: {
        opacity: 0.35,
    },
    entryText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
    },
    entryBadge: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
    },
    disabled: {
        opacity: 0.4,
    },
    // ---- scoreboard modal ----
    scoreboardBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    scoreboardCard: {
        maxHeight: "100%",
        backgroundColor: SURFACE,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: ACCENT,
        paddingVertical: 20,
    },
    scoreboardTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 14,
    },
    scoreboardListContent: {
        paddingHorizontal: 16,
        gap: 10,
    },
    scoreRow: {
        minHeight: 60,
        borderRadius: 14,
        backgroundColor: "#000000",
        borderWidth: 2,
        borderColor: MUTED,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    scoreRowOwn: {
        borderColor: ACCENT,
        backgroundColor: "rgba(0,132,189,0.15)",
    },
    scoreRank: {
        color: TEXT_DIM,
        fontSize: 16,
        fontWeight: "800",
        minWidth: 22,
    },
    scoreNameCol: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    scoreName: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
        flexShrink: 1,
    },
    scoreYouBadge: {
        color: ACCENT,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1,
    },
    scoreEarned: {
        color: "#4ade80",
        fontSize: 15,
        fontWeight: "800",
    },
    scoreValue: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "800",
        minWidth: 48,
        textAlign: "right",
    },
    // ---- game over modal ----
    gameOverKicker: {
        color: TEXT_DIM,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
        textAlign: "center",
    },
    gameOverHeadline: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
        marginTop: 4,
        marginBottom: 16,
    },
    gameOverList: {
        flexShrink: 1,
    },
    gameOverActions: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 18,
    },
    gameOverButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    gameOverButtonPrimary: {
        backgroundColor: ACCENT,
    },
    gameOverButtonPrimaryText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    gameOverButtonSecondary: {
        backgroundColor: "#000000",
        borderWidth: 2,
        borderColor: MUTED,
    },
    gameOverButtonSecondaryText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
