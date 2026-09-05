import {View, Text, Pressable, Modal} from "react-native";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {router} from "expo-router";
import {settings_style} from "@/styles/settings_style";
import {GradientBorderBoxButton} from "@/components/GradientBorderBoxButton";
import {BLACK_TONE, BLUE_TONE, DARK_RED_TONE, PURPLE_TONE, RED_TONE} from "@/styles/colors";
import {useState} from "react";
import {GradientBorderBox} from "@/components/GradientBorderBox";
import {deleteUrl} from "@/config/endpoints";
import {getAccessToken, getNewAccessToken, getRefreshToken} from "@/main/account_data";

export default function Settings() {
    const insets = useSafeAreaInsets();
    const [confirmDeleteModalOn, setConfirmDeleteModalOn] = useState(false);

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
                <GradientBorderBoxButton
                    onPress={() => {
                        console.log("Forwarding to Upload...");
                        router.push("/menu/upload");
                    }}
                    colors={[BLUE_TONE, PURPLE_TONE]}
                    backgroundColor={"#000000"}
                    pressableStyle={{height : "10%", }}
                >
                    <Text style={{color: "#FFFFFF"}}>Upload Data</Text>
                </GradientBorderBoxButton>
                <GradientBorderBoxButton
                onPress={() => {
                    setConfirmDeleteModalOn(true);
                }}
                colors={[DARK_RED_TONE, RED_TONE]}
                backgroundColor={"#000000"}
                pressableStyle={{height: "10%"}}
                >
                 <Text style={{color:RED_TONE}}>
                     DELETE DATA
                 </Text>
                </GradientBorderBoxButton>
                <Modal
                    visible={confirmDeleteModalOn}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setConfirmDeleteModalOn(false)}
                >
                    <View style={{flex:1,
                        justifyContent: "center",
                        alignItems:"center",
                        backgroundColor: "rgba(0,0,0,0.8)"}}>
                        <GradientBorderBox
                            gradientBorderStyle={{height:"50%", width: "80%"}}
                            colors={[DARK_RED_TONE, RED_TONE]}
                            backgroundColor={"#000000"}
                            innerBoxStyle={{justifyContent:"flex-end", alignItems: "center"}}
                        >
                            <Text style={{color: "#FFFFFF", marginBottom: "auto", marginTop: "30%", textAlign:"center", marginHorizontal: "10%"}}>
                                Are you sure you want to delete your uploaded Data?
                            </Text>
                            <GradientBorderBoxButton
                                pressableStyle={{height:"20%", width: "60%", marginBottom: "5%"}}
                                colors={[DARK_RED_TONE, RED_TONE]}
                                onPress={async () => {
                                    console.log("Confirmed Deletion.")
                                    const request = async () => {
                                        const token = getAccessToken();
                                        return await fetch(deleteUrl(), {
                                            method: "DELETE",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "Authorization": `Bearer ${token}`,
                                            }
                                        });
                                    }
                                    const response = await request();
                                    if(response.status === 200) {

                                    }
                                    if(response.status === 401) {
                                        const refreshToken = getRefreshToken();
                                        if(refreshToken) {
                                            await getNewAccessToken(refreshToken);
                                             const retry = await request()
                                        }
                                    }

                                }}
                                backgroundColor={"#000000"}
                            >
                                <Text style={{color:RED_TONE}}>CONFIRM DELETE</Text>
                            </GradientBorderBoxButton>
                        </GradientBorderBox>
                    </View>
                </Modal>
            </View>
        </View>
    );
}
