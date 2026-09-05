import {Text, View, Pressable, Modal, TextInput, StyleSheet, ActivityIndicator, BackHandler} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router, Stack, useFocusEffect} from "expo-router";
import {default_style} from "@/styles/basic_style";
import {useAuth} from "@/main/auth_provider";
import {useConnection} from "@/main/connection_provider";
import React, {useCallback, useEffect, useState} from "react";
import {GradientBorderBox} from "@/components/GradientBorderBox";
import {logger} from "react-native-reanimated/src/common";
import {BLACK_TONE, BLUE_TONE, PURPLE_TONE, RED_TONE, WHITE_TONE} from "@/styles/colors";

export default function MainMenu() {
    const insets = useSafeAreaInsets();
    const authState = useAuth();
    const connectState = useConnection();
    const [isConnecting, setIsConnecting] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
            return () => sub.remove();
        }, [])
    );
    useEffect(() => {
        if(!authState.isLoggedIn) {
            router.replace("/");
        }
    }, [authState.isLoggedIn]);
    useEffect(() => {
        if(connectState.connectionState === "connected") {
            console.log("Connected, forwarding to game menu.")
            router.replace("/game/game_menu")
        }
    }, [connectState.connectionState]);




    return (
        <View style={[styles.container, {paddingBottom: insets.bottom + 16}]}>
            <View style={[styles.logoutButton, {marginTop: insets.top + 30}]}>
                <Pressable onPress={() => {
                    authState.logOut();
                }}>
                    <Text style={[styles.genericText, {color: RED_TONE}]}>
                        Logout
                    </Text>
                </Pressable>
            </View>
            <Pressable onPress={ async () => {
                console.log("Connecting...");
                setIsConnecting(true);
                await connectState.connect();
                setIsConnecting(false);
                console.log("Connected!")
            }} style={styles.div}
            >
                <GradientBorderBox
                    colors={[BLUE_TONE, PURPLE_TONE]}
                    backgroundColor={"#000000"}
                    borderWidth={3}
                    gradientBorderStyle={{flex:1}}
                >
                    <Text style={styles.genericText}>Connect to Server</Text>
                </GradientBorderBox>
            </Pressable>
            <Pressable onPress={() => {
                console.log("Opening Settings...")
                router.push("/menu/settings");
            }} style={styles.div}>
                <GradientBorderBox
                    colors={[BLUE_TONE, PURPLE_TONE]}
                    backgroundColor={"#000000"}
                    borderWidth={3}
                    gradientBorderStyle={{flex:1}}
                >
                    <Text style={styles.genericText}>Settings</Text>
                </GradientBorderBox>
            </Pressable>
            { isConnecting && (
                <View style={default_style.overlay}>
                    <ActivityIndicator size="large" color="white"/>
                </View>
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "stretch",
        justifyContent: "flex-end",
        backgroundColor: BLACK_TONE,
        paddingHorizontal: 10,
        gap: "1%"
    },
    genericText: {
        color: WHITE_TONE,
        alignSelf: "center",
        borderColor: WHITE_TONE,
    },
    div : {
        height: "10%",
        backgroundColor: "#ABABAB",
        justifyContent: "center",
        borderRadius: 25,
    },
    logoutButton: {
        borderRadius: 15,
        height: "6%",
        width: "25%",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "auto",
        marginLeft: 15,
        alignSelf: "flex-start",
        backgroundColor: BLACK_TONE,
        borderWidth: 3,
        borderColor: RED_TONE,
    }

});

