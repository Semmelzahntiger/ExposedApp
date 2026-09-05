import {useState} from "react";
import {ActivityIndicator, Pressable, Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router} from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import {EmbedPlatform} from "@/main/GameData";
import {settings_style} from "@/styles/settings_style";
import {getAccessToken, getNewAccessToken, getRefreshToken, setAccessToken} from "@/main/account_data";
import {uploadUrl} from "@/config/endpoints";
import * as FileSystem from "expo-file-system/legacy";
import {ThemedRadio} from "@/components/ThemedRadio";

function onUploadUnauthorized() {
    console.log("Upload failed: unauthorized (token refresh did not help)");
}

async function upload(file: DocumentPicker.DocumentPickerAsset, platform: EmbedPlatform) {
    const token = getAccessToken();
    if (!token) {
        onUploadUnauthorized();
        return;
    }

    // Build the multipart body fresh per attempt (a consumed FormData can't be re-sent).
    // Note: do NOT set Content-Type — fetch adds the multipart boundary itself.
    const send = async (bearer: string) => {
        return await FileSystem.uploadAsync(uploadUrl(), file.uri, {
            httpMethod: "POST",
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: "file",
            mimeType: file.mimeType ?? "application/octet-stream",
            parameters: {declaredFileType: platform}, // other form fields go here
            headers: {Authorization: `Bearer ${bearer}`},
        }); // { status, headers, body, mimeType }
    };

    let response = await send(token);

    // 401 -> try to refresh the access token once, then retry.
    if (response.status === 401) {
        const refreshToken = getRefreshToken();
        const refreshed = refreshToken ? await getNewAccessToken(refreshToken) : null;
        if (!refreshed?.token) {
            onUploadUnauthorized();
            return;
        }
        setAccessToken(refreshed.token);
        response = await send(refreshed.token);
        if (response.status === 401) {
            onUploadUnauthorized();
            return;
        }
    }

    if (!(response.status === 200)) {
        console.log("Upload failed:", response);
        return;
    }

    console.log("Upload successful");
}

export default function Upload() {
    const insets = useSafeAreaInsets();

    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [platform, setPlatform] = useState<EmbedPlatform | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickFile = async () => {
        const res = await DocumentPicker.getDocumentAsync({type: "*/*", copyToCacheDirectory: true});
        if (!res.canceled) {
            setFile(res.assets[0]);
        }
    };
    const canUpload = file !== null && platform !== null && !uploading;

    const submit = async () => {
        if (!file || !platform || uploading) return;
        setUploading(true);
        try {
            await upload(file, platform);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={settings_style.root}>
            {/* Top-left: explicit back */}
            <Pressable
                style={[settings_style.backButton, {top: insets.top + 12, left: 16}]}
                onPress={() => router.back()}
            >
                <Text style={settings_style.backIcon}>←</Text>
            </Pressable>

            <View style={[settings_style.content, {paddingTop: insets.top + 72, paddingBottom: insets.bottom + 20}]}>
                <Text style={settings_style.screenTitle}>Upload</Text>

                {/* File selection */}
                <Pressable style={settings_style.selectButton} onPress={pickFile}>
                    <Text style={settings_style.selectButtonText}>Select File</Text>
                </Pressable>
                <Text style={settings_style.selectedFileText} numberOfLines={1}>
                    {file ? file.name : "No file selected"}
                </Text>

                {/* Platform selection */}
                <Text style={settings_style.sectionTitle}>Platform</Text>
                <ThemedRadio label="TikTok" selected={platform === "tiktok"} onSelect={() => setPlatform("tiktok")}/>
                <ThemedRadio label="Instagram" selected={platform === "instagram"} onSelect={() => setPlatform("instagram")}/>

                {/* Submit (stub) */}
                <Pressable
                    style={[settings_style.primaryButton, !canUpload && settings_style.disabled]}
                    disabled={!canUpload}
                    onPress={submit}
                >
                    {uploading
                        ? <ActivityIndicator color="#FFFFFF"/>
                        : <Text style={settings_style.primaryButtonText}>Upload</Text>}
                </Pressable>
            </View>
        </View>
    );
}
