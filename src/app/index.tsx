import {Text, View, StyleSheet, Pressable} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";
import {default_style} from "@/styles/basic_style";

export default function Index() {
    const insets = useSafeAreaInsets();

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

        </View>
    );
}

