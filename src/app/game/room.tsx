// Vibecoded the shit out of this, will redo on my own at a later point.

import {useEffect, useRef, useState} from "react";
import {
    View,
    Text,
    Pressable,
    ScrollView,
    Modal,
    PanResponder,
    LayoutChangeEvent,
    GestureResponderEvent,
    useWindowDimensions,
} from "react-native";
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from "react-native-reanimated";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";
import {RoomSettings} from "@/main/GameData";
import {RoomPlayerRole} from "@/main/MessageProtocol";
import {room_style} from "@/styles/room_style";
import {addListener, getConnection} from "@/main/connection_data";
import {setParticipants} from "@/game/game_data";
import {ConnectionHolder} from "@/main/connection";

/* ------------------------------------------------------------------ */
/* Custom, theme-matching controls (pure RN — no root GestureHandler)  */
/* ------------------------------------------------------------------ */

type ThemedSliderProps = {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onValueChange: (value: number) => void;
};

function ThemedSlider({label, value, min, max, step = 1, onValueChange}: ThemedSliderProps) {
    const [trackWidth, setTrackWidth] = useState(0);
    const [dragging, setDragging] = useState(false);
    // Continuous 0..1 thumb position. The thumb follows the finger smoothly;
    // only the *displayed* value snaps to `step`. This is the "offset" model —
    // the thumb is not pinned to stepped positions while dragging.
    const [posRatio, setPosRatio] = useState(0);



    const externalRatio = max > min ? (value - min) / (max - min) : 0;

    // Latest values for the (once-created) PanResponder to read, plus the ratio
    // captured at the moment the drag started.
    const cfg = useRef({trackWidth, min, max, step, onValueChange, grabRatio: 0});
    cfg.current.trackWidth = trackWidth;
    cfg.current.min = min;
    cfg.current.max = max;
    cfg.current.step = step;
    cfg.current.onValueChange = onValueChange;

    // While idle, keep the thumb in sync with the external (stepped) value.
    useEffect(() => {
        if (!dragging) setPosRatio(externalRatio);
    }, [externalRatio, dragging]);

    const commit = (ratio: number) => {
        const c = cfg.current;
        const raw = c.min + ratio * (c.max - c.min);
        const stepped = Math.min(c.max, Math.max(c.min, Math.round(raw / c.step) * c.step));
        c.onValueChange(stepped);
    };

    const responder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (e: GestureResponderEvent) => {
                const w = cfg.current.trackWidth;
                const r = w > 0 ? Math.min(1, Math.max(0, e.nativeEvent.locationX / w)) : 0;
                cfg.current.grabRatio = r;
                setDragging(true);
                setPosRatio(r);
                commit(r);
            },
            // Drive movement from the gesture delta (dx) rather than locationX —
            // locationX becomes unreliable once the finger crosses the thumb.
            onPanResponderMove: (_e: GestureResponderEvent, g) => {
                const w = cfg.current.trackWidth;
                if (w <= 0) return;
                const r = Math.min(1, Math.max(0, cfg.current.grabRatio + g.dx / w));
                setPosRatio(r);
                commit(r);
            },
            onPanResponderRelease: () => setDragging(false),
            onPanResponderTerminate: () => setDragging(false),
        })
    ).current;

    const ratio = dragging ? posRatio : externalRatio;

    return (
        <View style={room_style.sliderRow}>
            <View style={room_style.sliderLabelRow}>
                <Text style={room_style.sliderLabel}>{label}</Text>
                <Text style={room_style.sliderValue}>{value}</Text>
            </View>
            <View
                style={room_style.sliderTrack}
                onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
                {...responder.panHandlers}
            >
                <View style={room_style.sliderTrackBg}>
                    <View style={[room_style.sliderTrackFill, {width: ratio * trackWidth}]}/>
                </View>
                <View style={[room_style.sliderThumb, {left: ratio * trackWidth}]}/>
            </View>
        </View>
    );
}

type ThemedCheckboxProps = {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
};

function ThemedCheckbox({label, value, onValueChange}: ThemedCheckboxProps) {
    return (
        <Pressable style={room_style.checkboxRow} onPress={() => onValueChange(!value)}>
            <View style={[room_style.checkboxBox, value && room_style.checkboxBoxChecked]}>
                {value && <Text style={room_style.checkboxTick}>✓</Text>}
            </View>
            <Text style={room_style.checkboxLabel}>{label}</Text>
        </Pressable>
    );
}

