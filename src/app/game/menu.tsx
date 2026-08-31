import {Text, View, Pressable, Modal, TextInput, StyleSheet, ActivityIndicator, BackHandler} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {router, Stack, useFocusEffect} from "expo-router";
import {default_style} from "@/styles/basic_style";
import {addListener, getConnection} from "@/main/connection_data";
import {ConnectionHolder} from "@/main/connection";
import {useAuth} from "@/main/auth_provider";
import {useConnection} from "@/main/connection_provider";
import {useCallback, useEffect, useState} from "react";

export default function MainMenu() {
    const insets = useSafeAreaInsets();
    const connection : ConnectionHolder | null = getConnection();
    const authState = useAuth();
    const connectState = useConnection();

    // Block leaving the menu with the back gesture / Android hardware button.
    // (The swipe gesture is disabled via <Stack.Screen> below.)
    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
            return () => sub.remove();
        }, [])
    );

    const logout = () => {
        router.replace("/");
        connectState.disconnect(); // close the websocket
        authState.logOut();        // clear tokens / logged-in state
    };

    const [joinOpen, setJoinOpen] = useState(false);
    const [roomCode, setRoomCode] = useState("");
    const [joining, setJoining] = useState(false);

    // Stop the spinner if the join is rejected. On confirm_join_room the game
    // layout (_layout.tsx) forwards us to /game/room, unmounting this screen.
    useEffect(() => {
        const subs = [
            addListener("denied_join_room", (msg) => {
                console.log("Denied Room Join. " + msg.error)
                setJoining(false)
            }),
            addListener("room_not_found", () => {
                console.log("Room Not Found");
                setJoining(false)
            }),
        ];
        return () => subs.forEach((remove) => remove());
    }, []);

    const submitJoin = () => {
        const code = roomCode.trim();
        if (!code || joining) return;
        if (connection) {
            connection.sendMessage({type: "join_room", code});
        }
        setJoining(true); // wait for confirm_join_room / denied_join_room
    };

    const closeJoin = () => {
        if (joining) return; // don't dismiss while waiting on the server
        setJoinOpen(false);
        setRoomCode("");
    };


    return (
        <View style={[default_style.container, {paddingBottom: insets.bottom + 16}]}>
            <Stack.Screen options={{gestureEnabled: false}}/>

            <View style={{flexDirection: "row", gap: 10, paddingTop: insets.top + 8, alignItems: "center"}}>
                <Pressable style={logoutButton} onPress={logout}>
                    <Text style={logoutText}>Logout</Text>
                </Pressable>
            </View>

            <View style={{flex: 1}}/>

            <Pressable onPress={() => setJoinOpen(true)}>
                <LinearGradient
                    colors={["#8e2de2", "#0084bd"]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={default_style.gradientBorder}
                >
                    <View style={default_style.gradientInner}>
                        <Text style={[default_style.genericText, {color: "#0084bd"}]}>Join Room</Text>
                    </View>
                </LinearGradient>
            </Pressable>

            <Pressable onPress={() => {
                if(connection){
                    connection.sendMessage({
                        type: "create_room",
                    });
                }
                router.push("/game/room")
            }}>
                <LinearGradient
                    colors={["#8e2de2", "#0084bd"]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={default_style.gradientBorder}
                >
                    <View style={default_style.gradientInner}>
                        <Text style={[default_style.genericText, {color: "#0084bd"}]}>Create Room</Text>
                    </View>
                </LinearGradient>
            </Pressable>

            {/* Join Room popup — asks for a room code */}
            <Modal
                visible={joinOpen}
                transparent
                animationType="fade"
                onRequestClose={closeJoin}
            >
                <Pressable style={join_style.backdrop} onPress={closeJoin}>
                    {/* Stop taps inside the card from closing the popup */}
                    <Pressable style={join_style.card} onPress={() => {}}>
                        <Text style={join_style.title}>Join Room</Text>
                        {joining ? (
                            <View style={join_style.loading}>
                                <ActivityIndicator size="large" color="#0084bd"/>
                            </View>
                        ) : (
                            <>
                                <TextInput
                                    value={roomCode}
                                    onChangeText={setRoomCode}
                                    placeholder="Room code..."
                                    placeholderTextColor="#8a90a0"
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    autoFocus
                                    returnKeyType="go"
                                    onSubmitEditing={submitJoin}
                                    style={join_style.input}
                                />
                                <View style={join_style.actions}>
                                    <Pressable style={join_style.cancelButton} onPress={closeJoin}>
                                        <Text style={join_style.cancelText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[join_style.joinButton, !roomCode.trim() && join_style.joinButtonDisabled]}
                                        disabled={!roomCode.trim()}
                                        onPress={submitJoin}
                                    >
                                        <Text style={join_style.joinText}>Join</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const join_style = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    card: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: "#111318",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#0084bd",
        padding: 20,
        gap: 16,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "700",
    },
    loading: {
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    input: {
        backgroundColor: "#000000",
        borderWidth: 1,
        borderColor: "#2a2f3a",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: "#FFFFFF",
        fontSize: 16,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    cancelText: {
        color: "#8a90a0",
        fontSize: 16,
    },
    joinButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: "#0084bd",
    },
    joinButtonDisabled: {
        opacity: 0.4,
    },
    joinText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});

// TODO: remove — temporary test-navigation styles
const testButton = {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2f3a",
    alignItems: "center" as const,
};
const testButtonText = {
    color: "#8a90a0",
    fontSize: 14,
};

const logoutButton = {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b3384a",
    alignItems: "center" as const,
};
const logoutText = {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "600" as const,
};
