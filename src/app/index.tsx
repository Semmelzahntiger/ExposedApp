import {Text, View, StyleSheet, Pressable, ActivityIndicator} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {Href, Redirect, router} from "expo-router";
import {default_style} from "@/styles/basic_style";
import {ConnectionValue, useConnection} from "@/main/connection_provider";
import {AuthValue, useAuth} from "@/main/auth_provider";
import {Dispatch, SetStateAction, useEffect, useState} from "react";


export default function Index() {
    const insets = useSafeAreaInsets();
    const authState : AuthValue  = useAuth()

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
                </View>
            )}
        </View>
    );
}


