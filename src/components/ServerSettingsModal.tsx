import {useEffect, useState} from "react";
import {Modal, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import {BLUE_TONE, WHITE_TONE} from "@/styles/colors";
import {getServerOrigin, saveServerConfig} from "@/config/endpoints";

const SURFACE = "#111318";
const MUTED = "#2a2f3a";
const TEXT_DIM = "#8a90a0";

type Props = {
    visible: boolean;
    onClose: () => void;
    // Called only when the chosen origin actually changed, so the caller can clear
    // the current session (a token from the old server is invalid on the new one).
    onServerChanged: (origin: string) => void;
};

// Lets the user point the app at any self-hosted backend. The single origin (e.g.
// http://192.168.178.24:8090) is normalized + persisted by saveServerConfig, which
// derives both the API and WebSocket bases from it.
export function ServerSettingsModal({visible, onClose, onServerChanged}: Props) {
    const [input, setInput] = useState(getServerOrigin());

    // Re-seed from the live origin each time the modal opens.
    useEffect(() => {
        if (visible) setInput(getServerOrigin());
    }, [visible]);

    const canSave = input.trim().length > 0;

    const save = async () => {
        const trimmed = input.trim();
        if (trimmed.length === 0) return;
        const previous = getServerOrigin();
        await saveServerConfig(trimmed);
        const next = getServerOrigin(); // normalized form
        if (next !== previous) onServerChanged(next);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={s.backdrop}>
                {/* Tapping outside the card closes it */}
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose}/>

                <View style={s.card}>
                    <Text style={s.title}>Server</Text>
                    <Text style={s.current} numberOfLines={1}>Current: {getServerOrigin()}</Text>

                    <Text style={s.label}>Server URL</Text>
                    <Text style={s.hint}>e.g. http://192.168.178.24:8090 — the app adds /api and /game.</Text>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="http://host:port"
                        placeholderTextColor={TEXT_DIM}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        style={s.input}
                    />

                    <View style={s.actions}>
                        <Pressable style={s.close} onPress={onClose}>
                            <Text style={s.closeText}>Cancel</Text>
                        </Pressable>
                        <Pressable style={[s.save, !canSave && s.disabled]} disabled={!canSave} onPress={save}>
                            <Text style={s.saveText}>Save</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    card: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: SURFACE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BLUE_TONE,
        padding: 20,
        gap: 6,
    },
    title: {
        color: WHITE_TONE,
        fontSize: 20,
        fontWeight: "700",
    },
    current: {
        color: TEXT_DIM,
        fontSize: 13,
        marginBottom: 6,
    },
    label: {
        color: BLUE_TONE,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginTop: 8,
    },
    hint: {
        color: TEXT_DIM,
        fontSize: 12,
        marginBottom: 4,
    },
    input: {
        backgroundColor: "#000000",
        borderWidth: 1,
        borderColor: MUTED,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: WHITE_TONE,
        fontSize: 15,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 16,
    },
    close: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    closeText: {
        color: TEXT_DIM,
        fontSize: 16,
    },
    save: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: BLUE_TONE,
        alignItems: "center",
        justifyContent: "center",
    },
    saveText: {
        color: WHITE_TONE,
        fontSize: 16,
        fontWeight: "600",
    },
    disabled: {
        opacity: 0.4,
    },
});
