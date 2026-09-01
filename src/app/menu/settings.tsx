import {View, Text, Pressable} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router} from "expo-router";
import {settings_style} from "@/styles/settings_style";

export default function Settings() {
    const insets = useSafeAreaInsets();

    return (
        <View style={settings_style.root}>
            {/* Top-left: explicit back (fallback for when the back gesture doesn't work) */}
            <Pressable
                style={[settings_style.backButton, {top: insets.top + 12, left: 16}]}
                onPress={() => router.back()}
            >
                <Text style={settings_style.backIcon}>←</Text>
            </Pressable>

            <View style={[settings_style.content, {paddingTop: insets.top + 72, paddingBottom: insets.bottom + 20}]}>
                <Text style={settings_style.screenTitle}>Settings</Text>

                <Pressable style={settings_style.primaryButton} onPress={() => router.push("/menu/upload")}>
                    <Text style={settings_style.primaryButtonText}>Upload Data</Text>
                </Pressable>

                {/* More settings buttons go here later */}
            </View>
        </View>
    );
}
