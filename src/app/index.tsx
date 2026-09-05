import {Text, View, StyleSheet, Pressable, ActivityIndicator} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";
import {default_style} from "@/styles/basic_style";
import {AuthValue, useAuth} from "@/main/auth_provider";
import {useEffect, useState} from "react";
import {ServerSettingsModal} from "@/components/ServerSettingsModal";


export default function Index() {
    const insets = useSafeAreaInsets();
    const authState : AuthValue  = useAuth()
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        if(authState.isLoggedIn) {
            console.log("Logged in. Forwarding to Menu")
            router.replace("/menu/main_menu");
        }
    }, [authState.isLoading]);

    return (
        <View style={[default_style.container, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable onPress={() => router.push("/login")}>
                <LinearGradient
                    colors={["#8e2de2", "#0084bd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={default_style.gradientBorder}
                >
                    <View style={default_style.gradientInner}>
                        <Text style={[default_style.genericText, { color: "#0084bd" }]}>Login</Text>
                    </View>
                </LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.push("/register")}>
                <LinearGradient
                    colors={["#8e2de2", "#0084bd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={default_style.gradientBorder}
                >
                    <View style={[default_style.gradientInner, { backgroundColor: "transparent"}]}>
                        <Text style={[default_style.genericText, { color: "#000000" }]}>Register</Text>
                    </View>
                </LinearGradient>
            </Pressable>

            { (authState.isLoading) && (
                <View style={default_style.overlay}>
                    <ActivityIndicator size="large" color="white"/>
                    {/* Cancel a hanging auto-login so the UI (and server switching) stays usable. */}
                    <Pressable style={local.cancelButton} onPress={() => authState.cancelAutoLogin()}>
                        <Text style={local.cancelText}>Cancel</Text>
                    </Pressable>
                </View>
            )}

            {/* Server settings gear — rendered last so it stays tappable above the loading overlay. */}
            <Pressable
                style={[local.gear, { top: insets.top + 12, right: 16 }]}
                onPress={() => setSettingsOpen(true)}
            >
                <Text style={local.gearIcon}>⚙</Text>
            </Pressable>

            <ServerSettingsModal
                visible={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onServerChanged={() => {
                    // A token from the old server is invalid on the new one: stop any
                    // in-flight auto-login and clear the saved session.
                    authState.cancelAutoLogin();
                    authState.logOut();
                }}
            />
        </View>
    );
}

const local = StyleSheet.create({
    gear: {
        position: "absolute",
        height: 44,
        width: 44,
        borderRadius: 14,
        backgroundColor: "#111318",
        borderWidth: 1,
        borderColor: "#2a2f3a",
        alignItems: "center",
        justifyContent: "center",
    },
    gearIcon: {
        color: "#FFFFFF",
        fontSize: 22,
    },
    cancelButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#2a2f3a",
        backgroundColor: "#111318",
    },
    cancelText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