// A single player entry. Host rows use a red outline, everyone else the
// blue→purple gradient that matches the rest of the app.
function PlayerRow({player, onPress}: {player: RoomPlayerRole; onPress: () => void}) {
    const colors: [string, string] = player.isHost ? ["#ff512f", "#b3384a"] : ["#8e2de2", "#0084bd"];
    return (
        <Pressable onPress={onPress}>
            <LinearGradient
                colors={colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={room_style.playerRowBorder}
            >
                <View style={room_style.playerRowInner}>
                    <Text style={room_style.playerName} numberOfLines={1}>{player.username}</Text>
                    {player.isHost && (
                        <View style={room_style.hostBadge}>
                            <Text style={room_style.hostBadgeText}>HOST</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>
        </Pressable>
    );
}

// Turn a { name: boolean } map into a lowercase string[] of the enabled names.
function enabledNames(map: Record<string, boolean>): string[] {
    return Object.keys(map)
        .filter((key) => map[key])
        .map((key) => key.toLowerCase());
}

/* ------------------------------------------------------------------ */
/* Room lobby                                                          */
/* ------------------------------------------------------------------ */

export default function Room() {
    const insets = useSafeAreaInsets();
    const {width} = useWindowDimensions();
    const panelWidth = width * 0.78;

    // ---- prototype state ----
    const [roomCode, setRoomCode] = useState("");
    const [codeRevealed, setCodeRevealed] = useState(false);
    const [players, setPlayers] = useState<RoomPlayerRole[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<RoomPlayerRole | null>(null);
    const [isHost, setIsHost] = useState(false); // only the host may start; flip to preview the dimmed state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [roomSize, setRoomSize] = useState(6);
    const [rounds, setRounds] = useState(5);
    const [platforms, setPlatforms] = useState({tiktok: true, instagram: true});
    const [sources, setSources] = useState({
        liked: true,
        saved: true,
        reposted: true,
        commented: true,
        searched: true,
    });
    const connection : ConnectionHolder | null = getConnection();
    useEffect(() => {
        const listeners = [
            addListener("update_room_state", (msg) => {
                setRoomCode(msg.roomCode);
                setIsHost(msg.hostIsReceiver);
                setPlayers(msg.players)
                setRoomSize(msg.settings.roomSize);
                setRounds((msg.settings.rounds))
                // setPlatforms(msg.settings.enabledPlatforms)
                // setSources
            }),
            addListener("confirm_change_room_settings", (msg) => {
                console.log("Successfully uploaded Room Settings")
            }),
            addListener("denied_change_room_settings", (msg) => {
                console.log("Room Settings denied by Server. " + msg.error)
            }),
            addListener("denied_start_game", (msg) => {
                console.log("Game Start denied by Server")
                // Todo: Display Error
            }),
            addListener("started_game", (msg) => {
                console.log("Started Game")
                setParticipants(msg.participants)
                router.push("/game/game_screen");
            })
        ];
        return () => listeners.forEach((listener) => listener());
    }, []);

    const startDisabled = !isHost;

    const onSettingsClose = (settings: RoomSettings) => {
        if(isHost && connection) {
            console.log("Uploading Settings to Backend...")
            connection.sendMessage({
                type:"change_room_settings",
                roomSize: roomSize,
                rounds: rounds,
                roundTimeInSeconds: 30,
                enabledPlatforms: enabledNames(settings.platforms), // e.g. ["tiktok", "instagram"]
                enabledResources: enabledNames(settings.sources),   // e.g. ["liked", "saved", ...]
                beforeDate: "1970-01-01",                      // Java LocalDate.MIN
            })
        }
    };

    // ---- sidebar animation ----
    const translateX = useSharedValue(panelWidth);
    useEffect(() => {
        translateX.value = withTiming(settingsOpen ? 0 : panelWidth, {duration: 220});
    }, [settingsOpen, panelWidth]);
    const sidebarStyle = useAnimatedStyle(() => ({transform: [{translateX: translateX.value}]}));

    const closeSettings = () => {
        setSettingsOpen(false);
        onSettingsClose({roomSize, rounds, platforms, sources});
    };

    const promoteToHost = (player: RoomPlayerRole) => {
        // TODO: send the host-handover message (change_lobby_admin) to the backend.
        console.log("Promote to host (stub):", player.username, player.playerUUID);
        setSelectedPlayer(null);
    };

    return (
        <View style={room_style.root}>
            {/* Center: scrollable player list. Entries keep a fixed height (they
                don't shrink to fit 10 players) so they stay comfortably tappable. */}
            <ScrollView
                style={room_style.content}
                contentContainerStyle={[
                    room_style.playerList,
                    {paddingTop: insets.top + 72, paddingBottom: insets.bottom + 96},
                ]}
                showsVerticalScrollIndicator={false}
            >
                {players.map((player) => (
                    <PlayerRow
                        key={player.playerUUID}
                        player={player}
                        onPress={() => setSelectedPlayer(player)}
                    />
                ))}
            </ScrollView>

            {/* Top-left: room code (obscured until revealed) */}
            <View style={[room_style.codeContainer, {top: insets.top + 12, left: 16}]}>
                <View style={room_style.codeBox}>
                    <Text style={room_style.codeText}>
                        {codeRevealed ? (roomCode || "—") : "•".repeat(Math.max(roomCode.length, 4))}
                    </Text>
                </View>
                <Pressable
                    style={room_style.codeRevealButton}
                    onPress={() => setCodeRevealed((r) => !r)}
                >
                    <Text style={room_style.codeRevealIcon}>{codeRevealed ? "🙈" : "👁"}</Text>
                </Pressable>
            </View>

            {/* Top-right: settings gear */}
            <Pressable
                style={[room_style.settingsButton, {top: insets.top + 12, right: 16}]}
                onPress={() => setSettingsOpen(true)}
            >
                <Text style={room_style.settingsIcon}>⚙</Text>
            </Pressable>

            {/* Bottom-left: leave */}
            <Pressable
                style={[room_style.cornerButton, room_style.leaveButton, {bottom: insets.bottom + 20, left: 20}]}
                onPress={() => {
                    if(connection) {
                        connection.sendMessage({
                            type:"leave_room"
                        })
                    }
                }}
            >
                <Text style={room_style.cornerButtonText}>Leave</Text>
            </Pressable>

            {/* Bottom-right: start (dimmed + disabled unless host) */}
            <Pressable
                style={[
                    room_style.cornerButton,
                    {bottom: insets.bottom + 20, right: 20},
                    startDisabled && room_style.startButtonDisabled,
                ]}
                disabled={startDisabled}
                onPress={() => {
                    // TODO: send `start_game` to the backend
                    console.log("start game");
                }}
            >
                <Text style={room_style.cornerButtonText}>Start</Text>
            </Pressable>

            {/* Backdrop — closes the sidebar on outside tap */}
            {settingsOpen && <Pressable style={room_style.backdrop} onPress={closeSettings}/>}

            {/* Settings sidebar */}
            <Animated.View
                style={[room_style.sidebar, {width: panelWidth}, sidebarStyle]}
                pointerEvents={settingsOpen ? "auto" : "none"}
            >
                <ScrollView
                    contentContainerStyle={[
                        room_style.sidebarScroll,
                        {paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20},
                    ]}
                >
                    <View style={room_style.sidebarHeaderRow}>
                        <Text style={room_style.sidebarTitle}>Settings</Text>
                        <Pressable style={room_style.closeButton} onPress={closeSettings}>
                            <Text style={room_style.closeIcon}>✕</Text>
                        </Pressable>
                    </View>

                    {/* Room settings */}
                    <View style={room_style.section}>
                        <Text style={room_style.sectionTitle}>Room Settings</Text>
                        <ThemedSlider
                            label="Room Size"
                            value={roomSize}
                            min={2}
                            max={10}
                            step={1}
                            onValueChange={setRoomSize}
                        />
                        <ThemedSlider
                            label="Rounds"
                            value={rounds}
                            min={1}
                            max={20}
                            step={1}
                            onValueChange={setRounds}
                        />
                    </View>

                    {/* Platform settings */}
                    <View style={room_style.section}>
                        <Text style={room_style.sectionTitle}>Platform Settings</Text>
                        <ThemedCheckbox
                            label="TikTok"
                            value={platforms.tiktok}
                            onValueChange={(v) => setPlatforms((p) => ({...p, tiktok: v}))}
                        />
                        <ThemedCheckbox
                            label="Instagram"
                            value={platforms.instagram}
                            onValueChange={(v) => setPlatforms((p) => ({...p, instagram: v}))}
                        />
                    </View>

                    {/* Game_screen settings */}
                    <View style={room_style.section}>
                        <Text style={room_style.sectionTitle}>Game Settings</Text>
                        <ThemedCheckbox
                            label="Liked"
                            value={sources.liked}
                            onValueChange={(v) => setSources((s) => ({...s, liked: v}))}
                        />
                        <ThemedCheckbox
                            label="Saved"
                            value={sources.saved}
                            onValueChange={(v) => setSources((s) => ({...s, saved: v}))}
                        />
                        <ThemedCheckbox
                            label="Reposts"
                            value={sources.reposted}
                            onValueChange={(v) => setSources((s) => ({...s, reposts: v}))}
                        />
                        <ThemedCheckbox
                            label="Comments"
                            value={sources.commented}
                            onValueChange={(v) => setSources((s) => ({...s, comments: v}))}
                        />
                        <ThemedCheckbox
                            label="Search"
                            value={sources.searched}
                            onValueChange={(v) => setSources((s) => ({...s, search: v}))}
                        />
                    </View>
                </ScrollView>
            </Animated.View>

            {/* Player action menu */}
            <Modal
                visible={selectedPlayer !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedPlayer(null)}
            >
                <Pressable style={room_style.playerMenuBackdrop} onPress={() => setSelectedPlayer(null)}>
                    <Pressable style={room_style.playerMenuCard} onPress={() => {}}>
                        <Text style={room_style.playerMenuTitle} numberOfLines={1}>
                            {selectedPlayer?.username}
                        </Text>
                        {isHost && selectedPlayer && !selectedPlayer.isHost && (
                            <Pressable
                                style={room_style.playerMenuButton}
                                onPress={() => promoteToHost(selectedPlayer)}
                            >
                                <Text style={room_style.playerMenuButtonText}>Promote to Host</Text>
                            </Pressable>
                        )}
                        <Pressable style={room_style.playerMenuCancel} onPress={() => setSelectedPlayer(null)}>
                            <Text style={room_style.playerMenuCancelText}>Close</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
