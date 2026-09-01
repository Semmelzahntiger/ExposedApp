import {StyleSheet} from "react-native";
import {ACCENT, MUTED, SURFACE} from "@/styles/room_style";

export const settings_style = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#000000",
    },
    // ---- back button (top-left) ----
    backButton: {
        position: "absolute",
        height: 44,
        width: 44,
        borderRadius: 14,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: MUTED,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    backIcon: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
    },
    // ---- content ----
    content: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 16,
    },
    screenTitle: {
        color: "#FFFFFF",
        fontSize: 26,
        fontWeight: "800",
    },
    // ---- primary button ----
    primaryButton: {
        height: 56,
        borderRadius: 14,
        backgroundColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
    },
    // ---- select-file button (outlined) ----
    selectButton: {
        height: 56,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: ACCENT,
        backgroundColor: SURFACE,
        alignItems: "center",
        justifyContent: "center",
    },
    selectButtonText: {
        color: ACCENT,
        fontSize: 16,
        fontWeight: "600",
    },
    selectedFileText: {
        color: "#8a90a0",
        fontSize: 15,
    },
    // ---- section ----
    sectionTitle: {
        color: ACCENT,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    // ---- radio ----
    radioRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 8,
    },
    radioRing: {
        height: 24,
        width: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
    },
    radioDot: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: ACCENT,
    },
    radioLabel: {
        color: "#FFFFFF",
        fontSize: 16,
    },
    // ---- disabled state ----
    disabled: {
        opacity: 0.4,
    },
});
